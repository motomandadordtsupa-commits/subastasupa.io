import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import styles from './SellerDashboard.module.css';

const SellerDashboard = ({ user, onClose }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0);

  useEffect(() => {
    fetchMyAuctions();
    fetchSettings();
  }, [user.id]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'commission_rate').single();
    if (data) setCommissionRate(data.value);
  };

  const fetchMyAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          leader:last_bidder_id (username),
          winner:current_winner_id (username, phone)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error fetching my auctions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: '⏳ Pendiente', class: styles.status_pending },
      active: { text: '🟢 Activa', class: styles.status_active },
      rejected: { text: '🔴 Rechazada', class: styles.status_rejected },
      finished: { text: '🏁 Finalizada', class: styles.status_finished }
    };
    return labels[status] || { text: status, class: '' };
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Mis Subastas</h2>
        <button className={styles.close_btn} onClick={onClose}>Cerrar Panel</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando tus productos...</div>
      ) : auctions.length === 0 ? (
        <div className={styles.empty}>
          <p>Aún no has publicado ningún producto.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {auctions.map((auction) => {
            const statusInfo = getStatusLabel(auction.status);
            return (
              <div key={auction.id} className={styles.item}>
                <div className={styles.item_image}>
                  {auction.image_url ? (
                    <img src={auction.image_url} alt={auction.title} />
                  ) : (
                    <div className={styles.placeholder}>📸</div>
                  )}
                </div>
                
                <div className={styles.item_details}>
                  <h3>{auction.title}</h3>
                  <div className={styles.badges}>
                    <span className={statusInfo.class}>{statusInfo.text}</span>
                  </div>
                </div>

                <div className={styles.item_stats}>
                  <div className={styles.stat}>
                    <label>Precio Actual</label>
                    <p>${auction.current_price}</p>
                  </div>
                  <div className={styles.stat}>
                    <label>Líder Actual</label>
                    <p>{auction.leader?.username || 'Sin pujas'}</p>
                  </div>
                  <div className={styles.stat}>
                    <label>Neto a recibir</label>
                    <p className={styles.net_highlight}>${auction.current_price - (auction.current_price * commissionRate / 100)}</p>
                  </div>
                </div>

                {auction.payment_status === 'paid' && (
                  <div style={{marginTop: '15px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba'}}>
                    <p style={{color: '#856404', margin: '0 0 10px 0', fontSize: '0.9rem'}}>
                      ⚠️ <b>¡Importante!</b> Al momento de entregar el producto, pídele al comprador que presione el botón <i>"Confirmar Recepción"</i> en su aplicación. Sin esa confirmación, tu dinero seguirá retenido.
                    </p>
                    <a 
                      href={`https://wa.me/${auction.winner?.phone}?text=Hola ${auction.winner?.username}, soy el vendedor de la subasta de ${auction.title}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{display: 'block', background: '#25D366', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold'}}
                    >
                      📱 Contactar al Comprador por WhatsApp
                    </a>
                  </div>
                )}

                {auction.payment_status === 'delivered' && (
                  <div style={{marginTop: '15px', padding: '15px', background: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb'}}>
                    <p style={{color: '#155724', margin: '0', textAlign: 'center'}}>
                      ✅ <b>Producto Entregado.</b> Tu dinero está en proceso de liquidación.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
