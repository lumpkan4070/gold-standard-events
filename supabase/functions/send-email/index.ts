import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple branded email template using React Email components inline
function EmailLayout({ children, preview, title }: { children: React.ReactNode; preview: string; title: string }) {
  return (
    <html>
      <head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ backgroundColor: '#0b0b0b', margin: 0, padding: 0, fontFamily: 'Inter, Arial, sans-serif', color: '#e6e6e6' }}>
        <div style={{ display: 'none', overflow: 'hidden', lineHeight: '1px', opacity: 0, maxHeight: 0, maxWidth: 0 }}>{preview}</div>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              <td align="center">
                <table width="600" cellPadding={0} cellSpacing={0} role="presentation" style={{ width: '100%', maxWidth: '600px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '0.4px', color: '#f4d27a' }}>Victory Bistro Ultra Lounge</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: '#121212', borderRadius: 12, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '24px', textAlign: 'center', color: '#aaaaaa', fontSize: 12 }}>
                        © {new Date().getFullYear()} Victory Bistro. All rights reserved.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

function PrimaryButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg,#f4d27a,#b99034)',
        color: '#1a1a1a',
        textDecoration: 'none',
        padding: '12px 18px',
        borderRadius: 10,
        fontWeight: 700,
        letterSpacing: '0.2px',
      }}
    >
      {label}
    </a>
  )
}

function buildSubject(emailActionType: string) {
  switch (emailActionType) {
    case 'signup':
      return 'Confirm your Victory Bistro account'
    case 'magiclink':
      return 'Your secure sign-in link'
    case 'recovery':
      return 'Reset your Victory Bistro password'
    case 'email_change_current':
    case 'email_change_new':
      return 'Confirm your email change'
    default:
      return 'Action required'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Supabase sends a signed webhook with the auth email payload
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)

    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(
      email_action_type
    )}&redirect_to=${encodeURIComponent(redirect_to)}`

    const subject = buildSubject(email_action_type)

    const html = await renderAsync(
      React.createElement(EmailLayout, {
        preview: 'Secure your Victory Bistro account',
        title: subject,
        children: (
          <div>
            <h2 style={{ marginTop: 0, color: '#f4d27a', fontSize: 20 }}>{subject}</h2>
            <p style={{ lineHeight: 1.6 }}>
              Tap the button below to continue.
              <br />
              This link will expire shortly for your security.
            </p>
            <div style={{ margin: '16px 0 22px' }}>
              <PrimaryButton href={verifyUrl} label="Continue" />
            </div>
            <p style={{ color: '#bfbfbf', fontSize: 12 }}>
              If the button doesn’t work, copy and paste this URL into your browser:
              <br />
              <span style={{ wordBreak: 'break-all', color: '#e6e6e6' }}>{verifyUrl}</span>
            </p>
          </div>
        ),
      })
    )

    const { error } = await resend.emails.send({
      from: 'Victory Bistro <no-reply@victorybistro.com>',
      to: [user.email],
      subject,
      html,
    })

    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('send-email edge function error:', err)
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Unknown error' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
