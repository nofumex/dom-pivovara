import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

const faqs = [
  {
    question: 'Как оформить заказ?',
    answer: 'Выберите товары, добавьте их в корзину и перейдите к оформлению заказа.',
  },
  {
    question: 'Какие способы оплаты доступны?',
    answer: 'Мы принимаем оплату наличными, банковскими картами и банковским переводом.',
  },
]

export default function FAQPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Вопрос-ответ', href: '/faq' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Вопрос-ответ</h1>
        <div className={styles.list}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.item}>
              <h3 className={styles.question}>{faq.question}</h3>
              <p className={styles.answer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}










