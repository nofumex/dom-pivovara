export type EmailTemplateId =
  | 'order-confirmation'
  | 'admin-new-order'
  | 'admin-new-lead'
  | 'newsletter-default'

type CTA = {
  label: string
  url: string
}

type AccentBadge = {
  label: string
  color?: string
}

type Highlight = {
  title: string
  description: string
  icon?: string
}

type TableColumn = {
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

type TableRow = {
  cells: Array<{ value: string; align?: 'left' | 'center' | 'right' }>
}

type BrandConfig = {
  brandName: string
  logoUrl: string
  siteUrl: string
  supportEmail?: string
  supportPhone?: string
  address?: string
  accentColor: string
  neutralBg: string
}

const brand: BrandConfig = {
  brandName: 'Дом Пивовара',
  logoUrl: 'https://dompivovara.ru/images/logoPivovar.png',
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://dom-pivovara.ru',
  supportEmail: 'dompivovar@mail.ru',
  supportPhone: '+7 913 555-222-6, +7 913 037-32-47',
  address: 'Россия, Красноярск',
  accentColor: '#F57C00', // главный оранжевый сайта
  neutralBg: '#F5F6F7',
}

const brandColors = {
  text: '#333333',
  muted: '#666666',
  border: '#E6E6E6',
  card: '#FFFFFF',
  soft: '#FAFAFB',
}

const baseStyles = {
  body: `margin:0;padding:0;background:${brand.neutralBg};font-family:Inter,Arial,Helvetica,sans-serif;color:${brandColors.text};`,
  container: `width:100%;background:${brand.neutralBg};padding:32px 12px;`,
  card: `max-width:640px;margin:0 auto;background:${brandColors.card};border-radius:8px;overflow:hidden;border:1px solid ${brandColors.border};box-shadow:0 8px 28px rgba(0,0,0,0.06);`,
  header: `padding:16px 28px 14px 28px;background:${brandColors.card};border-bottom:1px solid ${brandColors.border};`,
  accentBar: `height:4px;background:${brand.accentColor};margin:-16px -28px 14px -28px;`,
  logo: `display:flex;align-items:center;gap:16px;color:${brandColors.text};text-decoration:none;font-weight:800;font-size:22px;letter-spacing:-0.3px;line-height:1.2;font-family:Inter,Arial,Helvetica,sans-serif;`,
  hero: 'padding:18px 28px 10px 28px;',
  title: `margin:0;font-size:24px;line-height:1.3;color:${brandColors.text};font-weight:800;`,
  subtitle: `margin:8px 0 0 0;font-size:15px;line-height:1.6;color:${brandColors.muted};`,
  badge: `display:inline-block;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:0.3px;margin-bottom:10px;background:${brandColors.soft};border:1px solid ${brandColors.border};`,
  section: 'padding:0 28px 22px 28px;',
  tableWrapper: `width:100%;border-collapse:collapse;margin-top:8px;border:1px solid ${brandColors.border};border-radius:8px;overflow:hidden;`,
  tableHead: `background:${brandColors.soft};text-align:left;font-size:13px;color:${brandColors.text};`,
  tableCell: `padding:12px 14px;border-bottom:1px solid ${brandColors.border};font-size:14px;color:${brandColors.text};`,
  highlightWrap: 'display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;',
  highlightCard: `flex:1 1 180px;background:${brandColors.soft};border:1px solid ${brandColors.border};border-radius:8px;padding:14px;`,
  cta: `display:inline-block;margin-top:16px;padding:13px 18px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;color:#ffffff;background:${brand.accentColor};border:1px solid ${brand.accentColor};`,
  footer: `padding:20px 28px 26px 28px;background:${brandColors.card};color:${brandColors.muted};border-top:1px solid ${brandColors.border};`,
  footerLink: `color:${brand.accentColor};text-decoration:none;font-weight:700;`,
  small: `font-size:12px;color:${brandColors.muted};line-height:1.6;`,
}

function safeHtml(value: string) {
  return value.replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'))
}

function toPlainText(html: string) {
  return html
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderTable(columns: TableColumn[], rows: TableRow[]) {
  const head = columns
    .map(
      (col) =>
        `<th align="${col.align || 'left'}" style="${baseStyles.tableCell}padding-top:10px;padding-bottom:10px;background:#f8fafc;${
          col.width ? `width:${col.width};` : ''
        }">${safeHtml(col.label)}</th>`
    )
    .join('')

  const body = rows
    .map(
      (row) =>
        `<tr>${row.cells
          .map(
            (cell, idx) =>
              `<td align="${cell.align || columns[idx]?.align || 'left'}" style="${baseStyles.tableCell}">${
                cell.value
              }</td>`
          )
          .join('')}</tr>`
    )
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="${baseStyles.tableWrapper}">
      <thead>
        <tr style="${baseStyles.tableHead}">${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `
}

function renderHighlights(highlights?: Highlight[]) {
  if (!highlights?.length) return ''
  const items = highlights
    .map(
      (h) => `
        <div style="${baseStyles.highlightCard}">
          <div style="font-weight:800;font-size:14px;color:#0f172a;margin-bottom:6px;">${h.icon ? `${h.icon} ` : ''}${h.title}</div>
          <div style="font-size:13px;color:#475569;line-height:1.6;">${h.description}</div>
        </div>
      `
    )
    .join('')
  return `<div style="${baseStyles.highlightWrap}">${items}</div>`
}

type BaseLayoutParams = {
  subject: string
  preheader?: string
  heroTitle: string
  heroSubtitle?: string
  badge?: AccentBadge
  contentHtml: string
  table?: { columns: TableColumn[]; rows: TableRow[] }
  highlights?: Highlight[]
  cta?: CTA
  footerNote?: string
}

function renderLayout(params: BaseLayoutParams): { html: string; text: string } {
  const preheader = params.preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;">${params.preheader}</span>`
    : ''

  const badge = params.badge
    ? `<span style="${baseStyles.badge};color:${params.badge.color || brand.accentColor};">${params.badge.label}</span>`
    : ''

  const tableHtml = params.table ? renderTable(params.table.columns, params.table.rows) : ''
  const highlightsHtml = renderHighlights(params.highlights)
  const ctaHtml = params.cta
    ? `<a href="${params.cta.url}" style="${baseStyles.cta}">${safeHtml(params.cta.label)}</a>`
    : ''

  const footerContacts = `
    <div style="margin-top:6px;">
      ${brand.supportPhone ? `<div style="margin-bottom:4px;">${brand.supportPhone}</div>` : ''}
      ${brand.supportEmail ? `<div><a href="mailto:${brand.supportEmail}" style="${baseStyles.footerLink}">${brand.supportEmail}</a></div>` : ''}
    </div>
    ${brand.address ? `<div style="${baseStyles.small};margin-top:4px;">${brand.address}</div>` : ''}
  `

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeHtml(params.subject)}</title>
      </head>
      <body style="${baseStyles.body}">
        ${preheader}
        <div style="${baseStyles.container}">
          <div style="${baseStyles.card}">
            <div style="${baseStyles.header}">
              <div style="${baseStyles.accentBar}"></div>
              <a href="${brand.siteUrl}" style="${baseStyles.logo}">
                <img src="${brand.logoUrl}" alt="${brand.brandName}" width="60" height="auto" style="display:block;max-width:60px;height:auto;border:none;outline:none;" />
                <span>${brand.brandName}</span>
              </a>
            </div>

            <div style="${baseStyles.hero}">
              ${badge}
              <h1 style="${baseStyles.title}">${safeHtml(params.heroTitle)}</h1>
              ${params.heroSubtitle ? `<p style="${baseStyles.subtitle}">${params.heroSubtitle}</p>` : ''}
            </div>

            <div style="${baseStyles.section}">
              <div style="font-size:15px;line-height:1.7;color:#1f2937;">${params.contentHtml}</div>
              ${tableHtml}
              ${highlightsHtml}
              ${ctaHtml}
            </div>

            <div style="${baseStyles.footer}">
              <div style="font-weight:800;font-size:13px;letter-spacing:0.3px;">${brand.brandName}</div>
              ${footerContacts}
              <div style="${baseStyles.small};margin-top:10px;">
                ${params.footerNote || 'Вы получили это письмо, потому что оставили запрос или оформили заказ на нашем сайте.'}
              </div>
              <div style="${baseStyles.small};margin-top:6px;">
                Если письмо отображается некорректно, откройте <a href="${brand.siteUrl}" style="${baseStyles.footerLink}">версию на сайте</a>.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return {
    html,
    text: toPlainText(html),
  }
}

export type OrderItem = { title: string; quantity: number; price: number }

export function buildOrderConfirmationEmail(params: {
  orderNumber: string
  customerName?: string
  items: OrderItem[]
  orderTotal: number
}): { subject: string; html: string; text: string } {
  const rows: TableRow[] = params.items.map((item) => ({
    cells: [
      { value: safeHtml(item.title) },
      { value: String(item.quantity), align: 'center' },
      { value: `${new Intl.NumberFormat('ru-RU').format(item.price)} ₽`, align: 'right' },
    ],
  }))

  const { html, text } = renderLayout({
    subject: `Ваш заказ №${params.orderNumber}`,
    preheader: 'Подтверждение и детали вашего заказа от Дома Пивовара.',
    heroTitle: `Спасибо за заказ №${params.orderNumber}!`,
    heroSubtitle: params.customerName
      ? `${safeHtml(params.customerName)}, мы соберём заказ и свяжемся для подтверждения.`
      : 'Мы соберём заказ и свяжемся для подтверждения.',
    badge: { label: 'Подтверждение заказа', color: brand.accentColor },
    contentHtml: `
      <p>Мы уже начали обработку заказа. В ближайшее время уточним детали доставки.</p>
      <p style="margin-top:12px;font-weight:700;">Сумма заказа: ${new Intl.NumberFormat('ru-RU').format(params.orderTotal)} ₽</p>
    `,
    table: {
      columns: [
        { label: 'Товар' },
        { label: 'Кол-во', align: 'center', width: '90px' },
        { label: 'Цена', align: 'right', width: '110px' },
      ],
      rows,
    },
    highlights: [
      { title: 'Чистые вкусы', description: 'Отбираем оборудование и ингредиенты под ваши задачи.' },
      { title: 'Поддержка 24/7', description: 'Поможем подобрать, настроить и запустить.', icon: '🤝' },
    ],
    cta: undefined, // письма информационные, без трекинга
  })

  return {
    subject: `Ваш заказ №${params.orderNumber}`,
    html,
    text,
  }
}

export function buildAdminOrderEmail(params: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderTotal: number
  deliveryAddress?: string
  items?: OrderItem[]
}): { subject: string; html: string; text: string } {
  const rows: TableRow[] = (params.items || []).map((item) => ({
    cells: [
      { value: safeHtml(item.title) },
      { value: String(item.quantity), align: 'center' },
      { value: `${new Intl.NumberFormat('ru-RU').format(item.price)} ₽`, align: 'right' },
    ],
  }))

  const { html, text } = renderLayout({
    subject: `Новый заказ №${params.orderNumber}`,
    preheader: 'Новая заявка на заказ, требуется обработка.',
    heroTitle: `Новый заказ №${params.orderNumber}`,
    heroSubtitle: `Клиент: ${params.customerName}`,
    badge: { label: 'Новый заказ', color: '#0ea5e9' },
    contentHtml: `
      <p><strong>Клиент:</strong> ${safeHtml(params.customerName)}</p>
      <p><strong>Телефон:</strong> ${safeHtml(params.customerPhone)}</p>
      <p><strong>Email:</strong> ${safeHtml(params.customerEmail)}</p>
      ${params.deliveryAddress ? `<p><strong>Адрес доставки:</strong> ${safeHtml(params.deliveryAddress)}</p>` : ''}
      <p style="margin-top:12px;font-weight:700;">Сумма заказа: ${new Intl.NumberFormat('ru-RU').format(params.orderTotal)} ₽</p>
    `,
    table: rows.length > 0
      ? {
          columns: [
            { label: 'Товар' },
            { label: 'Кол-во', align: 'center', width: '90px' },
            { label: 'Цена', align: 'right', width: '110px' },
          ],
          rows,
        }
      : undefined,
    highlights: [
      { title: 'Действие', description: 'Свяжитесь с клиентом и подтвердите заказ.' },
      { title: 'Доставка', description: params.deliveryAddress ? params.deliveryAddress : 'Адрес будет уточнён.' },
    ],
    cta: { label: 'Открыть заказ в админке', url: `${brand.siteUrl}/admin/orders/${encodeURIComponent(params.orderNumber)}` },
    footerNote: 'Письмо для администраторов. Не отправляйте клиенту.',
  })

  return { subject: `Новый заказ №${params.orderNumber}`, html, text }
}

export function buildAdminLeadEmail(params: {
  leadSource: string
  name: string
  phone?: string
  email?: string
  message?: string
}): { subject: string; html: string; text: string } {
  const { html, text } = renderLayout({
    subject: `Новая заявка: ${params.leadSource}`,
    preheader: 'Новый лид ожидает обработки.',
    heroTitle: 'Новая заявка',
    heroSubtitle: params.leadSource,
    badge: { label: 'Лид', color: '#22c55e' },
    contentHtml: `
      <p><strong>Имя:</strong> ${safeHtml(params.name)}</p>
      ${params.phone ? `<p><strong>Телефон:</strong> ${safeHtml(params.phone)}</p>` : ''}
      ${params.email ? `<p><strong>Email:</strong> ${safeHtml(params.email)}</p>` : ''}
      ${params.message ? `<p><strong>Комментарий:</strong><br>${safeHtml(params.message).replace(/\n/g, '<br>')}</p>` : ''}
    `,
    cta: { label: 'Открыть лид', url: `${brand.siteUrl}/admin/leads` },
    footerNote: 'Письмо для администраторов. Не отправляйте клиенту.',
  })

  return { subject: `Новая заявка: ${params.leadSource}`, html, text }
}

export function buildNewsletterEmail(params: {
  subject: string
  contentHtml: string
  preheader?: string
  cta?: CTA
  badgeLabel?: string
}): { subject: string; html: string; text: string } {
  const { html, text } = renderLayout({
    subject: params.subject,
    preheader: params.preheader || 'Новости и предложения от Дома Пивовара.',
    heroTitle: params.subject,
    badge: params.badgeLabel ? { label: params.badgeLabel, color: brand.accentColor } : undefined,
    contentHtml: params.contentHtml,
    cta: params.cta,
    highlights: [
      { title: 'Мы рядом', description: 'Поможем подобрать оборудование и ингредиенты.' },
      { title: 'Поддержка', description: 'Отвечаем на вопросы 7 дней в неделю.', icon: '✨' },
    ],
  })

  return { subject: params.subject, html, text }
}














