/**
 * Welcome / auth entry screen (shown when signed out).
 * Wired to Supabase magic-link sign-in as a starting point — swap for
 * OAuth / phone / password later.
 */
import React, {useState} from 'react'
import {Alert, TextInput, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Text'
import {supabase} from '#/lib/supabase'

export function WelcomeScreen() {
  const t = useTheme()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function signIn() {
    if (!email.includes('@')) {
      Alert.alert('Enter a valid email')
      return
    }
    setSending(true)
    const {error} = await supabase.auth.signInWithOtp({email})
    setSending(false)
    Alert.alert(error ? 'Sign-in failed' : 'Check your email', error?.message ?? 'We sent you a magic link.')
  }

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]}>
      <View style={[a.flex_1, a.justify_center, a.p_xl, a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text variant="title" style={{color: t.palette.primary}}>
            lingoo
          </Text>
          <Text variant="body" muted>
            Learn a language by talking to real people. No spam, no clutter.
          </Text>
        </View>

        <View style={[a.gap_sm]}>
          <Text variant="label">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={t.palette.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              a.px_lg,
              a.py_md,
              a.rounded_md,
              a.text_md,
              {
                backgroundColor: t.palette.surface,
                borderWidth: 1,
                borderColor: t.palette.border,
                color: t.palette.text,
              },
            ]}
          />
        </View>

        <Button label="Send magic link" onPress={signIn} loading={sending} />

        <Text variant="caption" muted style={[a.text_center, {marginTop: tokens.space.sm}]}>
          By continuing you agree to be kind to your language partners.
        </Text>

        {/* Dev-only shortcut: log in instantly as a seeded demo account. */}
        {__DEV__ && (
          <View style={[a.gap_sm, {marginTop: tokens.space.xl}]}>
            <Text variant="caption" muted style={a.text_center}>
              — dev only —
            </Text>
            <Button
              label="Enter as demo (me@demo.dev)"
              variant="secondary"
              onPress={async () => {
                const {error} = await supabase.auth.signInWithPassword({
                  email: 'me@demo.dev',
                  password: 'password123',
                })
                if (error) Alert.alert('Demo login failed', error.message)
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
