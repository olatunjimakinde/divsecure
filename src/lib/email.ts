
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Rentra <onboarding@resend.dev>' // Default Resend test email, user should update for prod

export async function sendInvitationEmail(email: string, link: string, communityName?: string) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing. Email not sent.')
        return { error: 'RESEND_API_KEY is missing' }
    }

    try {
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
            console.error('Resend Error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        console.error('Email Send Error:', error)
        return { error: 'Failed to send email' }
    }
}
