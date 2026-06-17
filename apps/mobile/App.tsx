/**
 * App root — wires up the global providers, in order:
 *   SafeArea → Theme → React Query → Auth → Navigation
 */
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {StatusBar} from 'expo-status-bar'
import React from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'

import {ThemeProvider} from '#/alf'
import {AuthProvider} from '#/lib/auth'
import {RootNavigator} from '#/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 1, staleTime: 30_000},
  },
})

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
