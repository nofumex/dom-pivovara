import styles from './Advantages.module.scss'

const advantages = [
  {
    icon: '🎁',
    text: 'Подарочные сертификаты',
  },
  {
    icon: '✓',
    text: 'Весь товар сертифицирован',
  },
  {
    icon: '↻',
    text: '30 дней на обмен и возврат',
  },
  {
    icon: '🚚',
    text: 'Удобная и быстрая доставка',
  },
]

export function Advantages() {
  return (
    <div className={styles.advantages}>
      <div className="container">
        <div className={styles.grid}>
          {advantages.map((advantage, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.icon}>{advantage.icon}</div>
              <div className={styles.text}>{advantage.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

