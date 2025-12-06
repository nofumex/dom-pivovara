import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCategoryProductCount } from '@/lib/categoryUtils'
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
              const subSubcategoriesWithCounts = await Promise.all(
                subcategory.other_Category.map(async (subSubcategory) => ({
                  ...subSubcategory,
                  _count: {
                    Product: await getCategoryProductCount(subSubcategory.id),
                  },
                }))
              )
              return {
                ...subcategory,
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









