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

// Проверяем, является ли строка IP адресом
function isIPAddress(host: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipRegex.test(host)
}

// Определяем доменное имя по известным IP адресам SMTP серверов
function getDomainNameForIP(ip: string): string | null {
  const knownIPs: Record<string, string> = {
    '77.88.21.158': 'smtp.yandex.ru', // Yandex SMTP
    '77.88.8.88': 'smtp.yandex.ru',
    '94.100.180.201': 'smtp.mail.ru', // Mail.ru SMTP
    '217.69.139.24': 'smtp.mail.ru',
    '74.125.24.108': 'smtp.gmail.com', // Gmail SMTP
    '74.125.200.108': 'smtp.gmail.com',
  }
  return knownIPs[ip] || null
}

async function createTransporter(settings: EmailSettings) {
  const isIP = isIPAddress(settings.smtpHost)
  const isYandex = settings.smtpHost.includes('yandex.ru') || settings.smtpHost.includes('yandex.com')
  
  // Настройки TLS
  const tlsOptions: any = {
    rejectUnauthorized: true, // Проверяем сертификат для безопасности
  }
  
  // Если используется IP адрес, нужно указать servername для TLS
  if (isIP) {
    const domainName = getDomainNameForIP(settings.smtpHost)
    if (domainName) {
      tlsOptions.servername = domainName
      console.warn(`⚠️  Using IP address ${settings.smtpHost} for SMTP.`)
      console.warn(`   Detected domain: ${domainName}`)
      console.warn(`   💡 Recommendation: Use domain name "${domainName}" instead of IP address in SMTP settings`)
    } else {
      tlsOptions.servername = settings.smtpHost
      tlsOptions.rejectUnauthorized = false // Отключаем проверку сертификата для IP
    }
  }

  // Специальные настройки для Yandex
  if (isYandex) {
    // Yandex требует правильный servername для TLS
    if (!isIP) {
      tlsOptions.servername = 'smtp.yandex.ru'
    }
    console.log('📧 Using Yandex SMTP configuration')
  }

  const transportConfig: any = {
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465, // SSL для порта 465
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
    connectionTimeout: 20000, // 20 секунд таймаут подключения (уменьшено для быстрой диагностики)
    greetingTimeout: 10000, // 10 секунд таймаут приветствия
    socketTimeout: 20000, // 20 секунд таймаут сокета
    // Для порта 587 используем STARTTLS
    requireTLS: settings.smtpPort === 587,
    // Для порта 465 используем SSL напрямую
    tls: settings.smtpPort === 587 ? tlsOptions : undefined,
    // Отключаем пул соединений
    pool: false,
    // Не игнорируем TLS
    ignoreTLS: false,
    // Включаем debug только в development
    debug: process.env.NODE_ENV === 'development',
    // Дополнительные опции для надежности
    logger: process.env.NODE_ENV === 'development',
    // Дополнительные опции для обхода блокировок
    socket: undefined, // Используем системный сокет
  }

  // Для порта 465 используем SSL напрямую
  if (settings.smtpPort === 465) {
    transportConfig.secure = true
    transportConfig.tls = tlsOptions
  }

  return nodemailer.createTransport(transportConfig)
}

// Проверка доступности SMTP сервера
async function verifySMTPConnection(transporter: any): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error: any) {
    console.error('SMTP verification failed:', error.message)
    return false
  }
}

// Экспортируемая функция для тестирования SMTP подключения
export async function testSMTPConnection(settings: EmailSettings): Promise<{ success: boolean; message: string; details?: any }> {
  let transporter: any = null
  const isYandex = settings.smtpHost.includes('yandex.ru') || settings.smtpHost.includes('yandex.com')
  
  try {
    console.log(`🔍 Testing SMTP connection to ${settings.smtpHost}:${settings.smtpPort}`)
    
    transporter = await createTransporter(settings)
    
    // Проверяем подключение
    await transporter.verify()
    
    console.log('✅ SMTP connection test successful')
    
    // Закрываем соединение
    if (transporter) {
      transporter.close()
    }
    
    return {
      success: true,
      message: 'SMTP подключение успешно установлено',
    }
  } catch (error: any) {
    console.error('❌ SMTP connection test failed:', error)
    
    // Закрываем соединение при ошибке
    if (transporter) {
      try {
        transporter.close()
      } catch (closeError) {
        // Игнорируем ошибки закрытия
      }
    }
    
    // Если порт 587 не работает и это Yandex, пробуем порт 465
    if ((error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') && 
        settings.smtpPort === 587 && 
        isYandex) {
      console.log('🔄 Порт 587 заблокирован, пробуем порт 465 с SSL...')
      
      try {
        const altSettings = { ...settings, smtpPort: 465 }
        const altTransporter = await createTransporter(altSettings)
        await altTransporter.verify()
        
        if (altTransporter) {
          altTransporter.close()
        }
        
        return {
          success: true,
          message: 'SMTP подключение успешно установлено на порту 465',
          details: {
            originalPort: 587,
            workingPort: 465,
            suggestion: 'Порт 587 заблокирован, но порт 465 работает! Измените порт в настройках SMTP на 465.',
          },
        }
      } catch (altError: any) {
        console.error('❌ Port 465 also failed:', altError)
        // Оба порта заблокированы - возвращаем специальное сообщение
        return {
          success: false,
          message: 'Оба порта (587 и 465) заблокированы',
          details: {
            code: error.code,
            address: error.address || settings.smtpHost,
            blockedPorts: '587 и 465',
            suggestion: 'КРИТИЧЕСКАЯ ПРОБЛЕМА: Оба SMTP порта заблокированы.\n\n' +
              '⚠️ ОБНАРУЖЕНА ПРОБЛЕМА: Вы используете VPN (HitVPN), который блокирует SMTP порты!\n\n' +
              'ВОЗМОЖНЫЕ РЕШЕНИЯ:\n' +
              '1. 🔴 ОТКЛЮЧИТЕ VPN для отправки email - это самое простое решение\n' +
              '2. Настройте VPN, чтобы разрешить SMTP порты 587 и 465\n' +
              '3. Используйте другой VPN, который не блокирует SMTP\n' +
              '4. Используйте альтернативный SMTP сервис через API (SendGrid, Mailgun, Amazon SES) - они работают через HTTPS, а не SMTP порты\n' +
              '5. Проверьте настройки файрвола Windows\n' +
              '6. Убедитесь, что используете пароль приложения Yandex (https://id.yandex.ru/security)',
          },
        }
      }
    }
    
    let errorMessage = 'Не удалось подключиться к SMTP серверу'
    let details: any = {}
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      errorMessage = 'Таймаут подключения к SMTP серверу'
      const currentPort = error.port || settings.smtpPort
      const isPort465 = currentPort === 465
      
      let suggestion = ''
      if (isYandex) {
        if (isPort465) {
          suggestion = 'ОБА порта (587 и 465) заблокированы. ВОЗМОЖНЫЕ РЕШЕНИЯ:\n' +
            '1. ⚠️ ВАЖНО: Вы используете VPN (HitVPN) - он блокирует SMTP порты!\n' +
            '   - Отключите VPN для отправки email\n' +
            '   - Или настройте VPN, чтобы разрешить SMTP порты 587 и 465\n' +
            '   - Или используйте другой VPN, который не блокирует SMTP\n' +
            '2. Проверьте настройки файрвола/антивируса\n' +
            '3. Используйте альтернативный SMTP сервис (SendGrid, Mailgun, Amazon SES) - они работают через HTTPS API\n' +
            '4. Убедитесь, что используете пароль приложения Yandex (https://id.yandex.ru/security)'
        } else {
          suggestion = 'Порт 587 заблокирован. Система автоматически попробует порт 465. Если и он не работает, проверьте файрвол и настройки провайдера.'
        }
      } else {
        suggestion = 'Порт может быть заблокирован файрволом или провайдером. Попробуйте использовать порт 465 с SSL вместо 587.'
      }
      
      details = {
        code: error.code,
        address: error.address || settings.smtpHost,
        port: currentPort,
        suggestion,
        blockedPorts: isPort465 ? 'Оба порта (587 и 465) заблокированы' : 'Порт 587 заблокирован',
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Соединение отклонено SMTP сервером'
      details = {
        code: error.code,
        suggestion: 'Проверьте правильность хоста и порта SMTP сервера.',
      }
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Ошибка аутентификации'
      details = {
        code: error.code,
        suggestion: 'Проверьте правильность имени пользователя и пароля. Для Yandex используйте пароль приложения (https://id.yandex.ru/security).',
      }
    } else if (error.code === 'ETLS') {
      errorMessage = 'Ошибка TLS/SSL соединения'
      details = {
        code: error.code,
        suggestion: 'Проверьте настройки шифрования. Попробуйте использовать порт 465 с SSL или 587 с STARTTLS.',
      }
    } else {
      errorMessage = error.message || 'Неизвестная ошибка подключения'
      details = {
        code: error.code || 'UNKNOWN',
        message: error.message,
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      details,
    }
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  let transporter: any = null
  let settings: EmailSettings | null = null
  
  try {
    settings = await getEmailSettings()
    if (!settings) {
      console.error('Email settings not configured')
      return false
    }

    const isYandex = settings.smtpHost.includes('yandex.ru') || settings.smtpHost.includes('yandex.com')
    
    console.log(`📧 Attempting to send email via ${settings.smtpHost}:${settings.smtpPort}`)
    if (isYandex) {
      console.log('   Using Yandex SMTP configuration')
    }
    
    transporter = await createTransporter(settings)

    const result = await transporter.sendMail({
      from: settings.fromEmail,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    })

    console.log('✅ Email sent successfully:', result.messageId)
    return true
  } catch (error: any) {
    console.error('Email send error:', error)
    
    // Закрываем соединение при ошибке
    if (transporter) {
      try {
        transporter.close()
      } catch (closeError) {
        // Игнорируем ошибки закрытия
      }
    }
    
    // Детальная диагностика ошибок
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.error('❌ SMTP connection timeout')
      const address = error.address || (settings ? settings.smtpHost : 'unknown')
      const port = error.port || (settings ? settings.smtpPort : 'unknown')
      console.error('   Address:', address)
      console.error('   Port:', port)
      console.error('   Possible causes:')
      console.error('   1. Firewall is blocking port 587 (try port 465 with SSL)')
      console.error('   2. SMTP server is down or unreachable')
      console.error('   3. Network issues or ISP blocking SMTP')
      console.error('   4. For Yandex: Make sure you are using an App Password, not your account password')
      console.error('   Solutions:')
      if (settings?.smtpHost?.includes('yandex')) {
        console.error('   🔑 IMPORTANT: Yandex requires App Password, not regular password!')
        console.error('     1. Go to https://id.yandex.ru/security')
        console.error('     2. Enable "App passwords"')
        console.error('     3. Generate new password for "Mail"')
        console.error('     4. Use this password in SMTP settings')
      }
      console.error('   - Try port 465 with SSL instead of 587 (change in SMTP settings)')
      console.error('   - Check firewall/antivirus settings (they may block port 587)')
      console.error('   - Test connection: telnet smtp.yandex.ru 587 (should connect)')
      console.error('   - Check if your ISP blocks SMTP ports')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ SMTP connection refused')
      console.error('   The server rejected the connection')
      console.error('   Check SMTP host and port settings')
    } else if (error.code === 'EAUTH') {
      console.error('❌ SMTP authentication failed')
      console.error('   Check username and password in SMTP settings')
    } else {
      console.error('❌ Unknown SMTP error:', error.code || 'N/A')
      console.error('   Error message:', error.message)
    }
    
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

export async function sendNewLeadNotificationEmail(
  leadSource: string,
  name: string,
  phone?: string,
  email?: string,
  message?: string
): Promise<boolean> {
  const settings = await getEmailSettings()
  if (!settings) {
    return false
  }

  const sourceLabels: Record<string, string> = {
    'callback': 'Заказ звонка',
    'cheaper': 'Нашли дешевле',
    'quick-buy': 'Быстрая покупка',
    'contact': 'Обратная связь',
  }

  const sourceLabel = sourceLabels[leadSource] || leadSource

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Новая заявка: ${sourceLabel}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e74c3c;">Новая заявка: ${sourceLabel}</h1>
          <h2>Данные клиента:</h2>
          <ul>
            <li><strong>Имя:</strong> ${name}</li>
            ${phone ? `<li><strong>Телефон:</strong> ${phone}</li>` : ''}
            ${email ? `<li><strong>Email:</strong> ${email}</li>` : ''}
            ${message ? `<li><strong>Сообщение:</strong><br>${message.replace(/\n/g, '<br>')}</li>` : ''}
          </ul>
          <p>Пожалуйста, обработайте заявку в админ-панели.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail(
    settings.companyEmail,
    `Новая заявка: ${sourceLabel}`,
    html
  )
}








