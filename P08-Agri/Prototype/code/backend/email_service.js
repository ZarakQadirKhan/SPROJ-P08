const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function send_otp_email(recipient_email = '', otp = '') {
  if (!recipient_email || !otp) {
    throw new Error('Missing recipient_email or otp')
  }

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('OTP for', recipient_email, 'is', otp)
      return
    }
    throw new Error('RESEND_API_KEY is not set')
  }

  const from_email = process.env.EMAIL_FROM || 'AgriQual <onboarding@resend.dev>'

  const text_lines = [
    'Your AgriQual verification code is: ' + otp,
    '',
    'This code will expire in 10 minutes.',
    '',
    'If you did not request this code, you can ignore this email.'
  ]

  const result = await resend.emails.send({
    from: from_email,
    to: [recipient_email],
    subject: 'Your AgriQual verification code',
    text: text_lines.join('\n')
  })

  if (result && result.error) {
    throw new Error(String(result.error.message || 'Resend failed'))
  }

  if (result && result.id) {
    console.log('Resend OTP email id:', result.id)
  }
}

async function send_help_email(payload = {}) {
  const subject = String(payload?.subject || '')
  const message = String(payload?.message || '')
  const user_email = String(payload?.userEmail || '').trim()
  const ticket_id = String(payload?.ticketId || '').trim()

  const to_email = process.env.SUPPORT_TO_EMAIL || '26100370@lums.edu.pk'

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Help email (not actually sent). To:', to_email)
      console.log('From user:', user_email || 'Unknown user')
      if (ticket_id) {
        console.log('Ticket ID:', ticket_id)
      }
      console.log('Subject:', subject)
      console.log('Message:', message)
      return
    }
    throw new Error('RESEND_API_KEY is not set')
  }

  const from_email = process.env.EMAIL_FROM || 'AgriQual <onboarding@resend.dev>'
  const final_subject = '[AgriQual Help] ' + subject

  const body_lines = [
    ...(ticket_id ? ['Ticket ID: ' + ticket_id, ''] : []),
    'New help request from: ' + (user_email || 'Unknown user'),
    '',
    'Subject: ' + subject,
    '',
    'Message:',
    message
  ]

  const result = await resend.emails.send({
    from: from_email,
    to: [to_email],
    subject: final_subject,
    text: body_lines.join('\n')
  })

  if (result && result.error) {
    throw new Error(String(result.error.message || 'Resend failed'))
  }

  if (result && result.id) {
    console.log('Resend help email id:', result.id)
  }
}

async function send_password_change_email(recipient_email = '') {
  if (!recipient_email) {
    throw new Error('Missing recipient_email')
  }

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Password change notification (not actually sent). To:', recipient_email)
      return
    }
    throw new Error('RESEND_API_KEY is not set')
  }

  const from_email = process.env.EMAIL_FROM || 'AgriQual <onboarding@resend.dev>'

  const lines = [
    'Hello,',
    '',
    'This is a confirmation that the password for your AgriQual account was changed.',
    '',
    'If you made this change, no further action is needed.',
    'If you did NOT change your password, please reset it immediately and contact support.',
    '',
    'This email was sent automatically. Please do not reply.'
  ]

  const result = await resend.emails.send({
    from: from_email,
    to: [recipient_email],
    subject: 'Your AgriQual password was changed',
    text: lines.join('\n')
  })

  if (result && result.error) {
    throw new Error(String(result.error.message || 'Resend failed'))
  }

  if (result && result.id) {
    console.log('Resend password change email id:', result.id)
  }
}

module.exports = {
  send_otp_email,
  send_help_email,
  send_password_change_email
}
