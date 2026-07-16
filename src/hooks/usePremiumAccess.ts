import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isFeatureEnabled } from '@/config/featureFlags'

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'premium', 'pro']

const includesPremiumKeyword = (value: unknown): boolean => {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return (
    normalized.includes('premium') ||
    normalized.includes('pro') ||
    normalized.includes('vip')
  )
}

const hasActivePremiumSubscription = (user: Record<string, unknown>): boolean => {
  const subscription = user.subscription as Record<string, unknown> | undefined
  const status = String(
    subscription?.status ??
      user.subscription_status ??
      user.plan_status ??
      ''
  )
    .trim()
    .toLowerCase()

  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status)
}

export const usePremiumAccess = () => {
  const { user, isAuthenticated } = useAuth()
  const premiumFeatureEnabled = useMemo(
    () => isFeatureEnabled('premium_membership'),
    []
  )

  const isPremiumUser = useMemo(() => {
    if (!user || !isAuthenticated) return false
    const raw = user as unknown as Record<string, unknown>

    return (
      raw.is_premium === true ||
      raw.premium === true ||
      raw.premium_active === true ||
      hasActivePremiumSubscription(raw) ||
      includesPremiumKeyword(raw.user_role) ||
      includesPremiumKeyword(raw.plan) ||
      includesPremiumKeyword(raw.membership_tier)
    )
  }, [isAuthenticated, user])

  const canAccessPremiumFeature =
    !premiumFeatureEnabled || (isAuthenticated && isPremiumUser)

  return {
    premiumFeatureEnabled,
    isPremiumUser,
    canAccessPremiumFeature,
    isPremiumRequired: premiumFeatureEnabled && !canAccessPremiumFeature,
  }
}

export type PremiumAccessState = ReturnType<typeof usePremiumAccess>

