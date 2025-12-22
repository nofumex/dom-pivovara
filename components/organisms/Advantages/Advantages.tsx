import styles from './Advantages.module.scss'

const GiftIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8v13m0-13V6a2 2 0 1 1 2 2h-2zm0 0V5.5A2.5 2.5 0 1 0 9.5 8H12zm-7 4h14M5 12a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 12h12M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TruckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const advantages = [
  {
    icon: GiftIcon,
    text: 'Подарочные сертификаты',
  },
  {
    icon: CheckIcon,
    text: 'Весь товар сертифицирован',
  },
  {
    icon: RefreshIcon,
    text: '30 дней на обмен и возврат',
  },
  {
    icon: TruckIcon,
    text: 'Удобная и быстрая доставка',
  },
]

export function Advantages() {
  return (
    <div className={styles.advantages}>
      <div className={styles.grid}>
        {advantages.map((advantage, index) => {
          const IconComponent = advantage.icon
          return (
            <div key={index} className={styles.item}>
              <div className={styles.icon}>
                <IconComponent />
              </div>
              <div className={styles.text}>{advantage.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

