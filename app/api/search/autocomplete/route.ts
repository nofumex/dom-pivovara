import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ProductVisibility } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.trim().length < 2) {
      return Response.json({ products: [] })
    }

    const searchTerm = query.trim()

    // Поиск товаров по названию, описанию и артикулу
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
        visibility: ProductVisibility.VISIBLE,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        oldPrice: true,
        images: true,
        currency: true,
      },
      take: 7, // Ограничиваем до 7 товаров для автодополнения
      orderBy: {
        title: 'asc',
      },
    })

    // Преобразуем цены в числа
    const transformedProducts = products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      currency: product.currency,
    }))

    return Response.json({ products: transformedProducts })
  } catch (error) {
    console.error('Search autocomplete error:', error)
    return Response.json({ products: [] }, { status: 500 })
  }
}

