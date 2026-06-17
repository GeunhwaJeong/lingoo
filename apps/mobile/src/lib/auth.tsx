/**
 * Auth context — exposes the current Supabase session app-wide and keeps it
 * in sync with sign-in / sign-out events.
 */
import {type Session} from '@supabase/supabase-js'
import React, {createContext, useContext, useEffect, useState} from 'react'

import {supabase} from '#/lib/supabase'

interface AuthState {
  session: Session | null
  initializing: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  initializing: true,
  signOut: async () => {},
})

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session)
      setInitializing(false)
    })
    const {data: sub} = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        initializing,
        signOut: async () => {
          await supabase.auth.signOut()
        },
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
