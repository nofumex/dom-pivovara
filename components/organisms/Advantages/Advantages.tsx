import styles from './Advantages.module.scss'
import { GiftIcon } from '@/components/atoms/Icons/GiftIcon'
import { CheckIcon } from '@/components/atoms/Icons/CheckIcon'
import { RefreshIcon } from '@/components/atoms/Icons/RefreshIcon'
import { TruckIcon } from '@/components/atoms/Icons/TruckIcon'

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
      <div className="container">
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
    </div>
  )
}

