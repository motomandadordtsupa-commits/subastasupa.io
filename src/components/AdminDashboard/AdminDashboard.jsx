import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'settlements'
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [commissionRate, setCommissionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Obtener settings (comisión)
      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'commission_rate').single();
      if (settingsData) setCommissionRate(settingsData.value);

      // 2. Obtener subastas pendientes
      const { data: pendingData } = await supabase
        .from('auctions')
        .select(`*, profiles:seller_id (username)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPendingAuctions(pendingData || []);

      // 3. Obtener liquidaciones (pagadas por MP o entregadas)
      const { data: settleData } = await supabase
        .from('auctions')
        .select(`*, seller:seller_id (username, phone, payment_alias)`)
        .in('payment_status', ['paid', 'delivered'])
        .order('updated_at', { ascending: false });
      setSettlements(settleData || []);

    } catch (error) {
      console.error('Error cargando datos del panel:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setPendingAuctions(pendingAuctions.filter(a => a.id !== id));
      alert(`Subasta ${newStatus === 'active' ? 'aprobada' : 'rechazada'} con éxito.`);
    } catch (error) {
      alert('Hubo un error al actualizar la subasta.');
    }
  };

  const markAsSettled = async (id) => {
    if (!confirm('¿Confirmas que ya le transferiste el dinero al vendedor a su cuenta? Esta acción es irreversible.')) return;
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ payment_status: 'settled' })
        .eq('id', id);

      if (error) throw error;
      setSettlements(settlements.filter(a => a.id !== id));
      alert('Liquidación marcada como completada.');
    } catch (error) {
      alert('Hubo un error al liquidar.');
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>Cargando panel...</div>;
  }

  return (
    <section className={`container ${styles.admin}`}>
      <div className={styles.admin__header}>
        <h2 className={styles.admin__title}>Panel de Control Administrativo</h2>
        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
          <button 
            style={{padding: '10px 20px', background: activeTab === 'approvals' ? '#000' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={() => setActiveTab('approvals')}
          >
            Aprobaciones ({pendingAuctions.length})
          </button>
          <button 
            style={{padding: '10px 20px', background: activeTab === 'settlements' ? '#000' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={() => setActiveTab('settlements')}
          >
            Liquidaciones y Pagos ({settlements.length})
          </button>
        </div>
      </div>

      {activeTab === 'approvals' && (
        pendingAuctions.length === 0 ? (
          <div className={styles.admin__empty}><p>No hay subastas pendientes de revisión en este momento.</p></div>
        ) : (
          <div className={styles.admin__grid}>
            {pendingAuctions.map((auction) => (
              <div key={auction.id} className={styles.card}>
                {auction.image_url && <img src={auction.image_url} alt={auction.title} className={styles.card__image} />}
                <div className={styles.card__content}>
                  <h3 className={styles.card__title}>{auction.title}</h3>
                  <p className={styles.card__seller}>Vendedor: {auction.profiles?.username || 'Desconocido'}</p>
                  <p className={styles.card__price}>Precio Base: ${auction.start_price}</p>
                  <p className={styles.card__desc}>{auction.description}</p>
                  <div className={styles.card__actions}>
                    <button className={`${styles.btn} ${styles.btn_approve}`} onClick={() => updateStatus(auction.id, 'active')}>Aprobar</button>
                    <button className={`${styles.btn} ${styles.btn_reject}`} onClick={() => updateStatus(auction.id, 'rejected')}>Rechazar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'settlements' && (
        settlements.length === 0 ? (
          <div className={styles.admin__empty}><p>No hay liquidaciones de dinero pendientes.</p></div>
        ) : (
          <div style={{overflowX: 'auto', marginTop: '20px'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden'}}>
              <thead>
                <tr style={{background: '#f8f9fa', borderBottom: '2px solid #dee2e6'}}>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>Subasta</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>Vendedor</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>Total Pagado</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>Tu Comisión ({commissionRate}%)</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>A Transferir</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#495057'}}>Estado Entrega</th>
                  <th style={{padding: '15px', textAlign: 'center', color: '#495057'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((auction) => {
                  const toPay = auction.current_price - (auction.current_price * commissionRate / 100);
                  const comission = auction.current_price * commissionRate / 100;
                  const isReady = auction.payment_status === 'delivered';
                  
                  return (
                    <tr key={auction.id} style={{borderBottom: '1px solid #e9ecef'}}>
                      <td style={{padding: '15px', fontWeight: '500'}}>{auction.title}</td>
                      <td style={{padding: '15px'}}>
                        <b>{auction.seller?.username}</b> <br/>
                        <span style={{fontSize: '0.85rem', color: '#6c757d'}}>📱 {auction.seller?.phone || 'Sin número'}</span><br/>
                        <span style={{fontSize: '0.85rem', color: '#004085', fontWeight: 'bold'}}>🏦 {auction.seller?.payment_alias || 'Sin alias'}</span>
                      </td>
                      <td style={{padding: '15px'}}>${auction.current_price}</td>
                      <td style={{padding: '15px', color: '#28a745', fontWeight: 'bold'}}>${comission}</td>
                      <td style={{padding: '15px', fontWeight: 'bold', fontSize: '1.1rem'}}>${toPay}</td>
                      <td style={{padding: '15px'}}>
                        {isReady ? (
                          <span style={{background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>🟢 LUZ VERDE (Entregado)</span>
                        ) : (
                          <span style={{background: '#fff3cd', color: '#856404', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>🔴 LUZ ROJA (Esperando)</span>
                        )}
                      </td>
                      <td style={{padding: '15px', textAlign: 'center'}}>
                        {isReady ? (
                          <button 
                            style={{background: '#0d6efd', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'}}
                            onMouseOver={(e) => e.target.style.background = '#0b5ed7'}
                            onMouseOut={(e) => e.target.style.background = '#0d6efd'}
                            onClick={() => markAsSettled(auction.id)}
                          >
                            Marcar Pagado
                          </button>
                        ) : (
                          <button 
                            disabled
                            style={{background: '#e9ecef', color: '#6c757d', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', fontWeight: 'bold'}}
                          >
                            Retenido
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
};

export default AdminDashboard;
