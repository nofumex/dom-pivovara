export interface NewsItem {
  slug: string
  title: string
  date: string
  preview: string
  content: string
}

const newsData: NewsItem[] = [
  {
    slug: 'novyy-sayt-dompivovar',
    title: 'Новый сайт Дома Пивовара',
    date: '19 апреля 2022',
    preview: 'Мы запустили новый сайт с улучшенным дизайном и функционалом',
    content:
      'Мы запустили обновлённый сайт Дома Пивовара с современным дизайном, удобной навигацией и улучшенным каталогом товаров. Теперь искать оборудование и ингредиенты для пивоварения стало ещё проще.',
  },
]

export const getNews = (): NewsItem[] => {
  return newsData
}

export const getNewsBySlug = (slug: string): NewsItem | null => {
  return newsData.find((item) => item.slug === slug) || null
}


