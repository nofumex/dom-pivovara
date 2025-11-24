import { HeroSlider } from '@/components/organisms/HeroSlider/HeroSlider'
import { Advantages } from '@/components/organisms/Advantages/Advantages'
import { CategoryPreview } from '@/components/organisms/CategoryPreview/CategoryPreview'
import { Sidebar } from '@/components/organisms/Sidebar/Sidebar'
import { ProductTabs } from '@/components/organisms/ProductTabs/ProductTabs'
import { AboutBlock } from '@/components/organisms/AboutBlock/AboutBlock'
import styles from './page.module.scss'

export default async function HomePage() {
  return (
    <main>
      <HeroSlider />
      <Advantages />
      <CategoryPreview />
      
      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          <ProductTabs />
          <AboutBlock />
        </div>
        <Sidebar />
      </div>
    </main>
  )
}
