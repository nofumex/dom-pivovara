import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

export default function HelpPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Помощь', href: '/help' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Помощь</h1>
        <div className={styles.content}>
          <p>Раздел помощи в разработке</p>
        </div>
      </div>
    </main>
  )
}








