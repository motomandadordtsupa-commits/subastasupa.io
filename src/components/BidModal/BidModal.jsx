import { useState } from 'react';
import { supabase } from '../../services/supabase';
import styles from './BidModal.module.css';

const BidModal = ({ auction, user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [multiplier, setMultiplier] = useState(1);

  const increment = 500 * multiplier;
  const bidAmount = auction.current_price + increment;

  const handleConfirmBid = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('bids')
        .insert({
          auction_id: auction.id,
          bidder_id: user.id,
          amount: bidAmount
        });

      if (dbError) throw dbError;

      onClose();
      
    } catch (err) {
      console.error('Error al pujar:', err.message);
      setError('No se pudo procesar la puja. Asegúrate de cumplir las reglas de incremento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal_overlay}>
      <div className={styles.modal_content}>
        <button className={styles.close_btn} onClick={onClose} disabled={loading}>&times;</button>
        
        <h2 className={styles.title}>Confirmar Puja</h2>
        <p className={styles.subtitle}>Selecciona cuánto quieres aumentar la puja.</p>

        <div className={styles.details_box}>
          <div className={styles.detail_row}>
            <span>Producto:</span>
            <strong>{auction.title}</strong>
          </div>
          <div className={styles.detail_row}>
            <span>Precio Actual:</span>
            <strong>${auction.current_price}</strong>
          </div>
          
          <div className={styles.detail_row} style={{ alignItems: 'center', marginTop: '15px' }}>
            <span>Aumentar en:</span>
            <select 
              className={styles.multiplier_select} 
              value={multiplier} 
              onChange={(e) => setMultiplier(Number(e.target.value))}
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>+ ${num * 500}</option>
              ))}
            </select>
          </div>

          <div className={styles.detail_row_highlight}>
            <span>Tu Puja Final:</span>
            <strong className={styles.highlight}>${bidAmount}</strong>
          </div>
        </div>

        {error && <div className={styles.error_message}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.cancel_btn} onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className={styles.confirm_btn} onClick={handleConfirmBid} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar Puja'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
