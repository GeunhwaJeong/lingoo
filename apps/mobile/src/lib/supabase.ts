/**
 * Supabase client, configured for React Native.
 *
 * - Auth session is persisted in AsyncStorage so users stay logged in.
 * - `detectSessionInUrl: false` because there's no browser URL on native.
 * - Public URL + anon key come from app.config.ts `extra` (env-driven).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import {createClient} from '@supabase/supabase-js'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}
const supabaseUrl = extra.supabaseUrl as string
const supabaseAnonKey = extra.supabaseAnonKey as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev — a missing key is the #1 "why won't it connect" bug.
  console.warn(
    '[lingoo] Supabase env not set. Copy apps/mobile/.env.example → .env and fill it in.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
