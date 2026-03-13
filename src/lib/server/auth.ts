import { redirect } from 'next/navigation'

import { getAdminAllowlist } from '@/lib/env'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Legacy cookie names kept so voter-identity.ts and dev endpoints continue to compile.
// In Supabase auth mode these cookies are not actively written by server code;
// the Supabase SSR client manages its own session cookies instead.
export const BUILDER_COOKIE_NAME = 'va-builder'
export const VOTER_COOKIE_NAME = 'va-voter'

export type BuilderSession = {
  userId: string
  email: string
  displayName: string
  isAdmin: boolean
}

// ---------------------------------------------------------------------------
// Core Supabase session helpers (new canonical API)
// ---------------------------------------------------------------------------

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function requireSession(returnTo?: string) {
  const session = await getSession()
  if (!session) {
    const returnParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    redirect(`/login${returnParam}`)
  }
  return session
}

export async function getAdminSession() {
  const session = await getSession()
  if (!session) return null

  const adminEmails = getAdminAllowlist()
  if (!adminEmails.includes((session.user.email ?? '').toLowerCase())) return null
  return session
}

// ---------------------------------------------------------------------------
// BuilderSession helpers — used across pages, actions, and API routes.
// These map a Supabase session onto the existing BuilderSession shape so all
// callers continue to work without changes.
// ---------------------------------------------------------------------------

function supabaseSessionToBuilderSession(
  session: Awaited<ReturnType<typeof getSession>>,
): BuilderSession | null {
  if (!session) return null
  const adminEmails = getAdminAllowlist()
  const email = session.user.email ?? ''
  const displayName =
    (session.user.user_metadata?.full_name as string | undefined) ||
    (session.user.user_metadata?.name as string | undefined) ||
    email.split('@')[0] ||
    'User'
  return {
    userId: session.user.id,
    email,
    displayName,
    isAdmin: adminEmails.includes(email.toLowerCase()),
  }
}

export async function getBuilderSession(): Promise<BuilderSession | null> {
  const session = await getSession()
  return supabaseSessionToBuilderSession(session)
}

export async function requireBuilderSession(nextPath?: string) {
  const session = await getBuilderSession()
  if (!session) {
    const destination = nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : '/login'
    redirect(destination)
  }
  return session
}

export async function requireAdminSession(nextPath?: string) {
  const session = await requireBuilderSession(nextPath)
  if (!session.isAdmin) {
    redirect('/')
  }
  return session
}
