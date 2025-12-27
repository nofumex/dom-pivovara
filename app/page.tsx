import { HeroSlider } from '@/components/organisms/HeroSlider/HeroSlider'
import { Advantages } from '@/components/organisms/Advantages/Advantages'
import { CategoryBanners } from '@/components/organisms/CategoryBanners/CategoryBanners'
import { ProductTabs } from '@/components/organisms/ProductTabs/ProductTabs'
import { AboutBlock } from '@/components/organisms/AboutBlock/AboutBlock'
import styles from './page.module.scss'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.heroSection}>
        <div className="container">
          <HeroSlider />
        </div>
      </div>
      <Advantages />
      <CategoryBanners />
      <div className="container">
        <ProductTabs />
        <AboutBlock />
      </div>
    </main>
  )
}
