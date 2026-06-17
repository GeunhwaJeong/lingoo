import {type ExpoConfig} from 'expo/config'

/**
 * Expo app config. `extra` is where we surface public env vars to the running
 * app (read via expo-constants). The Supabase anon key is safe to ship — row
 * level security on the backend is what actually protects data.
 */
const config: ExpoConfig = {
  name: 'lingoo',
  slug: 'lingoo',
  scheme: 'lingoo',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.lingoo.mobile',
  },
  android: {
    package: 'app.lingoo.mobile',
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
}

export default config
