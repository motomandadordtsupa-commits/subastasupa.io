import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingAuctions();
  }, []);

  const fetchPendingAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles:seller_id (username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingAuctions(data || []);
    } catch (error) {
      console.error('Error cargando subastas:', error.message);
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
      
      // Actualizar la lista localmente
      setPendingAuctions(pendingAuctions.filter(a => a.id !== id));
      alert(`Subasta ${newStatus === 'active' ? 'aprobada' : 'rechazada'} con éxito.`);
    } catch (error) {
      console.error('Error actualizando estado:', error.message);
      alert('Hubo un error al actualizar la subasta.');
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>Cargando panel...</div>;
  }

  return (
    <section className={`container ${styles.admin}`}>
      <div className={styles.admin__header}>
        <h2 className={styles.admin__title}>Panel de Control Administrativo</h2>
        <p className={styles.admin__subtitle}>Gestiona las subastas pendientes de aprobación.</p>
      </div>

      {pendingAuctions.length === 0 ? (
        <div className={styles.admin__empty}>
          <p>No hay subastas pendientes de revisión en este momento.</p>
        </div>
      ) : (
        <div className={styles.admin__grid}>
          {pendingAuctions.map((auction) => (
            <div key={auction.id} className={styles.card}>
              {auction.image_url && (
                <img src={auction.image_url} alt={auction.title} className={styles.card__image} />
              )}
              <div className={styles.card__content}>
                <h3 className={styles.card__title}>{auction.title}</h3>
                <p className={styles.card__seller}>Vendedor: {auction.profiles?.username || 'Desconocido'}</p>
                <p className={styles.card__price}>Precio Base: ${auction.start_price}</p>
                <p className={styles.card__desc}>{auction.description}</p>
                
                <div className={styles.card__actions}>
                  <button 
                    className={`${styles.btn} ${styles.btn_approve}`}
                    onClick={() => updateStatus(auction.id, 'active')}
                  >
                    Aprobar
                  </button>
                  <button 
                    className={`${styles.btn} ${styles.btn_reject}`}
                    onClick={() => updateStatus(auction.id, 'rejected')}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
