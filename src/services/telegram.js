const BOT_TOKEN = '8338654658:AAEfN0Hko7-RC-2k43JLUwBPc3UtfRqdxZA';
const CHAT_ID = '6200504487';

export const sendTelegramNotification = async (auctionData, sellerUsername) => {
  const message = `
<b>🔔 ¡NUEVA SUBASTA PENDIENTE! 🔔</b>

<b>📦 Producto:</b> ${auctionData.title}
<b>💰 Precio Base:</b> $${auctionData.startPrice}
<b>👤 Vendedor:</b> ${sellerUsername}
<b>⏱️ Cierra el:</b> ${new Date(auctionData.endAt).toLocaleString()}

<i>🚀 Revisa el Panel Admin para aprobarla.</i>
  `;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    if (response.ok) {
      console.log('✅ Notificación de Telegram enviada con éxito');
    } else {
      const errorData = await response.json();
      console.error('❌ Error de Telegram API:', errorData);
    }
  } catch (error) {
    console.error('❌ Error de red al contactar a Telegram:', error);
  }
};
