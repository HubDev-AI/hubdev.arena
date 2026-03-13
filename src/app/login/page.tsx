'use server'

import { redirect } from 'next/navigation'

import { resolveLoginRedirectPath } from '@/lib/login-redirect'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getBuilderSession } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

async function signInWithTwitter(formData: FormData) {
  'use server'
  const returnTo = (formData.get('returnTo') as string) ?? '/'
  const supabase = await createServerSupabaseClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${siteUrl}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
    },
  })
  if (data.url) redirect(data.url)
}

async function signInWithEmail(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const returnTo = (formData.get('returnTo') as string) ?? '/'
  if (!email) redirect('/login?error=email_required')
  const supabase = await createServerSupabaseClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
    },
  })
  redirect('/login?message=Check+your+email+for+a+magic+link')
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[]
    returnTo?: string | string[]
    message?: string
    error?: string
  }>
}) {
  const params = await searchParams
  const session = await getBuilderSession()

  // Support both ?next= (existing links) and ?returnTo= (new OAuth flow)
  const rawNext = params.next ?? params.returnTo
  const redirectTo = resolveLoginRedirectPath(
    Array.isArray(rawNext) ? rawNext[0] : rawNext,
  )

  if (session) {
    redirect(redirectTo)
  }

  const message = Array.isArray(params.message) ? params.message[0] : params.message
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error

  return (
    <div
      style={{ background: '#F5F5F5', minHeight: '100vh' }}
      className="flex items-center justify-center px-4 py-16"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          border: '3px solid #000',
          boxShadow: '6px 6px 0 #000',
          background: '#fff',
          padding: '2rem',
        }}
      >
        {/* Heading */}
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#555',
            marginBottom: 8,
          }}
        >
          Account auth
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 900,
            fontSize: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#000',
            marginBottom: '1.5rem',
          }}
        >
          Sign in to submit and vote
        </h1>

        {/* Status messages */}
        {message && (
          <p
            style={{
              background: '#00FF41',
              border: '2px solid #000',
              padding: '0.5rem 0.75rem',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#000',
              marginBottom: '1rem',
            }}
          >
            {message}
          </p>
        )}
        {errorParam && (
          <p
            style={{
              background: '#FF3B3B',
              border: '2px solid #000',
              padding: '0.5rem 0.75rem',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#fff',
              marginBottom: '1rem',
            }}
          >
            {errorParam === 'auth'
              ? 'Authentication failed. Please try again.'
              : errorParam === 'email_required'
                ? 'Please enter an email address.'
                : errorParam}
          </p>
        )}

        {/* Twitter OAuth form */}
        <form action={signInWithTwitter}>
          <input type="hidden" name="returnTo" value={redirectTo} />
          <button
            type="submit"
            style={{
              display: 'block',
              width: '100%',
              background: '#00FF41',
              color: '#000',
              border: '3px solid #000',
              boxShadow: '4px 4px 0 #000',
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              marginBottom: '1.25rem',
              borderRadius: 0,
            }}
          >
            SIGN IN WITH X →
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ flex: 1, height: 2, background: '#000' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#555',
              whiteSpace: 'nowrap',
            }}
          >
            or continue with email
          </span>
          <div style={{ flex: 1, height: 2, background: '#000' }} />
        </div>

        {/* Magic link form */}
        <form action={signInWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="hidden" name="returnTo" value={redirectTo} />
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#555',
                marginBottom: 4,
              }}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              style={{
                display: 'block',
                width: '100%',
                border: '2px solid #000',
                padding: '0.6rem 0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 13,
                background: '#F5F5F5',
                color: '#000',
                outline: 'none',
                borderRadius: 0,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              display: 'block',
              width: '100%',
              background: '#0033FF',
              color: '#fff',
              border: '3px solid #000',
              boxShadow: '4px 4px 0 #000',
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Send magic link →
          </button>
        </form>
      </div>
    </div>
  )
}
