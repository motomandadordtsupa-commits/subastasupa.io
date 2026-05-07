import { useState, useEffect } from 'react';
import styles from './Features.module.css';

const featuresData = [
  {
    id: 1,
    title: 'Compra 100% Protegida',
    description: 'Tu dinero queda "congelado" y seguro hasta que confirmas la recepción del producto. ¡Cero riesgos!',
    image: '/security.png',
    icon: '🛡️'
  },
  {
    id: 2,
    title: 'Envío Express Motomandados',
    description: 'Logística integrada directamente en tu ciudad (Sujeto a disponibilidad). Envíos rápidos, seguros y con seguimiento en tiempo real.',
    image: '/delivery.png',
    icon: '🛵'
  },
  {
    id: 3,
    title: 'Subastas Justas y Transparentes',
    description: 'Pujas reales en vivo, historial visible y sistema de segunda oportunidad. ¡Nadie se queda sin su tesoro!',
    image: '/auction.png',
    icon: '⚖️'
  }
];

const Features = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuresData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.features}>
      <div className={`${styles.features__container} container`}>
        <div className={styles.carousel}>
          {featuresData.map((feature, index) => (
            <div 
              key={feature.id} 
              className={`${styles.slide} ${index === activeIndex ? styles.active : ''}`}
            >
              <div className={styles.slide__content}>
                <span className={styles.slide__icon}>{feature.icon}</span>
                <h2 className={styles.slide__title}>{feature.title}</h2>
                <p className={styles.slide__description}>{feature.description}</p>
                <div className={styles.indicators}>
                  {featuresData.map((_, i) => (
                    <div 
                      key={i} 
                      className={`${styles.dot} ${i === activeIndex ? styles.dot_active : ''}`}
                      onClick={() => setActiveIndex(i)}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.slide__image_box}>
                <img src={feature.image} alt={feature.title} className={styles.slide__image} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
