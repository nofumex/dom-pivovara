import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage } from '@/lib/categoryUtils'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const parentId = searchParams.get('parentId')

    const where: any = {
      isActive: true,
    }

    if (parentId) {
      where.parentId = parentId
    } else {
      where.parentId = null
    }

    const categories = await prisma.category.findMany({
      where,
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
    })

    // Если нужно включить подсчет товаров, добавляем его с учетом дочерних категорий
    if (includeProducts) {
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const subcategoriesWithCounts = await Promise.all(
            category.other_Category.map(async (subcategory) => {
              // Получаем изображение подкатегории из товара, если у самой подкатегории нет изображения
              let subcategoryImage = subcategory.image
              
              // Проверяем, есть ли изображение у самой подкатегории
              if (!subcategoryImage || (typeof subcategoryImage === 'string' && subcategoryImage.trim() === '')) {
                console.log(`[API Categories] Подкатегория "${subcategory.name}" (ID: ${subcategory.id}) не имеет собственного изображения, ищем в товарах...`)
                subcategoryImage = await getSubcategoryImage(subcategory.id)
                
                if (subcategoryImage) {
                  console.log(`[API Categories] ✅ Подкатегория "${subcategory.name}" получила изображение из товара:`, subcategoryImage)
                } else {
                  console.warn(`[API Categories] ⚠️ Подкатегория "${subcategory.name}" (ID: ${subcategory.id}) НЕ получила изображение из товаров`)
                }
              } else {
                console.log(`[API Categories] Подкатегория "${subcategory.name}" имеет собственное изображение:`, subcategoryImage)
              }
              
              const subSubcategoriesWithCounts = await Promise.all(
                subcategory.other_Category.map(async (subSubcategory) => {
                  // Получаем изображение под-подкатегории из товара
                  let subSubcategoryImage = subSubcategory.image
                  if (!subSubcategoryImage || subSubcategoryImage.trim() === '') {
                    subSubcategoryImage = await getSubcategoryImage(subSubcategory.id)
                  }
                  
                  return {
                    ...subSubcategory,
                    image: subSubcategoryImage,
                    _count: {
                      Product: await getCategoryProductCount(subSubcategory.id),
                    },
                  }
                })
              )
              return {
                ...subcategory,
                image: subcategoryImage, // Добавляем изображение подкатегории
                other_Category: subSubcategoriesWithCounts,
                _count: {
                  Product: await getCategoryProductCount(subcategory.id),
                },
              }
            })
          )
          return {
            ...category,
            other_Category: subcategoriesWithCounts,
            _count: {
              Product: await getCategoryProductCount(category.id),
            },
          }
        })
      )
      return successResponse(categoriesWithCounts)
    }

    return successResponse(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return errorResponse('Ошибка при получении категорий', 500)
  }
}









