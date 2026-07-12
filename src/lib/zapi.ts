// Funções para interagir com a API da Z-API

export async function sendWhatsAppMessage(phone: string, message: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    console.warn("Z-API credentials not configured. Mocking WhatsApp send.");
    console.log(`[Mock Z-API] Sending to ${phone}: ${message}`);
    return { success: true, mock: true };
  }

  try {
    // A Z-API geralmente tem um endpoint como:
    // https://api.z-api.io/instances/YOUR_INSTANCE/token/YOUR_TOKEN/send-text
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

    // Formata o número (remover caracteres não numéricos, garantir DDI se necessário)
    // Z-API exige o formato com código do país. Ex: 5511999999999
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: finalPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Z-API Error:", errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send WhatsApp message via Z-API:", error);
    return { success: false, error: error.message };
  }
}
