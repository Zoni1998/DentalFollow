// Funções para interagir com a Evolution API (Substituta gratuita da Z-API)

export async function sendWhatsAppMessage(phone: string, message: string) {
  // Variáveis de ambiente da Evolution API
  const apiUrl = process.env.EVOLUTION_API_URL; 
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "Padrao";

  if (!apiUrl || !apiKey) {
    console.warn("Evolution API credentials not configured. Mocking WhatsApp send.");
    console.log(`[Mock Evolution API] Sending to ${phone}: ${message}`);
    return { success: true, mock: true };
  }

  try {
    // Remove a barra no final da URL, caso exista, para evitar URLs malformadas
    const baseUrl = apiUrl.replace(/\/$/, "");
    
    // O endpoint da Evolution API para envio de texto é:
    // POST /message/sendText/:instanceName
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    // Formata o número: remove caracteres não numéricos e garante o DDI 55
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey // A Evolution API usa o header 'apikey'
      },
      body: JSON.stringify({
        number: finalPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution API Error:", errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send WhatsApp message via Evolution API:", error);
    return { success: false, error: error.message };
  }
}
