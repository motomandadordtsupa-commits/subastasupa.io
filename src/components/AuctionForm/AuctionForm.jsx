import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { sendTelegramNotification } from '../../services/telegram';
import styles from './AuctionForm.module.css';

const AuctionForm = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startPrice: 0,
    endAt: '',
    location: '',
    lat: null,
    lng: null,
    image: null,
    payment_alias: ''
  });
  const [hasSavedAlias, setHasSavedAlias] = useState(true);

  useEffect(() => {
    fetchSettings();
    checkUserAlias();
  }, []);

  const checkUserAlias = async () => {
    const { data } = await supabase.from('profiles').select('payment_alias').eq('id', user.id).single();
    if (data && data.payment_alias) {
      setHasSavedAlias(true);
      setFormData(prev => ({ ...prev, payment_alias: data.payment_alias }));
    } else {
      setHasSavedAlias(false);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'commission_rate').single();
    if (data) setCommissionRate(data.value);
  };

  const currentPrice = parseFloat(formData.startPrice) || 0;
  const commissionAmount = (currentPrice * commissionRate) / 100;
  const netAmount = currentPrice - commissionAmount;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setFormData({ ...formData, lat: latitude, lng: longitude, location: 'Ubicación GPS capturada' });
      alert('📍 Ubicación capturada con éxito');
    }, (error) => {
      console.error(error);
      alert('Error al obtener ubicación. Asegúrate de dar permisos.');
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let imageUrl = null;

      // 1. Subir la imagen al bucket
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('auction-images')
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        // 2. Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('auction-images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      // 2.5 Guardar el Alias en el perfil si es la primera vez
      if (!hasSavedAlias && formData.payment_alias) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ payment_alias: formData.payment_alias })
          .eq('id', user.id);
        
        if (profileError) console.error("Error guardando alias:", profileError);
      }

      // 3. Guardar en la base de datos (estado 'pending' por defecto)
      const { error: dbError } = await supabase
        .from('auctions')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          start_price: parseFloat(formData.startPrice),
          current_price: parseFloat(formData.startPrice), // Inicia igual al precio base
          end_at: new Date(formData.endAt).toISOString(),
          location: formData.location,
          lat: formData.lat,
          lng: formData.lng,
          image_url: imageUrl
        });

      if (dbError) throw dbError;

      // 4. Enviar alerta a Telegram para el Admin
      await sendTelegramNotification(formData, user.user_metadata.username || user.email);

      setMessage('¡Subasta creada! Queda pendiente de aprobación del Administrador.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);

    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal_overlay}>
      <div className={styles.modal_content}>
        <button className={styles.close_btn} onClick={onClose}>&times;</button>
        <h2 className={styles.title}>Publicar Producto</h2>
        <p className={styles.subtitle}>Crea tu subasta en minutos</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label>Título del Producto</label>
            <input type="text" name="title" required onChange={handleChange} placeholder="Ej: Reloj Rolex Submariner" />
          </div>

          <div className={styles.group}>
            <label>Descripción detallada</label>
            <textarea name="description" rows="3" required onChange={handleChange} placeholder="Condición, año, detalles..."></textarea>
          </div>

          {!hasSavedAlias && (
            <div className={styles.group} style={{background: '#e8f4fd', padding: '15px', borderRadius: '8px', border: '1px solid #b8daff'}}>
              <label style={{color: '#004085', fontWeight: 'bold'}}>🏦 Tu CBU o Alias (Requisito Único)</label>
              <p style={{fontSize: '0.85rem', margin: '0 0 10px 0', color: '#004085'}}>Necesitamos este dato para poder transferirte tus ganancias. Solo te lo pediremos esta vez.</p>
              <input type="text" name="payment_alias" required onChange={handleChange} placeholder="Ej: micuenta.mp o 00000031..." style={{border: '1px solid #004085', padding: '10px', width: '100%', borderRadius: '4px'}} />
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.group}>
              <label>Precio Base ($)</label>
              <input type="number" name="startPrice" min="1" required onChange={handleChange} placeholder="0.00" />
              {currentPrice > 0 && (
                <div className={styles.commission_box}>
                  <p>Comisión ({commissionRate}%): <span>-${commissionAmount.toFixed(0)}</span></p>
                  <p className={styles.net_text}>Recibirás: <span>${netAmount.toFixed(0)}</span></p>
                </div>
              )}
            </div>
            <div className={styles.group}>
              <label>Fecha de Cierre</label>
              <input type="datetime-local" name="endAt" required onChange={handleChange} />
            </div>
          </div>

          <div className={styles.group}>
            <label>Ubicación del Producto (Vital para envíos y seguridad)</label>
            <div className={styles.location_row}>
              <input 
                type="text" 
                name="location" 
                value={formData.location}
                required 
                onChange={handleChange} 
                placeholder="Ciudad, Provincia" 
                className={styles.location_input}
              />
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className={styles.gps_btn}
                title="Capturar mi ubicación actual"
              >
                📍 GPS
              </button>
            </div>
            {!formData.lat && <p className={styles.warning_text}>⚠️ Se recomienda usar el GPS para que los compradores cercanos te encuentren.</p>}
          </div>

          <div className={styles.group}>
            <label>Foto del Producto</label>
            <input type="file" name="image" accept="image/*" required onChange={handleChange} className={styles.file_input} />
          </div>

          {message && <div className={styles.message}>{message}</div>}

          <button type="submit" disabled={loading} className={styles.submit_btn}>
            {loading ? 'Subiendo...' : 'Publicar Subasta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuctionForm;
