'use client'

import { useEffect } from 'react'
import { useRecentlyViewedStore } from '@/store/recently-viewed-store'

interface ProductViewTrackerProps {
  productId: string
}

export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.add)

  useEffect(() => {
    if (productId) {
      addToRecentlyViewed(productId)
    }
  }, [productId, addToRecentlyViewed])

  return null // Компонент не рендерит ничего
}



