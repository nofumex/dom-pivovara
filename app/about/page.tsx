import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

export default function AboutPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'О компании', href: '/about' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>О компании</h1>
        <div className={styles.content}>
          <p>
            ДомПивовар — это интернет-магазин, специализирующийся на товарах для домашнего
            пивоварения, самогоноварения и виноделия. Мы предлагаем широкий ассортимент
            качественного оборудования, ингредиентов и аксессуаров для создания напитков в
            домашних условиях.
          </p>
          <p>
            Наша миссия — сделать процесс создания напитков доступным и увлекательным для
            каждого. Мы работаем с проверенными поставщиками и гарантируем качество всей
            нашей продукции.
          </p>
        </div>
      </div>
    </main>
  )
}

