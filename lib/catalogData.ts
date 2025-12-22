// Функция для генерации прозрачного PNG плейсхолдера
// Используем data URI с SVG для создания прозрачного изображения
export const getPlaceholderImage = (name: string, size: number = 64) => {
  const text = name.substring(0, 2).toUpperCase()
  // Создаем SVG с прозрачным фоном
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="transparent"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="#666" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${text}</text>
    </svg>
  `.trim()
  
  // Конвертируем в data URI
  const encodedSvg = encodeURIComponent(svg)
  return `data:image/svg+xml,${encodedSvg}`
}

// Структура категорий и подкатегорий
export interface SubSubcategory {
  name: string
  slug: string
}

export interface Subcategory {
  name: string
  slug: string
  count?: number
  subSubcategories?: SubSubcategory[]
}

export interface Category {
  name: string
  slug: string
  subcategories: Subcategory[]
}

export const allCategories: Category[] = [
  {
    name: 'Пивоварение',
    slug: 'pivovareniye',
    subcategories: [
      { 
        name: 'Пивоварни и ЦКТ', 
        slug: 'pivovarni-ckt', 
        count: 9 
      },
      { 
        name: 'Ингредиенты', 
        slug: 'ingredienty', 
        count: 152,
        subSubcategories: [
          { name: 'Солод', slug: 'solod' },
          { name: 'Дрожжи', slug: 'drozhzhi' },
          { name: 'Хмель', slug: 'hmel' },
          { name: 'Доп. компоненты', slug: 'dop-komponenty' },
        ]
      },
      { 
        name: 'Брожение и розлив', 
        slug: 'brozhenie-rozliv', 
        count: 52,
        subSubcategories: [
          { name: 'Укупорки', slug: 'ukuporki' },
          { name: 'Гидрозатворы и краны', slug: 'gidrozatvory-krany' },
          { name: 'Сифоны и воронки', slug: 'sifony-voronki' },
        ]
      },
      { 
        name: 'Пивные наборы и медовуха', 
        slug: 'pivnye-nabory-medovuha', 
        count: 40,
        subSubcategories: [
          { name: 'Солодовые экстракты', slug: 'solodovye-ekstrakty' },
          { name: 'Зерновые наборы', slug: 'zernovye-nabory' },
          { name: 'Медовуха наборы', slug: 'medovuha-nabory' },
        ]
      },
      { 
        name: 'Сидр и медовуха', 
        slug: 'sidr-medovuha', 
        count: 6 
      },
      { 
        name: 'Дополнительное оборудование', 
        slug: 'dopolnitelnoe-oborudovanie', 
        count: 33,
        subSubcategories: [
          { name: 'Мельницы', slug: 'melnitsy' },
          { name: 'Мешки для солода', slug: 'meshki-dlya-soloda' },
          { name: 'Мойка и дезинфекция', slug: 'moyka-dezinfektsiya' },
          { name: 'Приготовление сусла', slug: 'prigotovlenie-susla' },
        ]
      },
    ],
  },
  {
    name: 'Самогоноварение',
    slug: 'samogonovarenie',
    subcategories: [
      { 
        name: 'Самогонные аппараты', 
        slug: 'samogonnye-apparaty', 
        count: 50,
        subSubcategories: [
          { name: 'Оборудование «Самогон и водка»', slug: 'oborudovanie-samogon-vodka' },
          { name: 'Самогонные аппараты Вейн (Wein)', slug: 'samogonnye-apparaty-vein' },
          { name: 'Оборудование компании «Добровар»', slug: 'oborudovanie-dobrovar' },
          { name: 'Оборудование Люкссталь LUXSTAHL', slug: 'oborudovanie-luxstahl' },
          { name: 'Оборудование компании «Аквавит»', slug: 'oborudovanie-akvavit' },
          { name: 'Аппараты Domspirt', slug: 'apparaty-domspirt' },
        ]
      },
      { 
        name: 'Доп. компоненты', 
        slug: 'dop-komponenty', 
        count: 31,
        subSubcategories: [
          { name: 'Очистка', slug: 'ochistka' },
          { name: 'Ферменты, соли, кислоты', slug: 'fermenty-soli-kisloty' },
          { name: 'Осветлители, пеногасители', slug: 'osvetliteli-penogasiteli' },
          { name: 'Для цвета, вкуса, аромата', slug: 'dlya-tsveta-vkusa-aromata' },
          { name: 'Бонификаторы', slug: 'bonifikatory' },
        ]
      },
      { 
        name: 'Автоматика', 
        slug: 'avtomatika', 
        count: 17,
        subSubcategories: [
          { name: 'Системы углевания', slug: 'sistemy-uglevaniya' },
          { name: 'Автоматика и комплектующие', slug: 'avtomatika-komplektuyushchie' },
        ]
      },
      { 
        name: 'Комплектующие', 
        slug: 'komplektuyushchie', 
        count: 172,
        subSubcategories: [
          { name: 'Царги, хомуты и переходники', slug: 'tsargi-khomyty-perekhodniki' },
          { name: 'Прокладки', slug: 'prokladki' },
        ]
      },
      { 
        name: 'Вспомогательное оборудование', 
        slug: 'vspomogatelnoe-oborudovanie', 
        count: 0,
        subSubcategories: [
          { name: 'Котлы, хомуты, крышки', slug: 'kotly-khomyty-kryshki' },
        ]
      },
      { 
        name: 'Спиртовые дрожжи', 
        slug: 'spirtovye-drozhzhi', 
        count: 40,
        subSubcategories: [
          { name: 'Спиртовые и подкормка', slug: 'spirtovye-podkormka' },
          { name: 'Фруктовые, мёд', slug: 'fruktovye-med' },
          { name: 'Ром', slug: 'rom' },
          { name: 'Виски, бурбон', slug: 'viski-burbon' },
        ]
      },
      { 
        name: 'Солодовые экстракты', 
        slug: 'solodovye-ekstrakty', 
        count: 11 
      },
      { 
        name: 'Настойки и травы, эссенции', 
        slug: 'nastoyki-travy-essentsii', 
        count: 288,
        subSubcategories: [
          { name: 'Сибирская Винокурня', slug: 'sibirskaya-vinokurnya' },
          { name: 'Алтайский Винокур', slug: 'altayskiy-vinokur' },
          { name: 'Алхимия вкуса', slug: 'alkhimiya-vkusa' },
          { name: 'Дед Алтай', slug: 'ded-altay' },
          { name: 'Эссенции', slug: 'essentsii' },
        ]
      },
      { 
        name: 'Щепа и скорлупа для настаивания', 
        slug: 'shchepa-skorlupa-dlya-nastaivaniya', 
        count: 0 
      },
      { name: 'Индукционные плиты и тэны', slug: 'induktsionnye-plity-teny', count: 12 },
      { name: 'Сок концентрированный', slug: 'sok-kontsentrirovannyj', count: 46 },
      { name: 'Сувениры и книги', slug: 'suveniry-knigi', count: 3 },
    ],
  },
  {
    name: 'Виноделие',
    slug: 'vinodeliye',
    subcategories: [
      { name: 'Винные дрожжи и компоненты', slug: 'vinnye-drozhzhi-komponenty', count: 11 },
      { name: 'Винные наборы', slug: 'vinnye-nabory', count: 5 },
      { name: 'Винные аксессуары', slug: 'vinnye-aksessuary', count: 3 },
      { name: 'Прессы и измельчители', slug: 'pressy-izmelchiteli', count: 6 },
    ],
  },
  {
    name: 'Шланги, соединения',
    slug: 'shlangi-soedineniya',
    subcategories: [
      { name: 'Силиконовые трубки', slug: 'silikonovye-trubki', count: 12 },
      { name: 'ПВХ-трубки', slug: 'pvh-trubki', count: 16 },
      { 
        name: 'Краны, штуцеры', 
        slug: 'krany-shtutsery', 
        count: 52,
        subSubcategories: [
          { name: 'Краны', slug: 'krany' },
          { name: 'Штуцера и хомуты', slug: 'shtutsery-khomyty' },
        ]
      },
    ],
  },
  {
    name: 'Тара и ёмкости',
    slug: 'tara-emkosti',
    subcategories: [
      { name: 'Бутылки', slug: 'butylki', count: 72 },
      { name: 'Графины', slug: 'grafiny', count: 4 },
      { name: 'Баки и бочки', slug: 'baki-bochki', count: 15 },
      { 
        name: 'Пробки, термоколпачки', 
        slug: 'probki-termokolpachki', 
        count: 76,
        subSubcategories: [
          { name: 'Термоколпачки', slug: 'termokolpachki' },
          { name: 'Пробки', slug: 'probki' },
        ]
      },
      { name: 'Этикетки', slug: 'etiketki', count: 66 },
      { name: 'Банки и бутыли', slug: 'banki-butylki', count: 6 },
    ],
  },
  {
    name: 'Бондарные изделия',
    slug: 'bondarnye-izdeliya',
    subcategories: [
      { 
        name: 'Бочки', 
        slug: 'bochki', 
        count: 12,
        subSubcategories: [
          { name: 'Лер', slug: 'ler' },
          { name: 'Ставбондарь', slug: 'stavbondar' },
          { name: 'Майкоп', slug: 'maykop' },
          { name: 'Другие производители', slug: 'drugie-proizvoditeli' },
        ]
      },
      { name: 'Жбаны, кадки', slug: 'zhbany-kadki', count: 3 },
      { name: 'Сопутствующие товары', slug: 'soputstvuyushchie-tovary', count: 3 },
    ],
  },
  {
    name: 'Казаны, тандыры, мангалы, печи, посуда',
    slug: 'kazany-tandyry-mangaly-pechi-posuda',
    subcategories: [
      { name: 'Узбекские казаны', slug: 'uzbekskie-kazany', count: 10 },
      { name: 'Афганские казаны', slug: 'afganskie-kazany', count: 16 },
      { name: 'Печи, мангалы', slug: 'pechi-mangaly', count: 14 },
      { name: 'Шампуры', slug: 'shampury', count: 13 },
      { name: 'Шумовки, половники, посуда', slug: 'shumovki-polovniki-posuda', count: 10 },
      { name: 'Саджи, решетки, сковороды', slug: 'sadzhi-reshetki-skovorody', count: 25 },
      { name: 'Подставки и треноги для казана', slug: 'podstavki-trenogi-dlya-kazana', count: 3 },
      { name: 'Тандыры', slug: 'tandyry' },
    ],
  },
  {
    name: 'Всё для изготовления колбас',
    slug: 'vse-dlya-izgotovleniya-kolbas',
    subcategories: [
      { name: 'Приправы, специи', slug: 'pripravy-specii', count: 30 },
      { name: 'Оболочки, черева', slug: 'obolochki-chereva', count: 18 },
      { name: 'Шпагаты и сетки', slug: 'shpagaty-setki', count: 2 },
      { name: 'Шприцы и насадки для колбас', slug: 'shpritsy-nasadki-dlya-kolbas', count: 7 },
      { name: 'Стартовые культуры', slug: 'startovye-kultury' },
    ],
  },
  {
    name: 'Сыроделие',
    slug: 'syrodelie',
    subcategories: [
      { name: 'Ферменты для сыра', slug: 'fermenty-dlya-syra', count: 42 },
      { 
        name: 'Закваски', 
        slug: 'zakvaski', 
        count: 0,
        subSubcategories: [
          { name: 'Плесень для сыра', slug: 'plesen-dlya-syra' },
          { name: 'Закваски творога, кефира, простокваши и т.д.', slug: 'zakvaski-tvoroga-kefira-prostokvashi' },
        ]
      },
      { 
        name: 'Кальций хлористый, Красители, приправы', 
        slug: 'kaltsiy-khloristyy-krasiteli-pripravy', 
        count: 0 
      },
      { name: 'Наборы для сыра', slug: 'nabory-dlya-syra', count: 15 },
      { name: 'Формы, коврики, воск', slug: 'formy-kovriki-vosk', count: 49 },
      { name: 'Сыроварни, сепараторы', slug: 'syrovarni-separatory', count: 5 },
    ],
  },
  {
    name: 'Измерительное оборудование',
    slug: 'izmeritelnoe-oborudovanie',
    subcategories: [],
  },
  {
    name: 'Автоклавы и коптильни',
    slug: 'avtoklavy-koptilni',
    subcategories: [
      { name: 'Автоклавы', slug: 'avtoklavy', count: 3 },
      { name: 'Коптильни и дымогенераторы', slug: 'koptilni-dymogeneratory', count: 7 },
      { name: 'Щепа для копчения', slug: 'shchepa-dlya-kopcheniya', count: 12 },
    ],
  },
  {
    name: 'Литература',
    slug: 'literatura',
    subcategories: [],
  },
  {
    name: 'Травы и специи',
    slug: 'travy-specii',
    subcategories: [],
  },
  {
    name: 'Хлеб и квас',
    slug: 'hleb-kvas',
    subcategories: [],
  },
]

