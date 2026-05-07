import { useState } from 'react';
import { supabase } from '../../services/supabase';
import styles from './Auth.module.css';

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: '¡Registro exitoso! Revisa tu email para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      <div className={styles.auth__card}>
        <h2 className={styles.auth__title}>
          {isRegister ? 'Crear Cuenta' : 'Bienvenido'}
        </h2>
        <p className={styles.auth__subtitle}>
          {isRegister ? 'Únete a la mejor comunidad de subastas' : 'Ingresa para participar en Gran Remate'}
        </p>

        <form className={styles.auth__form} onSubmit={handleAuth}>
          {isRegister && (
            <div className={styles.auth__group}>
              <label className={styles.auth__label}>Nombre de Usuario</label>
              <input
                className={styles.auth__input}
                type="text"
                placeholder="Ej: JuanPerez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.auth__group}>
            <label className={styles.auth__label}>Email</label>
            <input
              className={styles.auth__input}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.auth__group}>
            <label className={styles.auth__label}>Contraseña</label>
            <input
              className={styles.auth__input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message.text && (
            <div className={`${styles.auth__message} ${styles[`auth__message--${message.type}`]}`}>
              {message.text}
            </div>
          )}

          <button className={styles.auth__button} disabled={loading}>
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className={styles.auth__toggle}>
          <span>{isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}</span>
          <button 
            className={styles.auth__toggle_button}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Inicia Sesión' : 'Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
