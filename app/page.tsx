import { HeroSlider } from '@/components/organisms/HeroSlider/HeroSlider'
import { Advantages } from '@/components/organisms/Advantages/Advantages'
import { ProductTabs } from '@/components/organisms/ProductTabs/ProductTabs'
import { AboutBlock } from '@/components/organisms/AboutBlock/AboutBlock'
import styles from './page.module.scss'

export default async function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.heroSection}>
        <div className="container">
          <HeroSlider />
        </div>
      </div>
      <div className="container">
        <Advantages />
        <ProductTabs />
        <AboutBlock />
      </div>
    </main>
  )
}
