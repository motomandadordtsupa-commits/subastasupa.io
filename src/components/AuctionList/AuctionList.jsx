import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import BidModal from '../BidModal/BidModal';
import styles from './AuctionList.module.css';

const AuctionList = ({ session }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);
  const [historyBids, setHistoryBids] = useState([]);
  const [buyerCoords, setBuyerCoords] = useState(null);

  useEffect(() => {
    fetchActiveAuctions();
    getUserLocation();

    const subscription = supabase
      .channel('public:auctions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, payload => {
        fetchActiveAuctions();
      })
      .subscribe();

    const timer = setInterval(() => {
      setAuctions(current => {
        current.forEach(auction => {
          const isExpired = new Date(auction.end_at) <= new Date();
          if (isExpired && auction.status === 'active') {
            handleAuctionEnd(auction.id);
          }
        });
        return [...current];
      });
    }, 1000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(timer);
    };
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setBuyerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTimeLeft = (endAt) => {
    const difference = new Date(endAt) - new Date();
    if (difference <= 0) return null;

    const hours = Math.floor((difference / (1000 * 60 * 60)));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleAuctionEnd = async (auctionId) => {
    await supabase.from('auctions').update({ status: 'finished' }).eq('id', auctionId);
    fetchActiveAuctions();
  };

  const fetchActiveAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          seller:seller_id (username),
          leader:last_bidder_id (username)
        `)
        .eq('status', 'active')
        .order('end_at', { ascending: true });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBidClick = (auction) => {
    if (!session) {
      alert("Debes iniciar sesión para poder pujar.");
      return;
    }
    if (auction.seller_id === session.user.id) {
      alert("No puedes pujar por tu propio producto.");
      return;
    }
    setSelectedAuction(auction);
  };

  const toggleHistory = async (auctionId) => {
    if (activeHistory === auctionId) {
      setActiveHistory(null);
      setHistoryBids([]);
    } else {
      setActiveHistory(auctionId);
      const { data, error } = await supabase
        .from('bids')
        .select('*, bidder:bidder_id(username)')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });
      
      if (!error) setHistoryBids(data);
    }
  };

  const handlePayment = async (auction) => {
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: auction.title,
          price: auction.current_price,
          auctionId: auction.id
        })
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (error) {
      console.error('Error al iniciar el pago:', error);
      alert('Hubo un error al procesar el pago. Intenta de nuevo.');
    }
  };

  return (
    <div className={`${styles.list_container} container`}>
      <h2 className={styles.list_title}>Subastas en Vivo</h2>
      
      {loading ? (
        <div className={styles.loading}>Buscando tesoros cercanos...</div>
      ) : auctions.filter(a => {
          if (!buyerCoords || !a.lat) return true;
          const dist = getDistance(buyerCoords.lat, buyerCoords.lng, a.lat, a.lng);
          return dist <= 50;
        }).length === 0 ? (
        <div className={styles.empty}>No hay subastas a menos de 50km de tu ubicación actual.</div>
      ) : (
        <div className={styles.grid}>
          {auctions
            .filter(a => {
              if (!buyerCoords || !a.lat) return true;
              const dist = getDistance(buyerCoords.lat, buyerCoords.lng, a.lat, a.lng);
              return dist <= 50;
            })
            .map((auction) => {
              const distance = buyerCoords && auction.lat 
                ? getDistance(buyerCoords.lat, buyerCoords.lng, auction.lat, auction.lng) 
                : null;
              
              return (
                <div key={auction.id} className={styles.card}>
                  <div className={styles.card__image_container}>
                    {auction.image_url ? (
                      <img src={auction.image_url} alt={auction.title} className={styles.card__image} />
                    ) : (
                      <div className={styles.card__image_placeholder}>Sin imagen</div>
                    )}
                    <div className={styles.card__badge}>Activa</div>
                    
                    {distance && (
                      <div className={styles.distance_badge}>
                        📍 a {distance.toFixed(1)} km
                      </div>
                    )}
                    
                    {calculateTimeLeft(auction.end_at) ? (
                      <div className={styles.timer_badge}>
                        ⌛ {calculateTimeLeft(auction.end_at)}
                      </div>
                    ) : (
                      <div className={styles.finished_badge}>
                        FINALIZADA
                      </div>
                    )}
                  </div>

              <div className={styles.card__content}>
                <h3 className={styles.card__title}>{auction.title}</h3>
                <div className={styles.card__info}>
                  <p className={styles.card__seller}>📍 {auction.location || 'Ubicación no especificada'}</p>
                  <p className={styles.card__seller}>Vendedor: {auction.seller?.username || 'Desconocido'}</p>
                  {auction.leader && (
                    <p className={styles.card__leader}>
                      🏆 Ganando: <span>{auction.leader.username}</span>
                    </p>
                  )}
                  {session && auction.last_bidder_id === session.user.id && (
                    <p className={styles.status_winning}>¡Vas ganando! ✨</p>
                  )}
                  {session && auction.last_bidder_id !== session.user.id && auction.leader && (
                    <p className={styles.status_outbid}>¡TE ESTÁN GANANDO! 😱</p>
                  )}
                </div>
                
                <div className={styles.price_box}>
                  <p className={styles.price_label}>Precio Actual:</p>
                  <p className={styles.price_value}>${auction.current_price}</p>
                </div>

                <div className={styles.actions}>
                  <button 
                    className={styles.bid_btn} 
                    onClick={() => handleBidClick(auction)}
                    disabled={!calculateTimeLeft(auction.end_at)}
                  >
                    {calculateTimeLeft(auction.end_at) 
                      ? `Pujar (Mín. $${auction.current_price + 500})`
                      : 'Subasta Finalizada'
                    }
                  </button>
                  
                  <button 
                    className={styles.history_toggle}
                    onClick={() => toggleHistory(auction.id)}
                  >
                    {activeHistory === auction.id ? 'Ocultar Actividad' : 'Ver Actividad'}
                  </button>

                  {/* BOTÓN DE PAGO PARA EL GANADOR */}
                  {!calculateTimeLeft(auction.end_at) && session && auction.last_bidder_id === session.user.id && (
                    <button 
                      className={styles.pay_btn}
                      onClick={() => handlePayment(auction)}
                    >
                      💳 Pagar con Mercado Pago
                    </button>
                  )}
                </div>

                {activeHistory === auction.id && (
                  <div className={styles.history_panel}>
                    <h4>Últimos movimientos:</h4>
                    {historyBids.length === 0 ? (
                      <p className={styles.no_bids}>Sin ofertas todavía</p>
                    ) : (
                      <ul className={styles.history_list}>
                        {historyBids.map((bid, i) => (
                          <li key={i} className={i === 0 ? styles.last_bid : ''}>
                            <span className={styles.bid_user}>{bid.bidder.username}</span>
                            <span className={styles.bid_amount}>${bid.amount}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
                </div>
              );
            })}
        </div>
      )}

      {selectedAuction && (
        <BidModal
          auction={selectedAuction}
          user={session.user}
          onClose={() => setSelectedAuction(null)}
        />
      )}
    </div>
  );
};

export default AuctionList;
