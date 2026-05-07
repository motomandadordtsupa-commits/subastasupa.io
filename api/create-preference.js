import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });

  const preference = new Preference(client);

  try {
    const { title, price, auctionId } = req.body;

    const result = await preference.create({
      body: {
        items: [
          {
            id: auctionId,
            title: title,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${req.headers.origin}/payment-success`,
          failure: `${req.headers.origin}/payment-failure`,
          pending: `${req.headers.origin}/payment-pending`,
        },
        auto_return: 'approved',
        notification_url: `${req.headers.origin}/api/webhooks`,
        metadata: {
          auction_id: auctionId,
        },
      },
    });

    res.status(200).json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
