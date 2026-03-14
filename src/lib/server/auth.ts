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
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function requireSession(returnTo?: string) {
  const user = await getSession()
  if (!user) {
    const returnParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    redirect(`/login${returnParam}`)
  }
  return user
}

export async function getAdminSession() {
  const user = await getSession()
  if (!user) return null

  const adminEmails = getAdminAllowlist()
  if (!adminEmails.includes((user.email ?? '').toLowerCase())) return null
  return user
}

// ---------------------------------------------------------------------------
// BuilderSession helpers — used across pages, actions, and API routes.
// These map a Supabase user onto the existing BuilderSession shape so all
// callers continue to work without changes.
// ---------------------------------------------------------------------------

function supabaseUserToBuilderSession(
  user: Awaited<ReturnType<typeof getSession>>,
): BuilderSession | null {
  if (!user) return null
  const adminEmails = getAdminAllowlist()
  const email = user.email ?? ''
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    email.split('@')[0] ||
    'User'
  return {
    userId: user.id,
    email,
    displayName,
    isAdmin: adminEmails.includes(email.toLowerCase()),
  }
}

export async function getBuilderSession(): Promise<BuilderSession | null> {
  const user = await getSession()
  return supabaseUserToBuilderSession(user)
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
