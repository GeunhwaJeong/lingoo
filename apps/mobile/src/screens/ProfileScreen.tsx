/**
 * Profile — current user's profile + sign out. Placeholder fields until the
 * profiles query is wired up.
 */
import React from 'react'
import {View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Text'
import {useAuth} from '#/lib/auth'

export function ProfileScreen() {
  const t = useTheme()
  const {session, signOut} = useAuth()
  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]} edges={['top']}>
      <View style={[a.flex_1, a.p_xl, a.gap_lg]}>
        <Text variant="heading">Profile</Text>
        <View style={[a.gap_xs]}>
          <Text variant="label">Signed in as</Text>
          <Text variant="body" muted>
            {session?.user.email ?? 'unknown'}
          </Text>
        </View>
        <View style={a.flex_1} />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </SafeAreaView>
  )
}
