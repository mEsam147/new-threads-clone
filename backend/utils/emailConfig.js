import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'Gmail', // You can use other services like 'Outlook', 'Yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
  })
}

// Email templates
const emailTemplates = {
  verification: (verificationUrl) => ({
    subject: 'Verify your email - Threads Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Welcome to Threads Clone! 👋</h1>
        <p style="font-size: 16px; color: #666;">Thank you for signing up. Please verify your email address to get started.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #999;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 14px; color: #999; word-break: break-all;">${verificationUrl}</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  }),
  passwordReset: (resetUrl) => ({
    subject: 'Reset your password - Threads Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
        <p style="font-size: 16px; color: #666;">You requested to reset your password. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #999;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 14px; color: #999; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  }),
}

// Email sending functions
export const sendVerificationEmail = async (email, token) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration missing. Skipping email send.')
    return
  }

  try {
    const transporter = createTransporter()
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`
    const template = emailTemplates.verification(verificationUrl)

    await transporter.sendMail({
      from: `"Threads Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    })

    console.log('Verification email sent successfully')
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw new Error('Failed to send verification email')
  }
}

export const sendPasswordResetEmail = async (email, token) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration missing. Skipping email send.')
    return
  }

  try {
    const transporter = createTransporter()
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`
    const template = emailTemplates.passwordReset(resetUrl)

    await transporter.sendMail({
      from: `"Threads Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    })

    console.log('Password reset email sent successfully')
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}
