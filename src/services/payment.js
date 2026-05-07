import { supabase } from './supabase';

export const createPaymentPreference = async (auction) => {
  try {
    // Llamamos a nuestra Edge Function de Supabase (que crearemos en el siguiente paso)
    const { data, error } = await supabase.functions.invoke('create-preference', {
      body: { 
        auction_id: auction.id,
        title: auction.title,
        price: auction.current_price,
        image_url: auction.image_url
      }
    });

    if (error) throw error;

    // Redirigimos al usuario al punto de pago de Mercado Pago
    if (data?.init_point) {
      window.location.href = data.init_point;
    }
  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    alert('Hubo un error al conectar con Mercado Pago. Intenta de nuevo.');
  }
};

export const cancelPurchase = async (auctionId, userId) => {
  try {
    // 1. Obtener el historial de pujas para buscar al segundo mejor postor
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('bidder_id, amount')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(2);

    if (bidsError) throw bidsError;

    const secondBidder = bids.length > 1 ? bids[1] : null;

    if (secondBidder) {
      // 2. Si hay un segundo postor, le pasamos la corona
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          current_winner_id: secondBidder.bidder_id,
          current_price: secondBidder.amount,
          payment_status: 'pending',
          payment_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h más
        })
        .eq('id', auctionId);

      if (updateError) throw updateError;
      alert('Compra cancelada. La oportunidad ha pasado al segundo mejor postor.');
    } else {
      // 3. Si no hay nadie más, la subasta queda expirada para republicar
      await supabase
        .from('auctions')
        .update({ payment_status: 'expired', current_winner_id: null })
        .eq('id', auctionId);
      alert('Compra cancelada. No hay otros postores, la subasta se ha cerrado.');
    }
  } catch (error) {
    console.error('Error al cancelar la compra:', error);
  }
};
