const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

async function send_otp_email(recipient_email, otp) {
  if (!process.env.SMTP_USER) {
    console.log('OTP for', recipient_email, 'is', otp)
    return
  }

  const mail_options = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipient_email,
    subject: 'Your AgriQual verification code',
    text: 'Your verification code is ' + otp + '. It will expire in 10 minutes.'
  }

  await transporter.sendMail(mail_options)
}

module.exports = {
  send_otp_email
}
