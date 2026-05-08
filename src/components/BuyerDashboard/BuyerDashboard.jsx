import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { isCityCovered } from '../../services/coverage';
import { createPaymentPreference, cancelPurchase } from '../../services/payment';
import styles from './BuyerDashboard.module.css';

const BuyerDashboard = ({ user, onClose }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBids();
  }, [user.id]);

  const fetchMyBids = async () => {
    try {
      // Buscamos las subastas donde el usuario ha pujado
      const { data, error } = await supabase
        .from('bids')
        .select(`
          auction_id,
          amount,
          created_at,
          auction:auction_id (
            id,
            title,
            current_price,
            last_bidder_id,
            current_winner_id,
            status,
            payment_status,
            location,
            image_url,
            end_at,
            seller:seller_id (phone, username)
          )
          )
        `)
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupamos por subasta para no repetir
      const uniqueAuctions = [];
      const seen = new Set();
      
      data.forEach(bid => {
        if (!seen.has(bid.auction_id)) {
          seen.add(bid.auction_id);
          uniqueAuctions.push(bid.auction);
        }
      });

      setBids(uniqueAuctions);
    } catch (error) {
      console.error('Error fetching my bids:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (endAt) => {
    const difference = new Date(endAt) - new Date();
    if (difference <= 0) return 'Finalizada';
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Mis Participaciones</h2>
        <button className={styles.close_btn} onClick={onClose}>Cerrar</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando tus pujas...</div>
      ) : bids.length === 0 ? (
        <div className={styles.empty}>
          <p>No has pujado en ninguna subasta todavía.</p>
          <button className={styles.explore_btn} onClick={onClose}>Explorar Subastas</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {bids.map((auction) => {
            const isWinner = (auction.current_winner_id || auction.last_bidder_id) === user.id;
            return (
              <div key={auction.id} className={`${styles.card} ${isWinner ? styles.winning : styles.outbid}`}>
                <div className={styles.card_img}>
                  <img src={auction.image_url} alt={auction.title} />
                  <div className={styles.timer}>{calculateTimeLeft(auction.end_at)}</div>
                </div>
                
                <div className={styles.card_info}>
                  <h3>{auction.title}</h3>
                  <div className={styles.price_row}>
                    <label>Precio Actual:</label>
                    <span>${auction.current_price}</span>
                  </div>
                  
                  <div className={styles.status_badge}>
                    {isWinner ? (
                      <span className={styles.status_win}>🏆 Vas ganando / Ganaste</span>
                    ) : (
                      <span className={styles.status_lost}>⚠️ TE SUPERARON</span>
                    )}
                  </div>

                  {auction.status === 'finished' && isWinner && auction.payment_status === 'pending' && (
                    <div className={styles.winner_actions}>
                      <p className={styles.winner_text}>¡FELICIDADES! Tienes la oportunidad de compra.</p>
                      
                      <div className={styles.shipping_box}>
                        {isCityCovered(auction.location) ? (
                          <button className={styles.shipping_btn}>
                            🛵 Pedir Envío Motomandados
                          </button>
                        ) : (
                          <div className={styles.no_coverage}>
                            <p>Aún no tenemos Motomandados en <b>{auction.location || 'esta zona'}</b>.</p>
                            <button className={styles.partner_btn}>
                              🤝 ¡Quiero ser prestador de Motomandados aquí!
                            </button>
                          </div>
                        )}
                      </div>

                      <button 
                        className={styles.pay_btn}
                        onClick={() => createPaymentPreference(auction)}
                      >
                        💳 Pagar con Mercado Pago
                      </button>

                      <button 
                        className={styles.cancel_btn}
                        onClick={() => {
                          if(confirm('¿Seguro que quieres cancelar? Perderás la oportunidad y pasará al siguiente postor.')) {
                            cancelPurchase(auction.id, user.id).then(() => fetchMyBids());
                          }
                        }}
                      >
                        ❌ Cancelar Compra
                      </button>
                    </div>
                  )}

                  {auction.status === 'finished' && isWinner && auction.payment_status === 'paid' && (
                    <div className={styles.winner_actions}>
                      <p className={styles.success_text} style={{color: 'green', fontWeight: 'bold'}}>✅ Pago confirmado. Coordina la entrega.</p>
                      
                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
                        <a 
                          href={`https://wa.me/${auction.seller?.phone}?text=Hola ${auction.seller?.username}, soy ${userProfile?.username || 'el comprador'}, ya pagué la subasta de ${auction.title}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{background: '#25D366', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold'}}
                        >
                          📱 Contactar al Vendedor por WhatsApp
                        </a>

                        <button 
                          style={{background: '#007bff', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}
                          onClick={async () => {
                            if(confirm('¿Confirmas que ya tienes el producto en tus manos? Esto le liberará el dinero al vendedor. ¡No presiones esto si no tienes el producto!')) {
                              await supabase.from('auctions').update({ payment_status: 'delivered' }).eq('id', auction.id);
                              fetchMyBids();
                            }
                          }}
                        >
                          🛍️ Confirmar Recepción del Producto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
