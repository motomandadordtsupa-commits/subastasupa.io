import styles from './Navbar.module.css';

const Navbar = ({ user, userProfile, onAuthClick, onLogout, onAdminClick, onHomeClick, onSellerClick, onBuyerClick }) => {
  return (
    <nav className={styles.navbar}>
      <div className={`${styles.navbar__container} container`}>
        <div className={styles.navbar__logo} onClick={onHomeClick} style={{ cursor: 'pointer' }}>
          <span className={styles.navbar__logo_gold}>GRAN</span> REMATE
        </div>
        <ul className={styles.navbar__links}>
          <li><a href="#" className={styles.navbar__link}>Subastas</a></li>
          {user ? (
            <>
              <li>
                <button className={styles.navbar__link_btn} onClick={onBuyerClick}>
                  Mis Pujas
                </button>
              </li>
              <li>
                <button className={styles.navbar__link_btn} onClick={onSellerClick}>
                  Mis Subastas
                </button>
              </li>
              {userProfile?.role === 'admin' && (
                <li>
                  <button className={styles.navbar__admin_btn} onClick={onAdminClick}>
                    Panel Admin
                  </button>
                </li>
              )}
              <li><span className={styles.navbar__link}>{user.user_metadata.username || user.email}</span></li>
              <li><button className={styles.navbar__button} onClick={onLogout}>Cerrar Sesión</button></li>
            </>
          ) : (
            <li><button className={styles.navbar__button} onClick={onAuthClick}>Iniciar Sesión</button></li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
