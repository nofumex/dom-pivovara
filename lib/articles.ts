export interface Article {
  slug: string
  title: string
  date: string
  preview: string
  image: string
  content: string
}

const articlesData: Article[] = [
  {
    slug: 'yarfest-2023',
    title: 'ЯрФест 2023!',
    date: '15 мая 2023',
    preview: 'Обзор фестиваля пивоварения',
    image:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
    content:
      'ЯрФест 2023 — это один из крупнейших фестивалей домашнего и крафтового пивоварения. В этой статье мы рассказываем о главных участниках, дегустациях и новинках оборудования для пивоваров.',
  },
  {
    slug: 'protsess-pivovareniya',
    title: 'Процесс приготовления пива',
    date: '10 апреля 2023',
    preview: 'Подробное руководство по пивоварению',
    image:
      'https://images.unsplash.com/photo-1556910103-1c0275a7f751?w=400&h=300&fit=crop',
    content:
      'Процесс приготовления пива включает несколько ключевых этапов: затирание, фильтрация, кипячение, охлаждение, брожение и созревание. В статье подробно разбираем каждый шаг и даем практические советы начинающим пивоварам.',
  },
  {
    slug: 'svetloe-pivo-venskoe',
    title: 'Светлое пиво: Венское',
    date: '5 марта 2023',
    preview: 'Рецепт и технология приготовления',
    image:
      'https://images.unsplash.com/photo-1535958637004-8967b9ed21ca?w=400&h=300&fit=crop',
    content:
      'Венское светлое пиво отличается мягким солодовым вкусом и приятной горчинкой. В статье приводим базовый рецепт, рекомендуемые параметры затирания и брожения, а также варианты экспериментальных добавок.',
  },
]

export const getArticles = (): Article[] => {
  return articlesData
}

export const getArticleBySlug = (slug: string): Article | null => {
  return articlesData.find((article) => article.slug === slug) || null
}


