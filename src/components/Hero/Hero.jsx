import styles from './Hero.module.css';

const Hero = ({ onPublishClick }) => {
  return (
    <section className={styles.hero}>
      <div className={`${styles.hero__container} container`}>
        <h1 className={styles.hero__title}>
          La subasta que nos <span className={styles.hero__highlight}>beneficia</span> a todos
        </h1>
        <p className={styles.hero__subtitle}>
          Encuentra oportunidades únicas y vende de forma segura en la plataforma líder de la región.
        </p>
        <div className={styles.hero__actions}>
          <button className={styles.hero__button_primary}>Explorar Subastas</button>
          <button className={styles.hero__button_secondary} onClick={onPublishClick}>Publicar Producto</button>
        </div>
      </div>
      
      {/* Elementos decorativos de fondo */}
      <div className={styles.hero__glow_1}></div>
      <div className={styles.hero__glow_2}></div>
    </section>
  );
};

export default Hero;
