
import { Resend } from 'resend'

const FROM_EMAIL = 'Rentra <onboarding@resend.dev>' // Default Resend test email, user should update for prod

export async function sendInvitationEmail(email: string, link: string, communityName?: string) {
  console.log('sendInvitationEmail called with:', { email, link: link.substring(0, 20) + '...', communityName })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing. Email not sent.')
    return { error: 'RESEND_API_KEY is missing' }
  } else {
    console.log('RESEND_API_KEY is present (length: ' + apiKey.length + ')')
  }

  try {
    console.log('Sending email via Resend...')
    // Initialize Resend lazily
    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Invitation to join ${communityName || 'Community'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You have been invited!</h2>
          <p>You have been invited to join <strong>${communityName || 'the community'}</strong> on Rentra.</p>
          <p>Please click the button below to accept your invitation and set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${link}</p>
        </div>
      `
    })

    if (error) {
      console.error('Resend API Error:', error)
      return { error: error.message }
    }

    console.log('Resend Success:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email Send Exception:', error)
    return { error: 'Failed to send email' }
  }
}
