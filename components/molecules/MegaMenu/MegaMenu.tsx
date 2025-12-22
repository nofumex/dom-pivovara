'use client'

import Link from 'next/link'
import styles from './MegaMenu.module.scss'

interface MegaMenuProps {
  categorySlug: string
  onClose: () => void
}

const samogonovarenieMenu = {
  columns: [
    {
      title: 'Самогонные аппараты',
      items: [
        { name: 'Оборудование «Самогон и водка»', slug: 'samogon-i-vodka' },
        { name: 'Самогонные аппараты Вейн (Wein)', slug: 'apparaty-vein' },
        { name: 'Оборудование компании «Добровар»', slug: 'dobrovar' },
        { name: 'Оборудование Люксталь LUXSTAHL', slug: 'luxstahl' },
        { name: 'Оборудование компании «Аквавит»', slug: 'akvavit' },
        { name: 'Аппараты Domspirt', slug: 'domspirt' },
      ],
    },
    {
      title: 'Комплектующие',
      items: [
        { name: 'Царги, хомуты и переходники', slug: 'tsargi-homuty' },
        { name: 'Прокладки', slug: 'prokladki' },
        { name: 'Вспомогательное оборудование', slug: 'vspomogatelnoe-oborudovanie' },
        { name: 'Котлы, хомуты, крышки', slug: 'kotly-homuty-kryshki' },
      ],
    },
    {
      title: 'Доп. компоненты',
      items: [
        { name: 'Очистка', slug: 'ochistka' },
        { name: 'Ферменты, соли, кислоты', slug: 'fermenty-soli-kisloty' },
        { name: 'Осветлители, пеногасители', slug: 'osvetliteli-penogasiteli' },
        { name: 'Для цвета, вкуса, аромата', slug: 'cvet-vkus-aromat' },
        { name: 'Бонификаторы', slug: 'bonifikatory' },
      ],
    },
    {
      title: 'Автоматика',
      items: [
        { name: 'Системы углевания', slug: 'sistemy-uglevaniya' },
        { name: 'Автоматика и комплектующие', slug: 'avtomatika-komplektuyushchie' },
      ],
    },
    {
      title: 'Спиртовые дрожжи',
      items: [
        { name: 'Спиртовые и подкормка', slug: 'spirtovye-podkormka' },
        { name: 'Фруктовые, мёд', slug: 'fruktovye-med' },
        { name: 'Ром', slug: 'rom' },
        { name: 'Виски, бурбон', slug: 'viski-burbon' },
      ],
    },
    {
      title: 'Прочее',
      items: [
        { name: 'Солодовые экстракты', slug: 'solodovye-ekstrakty' },
        { name: 'Индукционные плиты и тэны', slug: 'indukcionnye-plity-teny' },
        { name: 'Настойки и травы, эссенции', slug: 'nastoyki-travy-essencii' },
        { name: 'Сувениры и книги', slug: 'suveniry-knigi' },
      ],
    },
  ],
}

export function MegaMenu({ categorySlug, onClose }: MegaMenuProps) {
  if (categorySlug !== 'samogonovarenie') {
    return null
  }

  const menu = samogonovarenieMenu

  return (
    <div
      className={styles.megaMenu}
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
    >
      <div className={styles.content}>
        {menu.columns.map((column, colIndex) => (
          <div key={colIndex} className={styles.column}>
            <h4 className={styles.columnTitle}>{column.title}</h4>
            <ul className={styles.items}>
              {column.items.map((item) => (
                <li key={item.slug} className={styles.item}>
                  <div className={styles.itemIcon}></div>
                  <Link
                    href={`/catalog/${categorySlug}/${item.slug}`}
                    className={styles.itemLink}
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}





















