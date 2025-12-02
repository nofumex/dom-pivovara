import nodemailer from 'nodemailer'
import { prisma } from './db'
import { SettingType } from '@prisma/client'

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  companyEmail: string
}

async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'emailSettings' },
    })

    if (!setting || setting.type !== SettingType.JSON) {
      return null
    }

    return JSON.parse(setting.value) as EmailSettings
  } catch {
    return null
  }
}

async function createTransporter(settings: EmailSettings) {
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
  })
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const settings = await getEmailSettings()
    if (!settings) {
      console.error('Email settings not configured')
      return false
    }

    const transporter = await createTransporter(settings)

    await transporter.sendMail({
      from: settings.fromEmail,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    })

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendOrderConfirmationEmail(
  orderNumber: string,
  customerEmail: string,
  orderTotal: number,
  items: Array<{ title: string; quantity: number; price: number }>
): Promise<boolean> {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td>${item.title}</td>
      <td>${item.quantity}</td>
      <td>${new Intl.NumberFormat('ru-RU').format(item.price)} ₽</td>
    </tr>
  `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ваш заказ №${orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Ваш заказ №${orderNumber}</h1>
          <p>Спасибо за ваш заказ!</p>
          <h2>Состав заказа:</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Товар</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Количество</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Цена</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="font-size: 18px; font-weight: bold;">
            Итого: ${new Intl.NumberFormat('ru-RU').format(orderTotal)} ₽
          </p>
          <p>Мы свяжемся с вами в ближайшее время для подтверждения заказа.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail(
    customerEmail,
    `Ваш заказ №${orderNumber}`,
    html
  )
}

export async function sendNewOrderNotificationEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  orderTotal: number,
  deliveryAddress?: string
): Promise<boolean> {
  const settings = await getEmailSettings()
  if (!settings) {
    return false
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Новый заказ №${orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e74c3c;">Новый заказ №${orderNumber}</h1>
          <h2>Данные клиента:</h2>
          <ul>
            <li><strong>Имя:</strong> ${customerName}</li>
            <li><strong>Email:</strong> ${customerEmail}</li>
            <li><strong>Телефон:</strong> ${customerPhone}</li>
            ${deliveryAddress ? `<li><strong>Адрес доставки:</strong> ${deliveryAddress}</li>` : ''}
          </ul>
          <p style="font-size: 18px; font-weight: bold;">
            Сумма заказа: ${new Intl.NumberFormat('ru-RU').format(orderTotal)} ₽
          </p>
          <p>Пожалуйста, обработайте заказ в админ-панели.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail(
    settings.companyEmail,
    `Новый заказ №${orderNumber}`,
    html
  )
}




