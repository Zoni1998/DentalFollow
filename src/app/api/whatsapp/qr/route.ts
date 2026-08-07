import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 12_000;
const LOGOUT_TIMEOUT_MS = 20_000;
const QR_ATTEMPTS = 5;

type EvolutionConfig = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  encodedInstanceName: string;
};

function getEvolutionConfig(): EvolutionConfig | null {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = (process.env.EVOLUTION_INSTANCE_NAME || "Padrao").trim();

  if (!apiUrl || !apiKey) return null;

  return {
    baseUrl: apiUrl.replace(/\/$/, ""),
    apiKey,
    instanceName,
    encodedInstanceName: encodeURIComponent(instanceName),
  };
}

async function evolutionFetch(
  url: string,
  apiKey: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: apiKey,
      ...init.headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(data: any, fallback: string) {
  const responseMessage = data?.response?.message;

  if (Array.isArray(responseMessage)) return responseMessage.join(", ");
  if (typeof responseMessage === "string") return responseMessage;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

function extractQrCode(data: any): string | null {
  return (
    data?.base64 ||
    data?.qrcode?.base64 ||
    data?.qrcode?.base64Code ||
    null
  );
}

async function fetchConnectionState(
  config: EvolutionConfig,
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  return evolutionFetch(
    `${config.baseUrl}/instance/connectionState/${config.encodedInstanceName}`,
    config.apiKey,
    {},
    timeoutMs
  );
}

async function fetchQrCode(
  config: EvolutionConfig,
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  const response = await evolutionFetch(
    `${config.baseUrl}/instance/connect/${config.encodedInstanceName}`,
    config.apiKey,
    {},
    timeoutMs
  );
  const data = await readResponse(response);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(data, `Evolution API recusou o QR Code (${response.status})`)
    );
    Object.assign(error, { status: response.status });
    throw error;
  }

  return extractQrCode(data);
}

async function logoutExistingInstance(config: EvolutionConfig) {
  try {
    const logoutResponse = await evolutionFetch(
      `${config.baseUrl}/instance/logout/${config.encodedInstanceName}`,
      config.apiKey,
      { method: "DELETE" },
      LOGOUT_TIMEOUT_MS
    );
    const logoutData = await readResponse(logoutResponse);

    if (logoutResponse.status === 404) return "missing" as const;

    if ([200, 201, 204].includes(logoutResponse.status)) {
      return "confirmed" as const;
    }

    // Algumas versões encerram a sessão, mas o proxy responde 400/5xx depois.
    // O estado real será consultado antes de informar uma falha.
    if ([400, 409, 500, 502, 503, 504].includes(logoutResponse.status)) {
      return "uncertain" as const;
    }

    if (!logoutResponse.ok) {
      throw new Error(
        getErrorMessage(logoutData, `Falha ao desvincular o WhatsApp (${logoutResponse.status})`)
      );
    }
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    if (timedOut) return "uncertain" as const;
    throw error;
  }

  return "confirmed" as const;
}

function notConfiguredResponse() {
  return NextResponse.json({
    connected: false,
    error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.",
    mock: true,
  });
}

/**
 * GET /api/whatsapp/qr
 * Consulta o estado atual sem recriar ou apagar a instância.
 */
export async function GET() {
  const config = getEvolutionConfig();
  if (!config) return notConfiguredResponse();

  try {
    const stateResponse = await fetchConnectionState(config);
    const stateData = await readResponse(stateResponse);

    if ([400, 404].includes(stateResponse.status)) {
      return NextResponse.json({ connected: false });
    }

    if (!stateResponse.ok) {
      return NextResponse.json(
        {
          connected: false,
          error: getErrorMessage(
            stateData,
            `Não foi possível consultar a Evolution API (${stateResponse.status})`
          ),
        },
        { status: stateResponse.status === 401 || stateResponse.status === 403 ? 401 : 502 }
      );
    }

    const state = stateData?.instance?.state || stateData?.state;

    if (state === "open") {
      const instanceResponse = await evolutionFetch(
        `${config.baseUrl}/instance/fetchInstances?instanceName=${config.encodedInstanceName}`,
        config.apiKey
      );
      const instanceData = await readResponse(instanceResponse);
      const ownerJid = Array.isArray(instanceData) ? instanceData?.[0]?.ownerJid || "" : "";

      return NextResponse.json({
        connected: true,
        phone: ownerJid.split("@")[0] || "Conectado",
      });
    }

    if (state === "connecting") {
      const qrcode = await fetchQrCode(config);
      return NextResponse.json({ connected: false, qrcode, pending: !qrcode });
    }

    return NextResponse.json({ connected: false });
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return NextResponse.json(
      {
        connected: false,
        error: timedOut
          ? "A Evolution API demorou demais para responder. Tente novamente."
          : error?.message || "Falha ao consultar a Evolution API.",
      },
      { status: 504 }
    );
  }
}

/**
 * POST /api/whatsapp/qr
 * Desvincula a conta anterior e gera um QR novo na mesma instância.
 */
export async function POST() {
  const config = getEvolutionConfig();
  if (!config) return notConfiguredResponse();

  try {
    const logoutResult = await logoutExistingInstance(config);

    if (logoutResult !== "missing") {
      await new Promise((resolve) => setTimeout(resolve, 1_200));

      try {
        const qrcode = await fetchQrCode(config, 15_000);
        if (qrcode) {
          return NextResponse.json({ connected: false, qrcode, switched: true });
        }
      } catch (error: any) {
        if ([401, 403].includes(error?.status)) throw error;
        // Se a sessão ainda estiver terminando, a tela continuará consultando o estado.
      }

      try {
        const stateResponse = await fetchConnectionState(config, 8_000);
        const stateData = await readResponse(stateResponse);
        const state = stateData?.instance?.state || stateData?.state;

        if (state === "open") {
          return NextResponse.json(
            {
              connected: true,
              error: "A conta anterior ainda está sendo desvinculada. Aguarde alguns segundos e tente novamente.",
            },
            { status: 409 }
          );
        }

        if (![400, 404].includes(stateResponse.status)) {
          return NextResponse.json(
            {
              connected: false,
              pending: true,
              message: "A conta anterior foi desvinculada e o QR Code está sendo preparado.",
            },
            { status: 202 }
          );
        }
      } catch (error: any) {
        const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
        if (!timedOut) throw error;

        return NextResponse.json(
          {
            connected: false,
            pending: true,
            message: "A troca foi solicitada. Aguardando a Evolution liberar o novo QR Code.",
          },
          { status: 202 }
        );
      }
    }

    const createResponse = await evolutionFetch(
      `${config.baseUrl}/instance/create`,
      config.apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: config.instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      }
    );
    const createData = await readResponse(createResponse);

    if (!createResponse.ok) {
      return NextResponse.json(
        {
          connected: false,
          error: getErrorMessage(
            createData,
            `Falha ao criar uma nova instância (${createResponse.status})`
          ),
        },
        { status: createResponse.status === 401 || createResponse.status === 403 ? 401 : 502 }
      );
    }

    const createQrCode = extractQrCode(createData);
    if (createQrCode) {
      return NextResponse.json({ connected: false, qrcode: createQrCode });
    }

    for (let attempt = 0; attempt < QR_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const qrcode = await fetchQrCode(config);
      if (qrcode) {
        return NextResponse.json({ connected: false, qrcode });
      }
    }

    return NextResponse.json(
      {
        connected: false,
        pending: true,
        message: "A nova instância foi criada e o QR Code ainda está sendo preparado.",
      },
      { status: 202 }
    );
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return NextResponse.json(
      {
        connected: false,
        error: timedOut
          ? "A Evolution API demorou demais para responder durante a troca."
          : error?.message || "Falha ao criar uma nova instância.",
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}

/**
 * DELETE /api/whatsapp/qr
 * Faz logout para remover as credenciais da conta antiga.
 */
export async function DELETE() {
  const config = getEvolutionConfig();
  if (!config) return NextResponse.json({ success: true, mock: true });

  try {
    const logoutResult = await logoutExistingInstance(config);
    if (logoutResult === "missing") {
      return NextResponse.json({ success: true, disconnected: true });
    }

    await new Promise((resolve) => setTimeout(resolve, 1_200));

    try {
      const verificationResponse = await fetchConnectionState(config, 8_000);
      const verificationData = await readResponse(verificationResponse);
      const state = verificationData?.instance?.state || verificationData?.state;

      if (state === "open") {
        return NextResponse.json(
          { success: false, error: "O WhatsApp ainda está conectado. Tente novamente em alguns segundos." },
          { status: 409 }
        );
      }
    } catch (error: any) {
      const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
      if (!timedOut || logoutResult === "uncertain") throw error;
    }

    return NextResponse.json({ success: true, disconnected: true });
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? "A Evolution API demorou demais para confirmar a desconexão."
          : error?.message || "Falha ao remover a instância antiga.",
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}

