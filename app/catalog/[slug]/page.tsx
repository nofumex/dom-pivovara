import { notFound } from 'next/navigation'
import { allCategories } from '@/lib/catalogData'
import { CategoryClient } from './CategoryClient'

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const category = allCategories.find((cat) => cat.slug === params.slug)

  if (!category) {
    notFound()
  }

  // Преобразуем структуру данных для CategoryClient
  const categoryData = {
    id: category.slug,
    name: category.name,
    slug: category.slug,
    parent: null,
    children: category.subcategories.map((sub) => ({
      id: sub.slug,
      name: sub.name,
      slug: sub.slug,
      count: sub.count,
    })),
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

