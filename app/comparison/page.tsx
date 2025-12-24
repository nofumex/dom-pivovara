import Link from 'next/link'
import { ComparisonClient } from '@/components/organisms/ComparisonClient/ComparisonClient'

export default function ComparisonPage() {
  return (
    <main>
      <div className="container">
        <div style={{ margin: '24px 0' }}>
          <Link href="/catalog">← Вернуться в каталог</Link>
        </div>
        <ComparisonClient />
      </div>
    </main>
  )
}
















