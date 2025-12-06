import { prisma } from '@/lib/db'
import { getCategoryProductCount } from '@/lib/categoryUtils'
import { CatalogSidebar } from './CatalogSidebar'

export async function CatalogSidebarServer() {
  // Получаем категории из базы данных
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    include: {
      other_Category: {
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          other_Category: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  // Подсчитываем товары для каждой подкатегории с учетом дочерних категорий
  const categoriesData = await Promise.all(
    categories.map(async (category) => ({
      name: category.name,
      slug: category.slug,
      subcategories: await Promise.all(
        category.other_Category.map(async (subcategory) => ({
          name: subcategory.name,
          slug: subcategory.slug,
          count: await getCategoryProductCount(subcategory.id),
          subSubcategories: subcategory.other_Category.map((subSubcategory) => ({
            name: subSubcategory.name,
            slug: subSubcategory.slug,
          })),
        }))
      ),
    }))
  )

  return <CatalogSidebar categories={categoriesData} />
}
