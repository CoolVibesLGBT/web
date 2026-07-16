export type FeatureFlagKey =
  | 'premium_membership'
  | 'ads_enabled'
  | 'ads_in_flows'
  | 'ads_in_nearby'
  | 'ads_in_live'
  | 'live_enabled'

type FeatureFlagMap = Record<FeatureFlagKey, boolean>

const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = {
  premium_membership: false,
  ads_enabled: false,
  ads_in_flows: false,
  ads_in_nearby: false,
  ads_in_live: false,
  live_enabled: true,
}

const FEATURE_FLAG_ENV_KEYS: Record<FeatureFlagKey, string> = {
  premium_membership: 'PUBLIC_FF_PREMIUM_MEMBERSHIP',
  ads_enabled: 'PUBLIC_FF_ADS',
  ads_in_flows: 'PUBLIC_FF_ADS_FLOWS',
  ads_in_nearby: 'PUBLIC_FF_ADS_NEARBY',
  ads_in_live: 'PUBLIC_FF_ADS_LIVE',
  live_enabled: 'PUBLIC_FF_LIVE_ENABLED',
}

const parseBooleanFlag = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

const readLocalFlag = (key: FeatureFlagKey): boolean | null => {
  if (typeof window === 'undefined') return null

  try {
    const rawSingle = window.localStorage.getItem(`ff.${key}`)
    const single = parseBooleanFlag(rawSingle)
    if (single !== null) return single

    const rawMap = window.localStorage.getItem('featureFlags')
    if (!rawMap) return null
    const parsed = JSON.parse(rawMap) as Record<string, unknown>
    return parseBooleanFlag(parsed?.[key])
  } catch {
    return null
  }
}

const readEnvFlag = (key: FeatureFlagKey): boolean | null => {
  const envKey = FEATURE_FLAG_ENV_KEYS[key]
  const envValue = (import.meta as unknown as { env?: Record<string, unknown> })?.env?.[envKey]
  return parseBooleanFlag(envValue)
}

const resolveFlag = (key: FeatureFlagKey): boolean => {
  const localValue = readLocalFlag(key)
  if (localValue !== null) return localValue

  const envValue = readEnvFlag(key)
  if (envValue !== null) return envValue

  return DEFAULT_FEATURE_FLAGS[key]
}

export const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
  if (key === 'ads_in_flows' || key === 'ads_in_nearby' || key === 'ads_in_live') {
    return resolveFlag('ads_enabled') && resolveFlag(key)
  }
  return resolveFlag(key)
}

export const getFeatureFlagsSnapshot = (): FeatureFlagMap => ({
  premium_membership: isFeatureEnabled('premium_membership'),
  ads_enabled: isFeatureEnabled('ads_enabled'),
  ads_in_flows: isFeatureEnabled('ads_in_flows'),
  ads_in_nearby: isFeatureEnabled('ads_in_nearby'),
  ads_in_live: isFeatureEnabled('ads_in_live'),
  live_enabled: isFeatureEnabled('live_enabled'),
})
