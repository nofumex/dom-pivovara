'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { QuestionModal } from '@/components/molecules/QuestionModal/QuestionModal'
import styles from './page.module.scss'

export default function SalesPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
  ]
  const [isQuestionOpen, setIsQuestionOpen] = useState(false)

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <section className={styles.content}>
          <h1 className={styles.title}>Акции</h1>

          <p className={styles.lead}>
            Промо-акция — это разновидность рекламной активности, при которой происходит прямой контакт с
            потребителем товаров или услуг. Во время этого контакта потенциальный покупатель получает информацию
            о товаре, услуге, условиях акций и скидках.
          </p>
          <p className={styles.text}>
            Общая цель проведения промо-акций всегда одна — увеличение продаж. Но достигаться эта цель может путем
            реализации различных задач. В зависимости от поставленных задач, выбирается механика планируемой
            промо-акции.
          </p>

          <div className={styles.actionBox}>
            <div>
              <h3 className={styles.actionTitle}>Есть вопрос?</h3>
              <p className={styles.actionText}>
                Наши специалисты с радостью ответят на любой интересующий по нашим услугам вопрос.
              </p>
            </div>
            <button className={styles.actionButton} onClick={() => setIsQuestionOpen(true)}>
              Задать вопрос
            </button>
          </div>
        </section>
      </div>

      <QuestionModal isOpen={isQuestionOpen} onClose={() => setIsQuestionOpen(false)} />
    </main>
  )
}

