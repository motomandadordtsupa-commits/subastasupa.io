import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

const heroSlides = [
  {
    id: 1,
    title: 'Compra 100% Protegida',
    description: 'Tu dinero queda seguro hasta que confirmas la recepción. ¡Cero riesgos!',
    image: '/security.png',
    icon: '🛡️'
  },
  {
    id: 2,
    title: 'Envío Express Motomandados',
    description: 'Logística integrada directamente en tu ciudad. Rápido y seguro.',
    image: '/delivery.png',
    icon: '🛵'
  },
  {
    id: 3,
    title: 'Subastas Transparentes',
    description: 'Pujas reales en vivo y sistema de segunda oportunidad.',
    image: '/auction.png',
    icon: '⚖️'
  }
];

const Hero = ({ onPublishClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.hero}>
      {/* Carrusel de Fondo */}
      <div className={styles.hero__carousel}>
        {heroSlides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`${styles.hero__slide} ${index === activeIndex ? styles.active : ''}`}
            style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${slide.image})` }}
          />
        ))}
      </div>

      <div className={`${styles.hero__container} container`}>
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>
            La subasta que nos <span className={styles.hero__highlight}>beneficia</span> a todos
          </h1>
          
          <div className={styles.hero__feature_box}>
            {heroSlides.map((slide, index) => (
              <div 
                key={slide.id}
                className={`${styles.hero__feature} ${index === activeIndex ? styles.feature_active : ''}`}
              >
                <div className={styles.hero__feature_header}>
                  <span className={styles.hero__feature_icon}>{slide.icon}</span>
                  <h2 className={styles.hero__feature_title}>{slide.title}</h2>
                </div>
                <p className={styles.hero__feature_desc}>{slide.description}</p>
              </div>
            ))}
          </div>

          <div className={styles.hero__actions}>
            <button className={styles.hero__button_primary}>Explorar Subastas</button>
            <button className={styles.hero__button_secondary} onClick={onPublishClick}>Publicar Producto</button>
          </div>

          <div className={styles.hero__indicators}>
            {heroSlides.map((_, i) => (
              <div 
                key={i} 
                className={`${styles.hero__dot} ${i === activeIndex ? styles.dot_active : ''}`}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
