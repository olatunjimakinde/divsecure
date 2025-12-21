
const { Resend } = require('resend');

// Manually Load Env if needed, or just hardcode for this test script since we know the key
const RESEND_API_KEY = 're_EMZtVbTj_H3BNfed5zGFD5tGshDCEUoow';

const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
    console.log('Attempting to send test email...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev', // Use the magic valid email for Resend test mode
            subject: 'Test Email from Script',
            html: '<p>If you see this, the API key works!</p>'
        });

        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

sendTestEmail();
