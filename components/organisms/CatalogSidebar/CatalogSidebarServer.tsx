import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage } from '@/lib/categoryUtils'
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
  // И получаем изображения подкатегорий из товаров
  const categoriesData = await Promise.all(
    categories.map(async (category) => ({
      name: category.name,
      slug: category.slug,
      image: category.image,
      subcategories: await Promise.all(
        category.other_Category.map(async (subcategory) => {
          // Получаем изображение подкатегории из товара, если у самой подкатегории нет изображения
          const subcategoryImage = subcategory.image || await getSubcategoryImage(subcategory.id)
          
          return {
            name: subcategory.name,
            slug: subcategory.slug,
            image: subcategoryImage,
            count: await getCategoryProductCount(subcategory.id),
            subSubcategories: await Promise.all(
              subcategory.other_Category.map(async (subSubcategory) => {
                // Получаем изображение под-подкатегории из товара
                const subSubcategoryImage = subSubcategory.image || await getSubcategoryImage(subSubcategory.id)
                
                return {
                  name: subSubcategory.name,
                  slug: subSubcategory.slug,
                  image: subSubcategoryImage,
                }
              })
            ),
          }
        })
      ),
    }))
  )

  return <CatalogSidebar categories={categoriesData} />
}
