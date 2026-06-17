/**
 * Profile — current user's profile (from useMyProfile) + sign out.
 */
import React from 'react'
import {ScrollView, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Chip} from '#/components/Chip'
import {Text} from '#/components/Text'
import {useAuth} from '#/lib/auth'
import {useLanguages, useMyProfile} from '#/lib/queries'

export function ProfileScreen() {
  const t = useTheme()
  const {session, signOut} = useAuth()
  const {data: profile} = useMyProfile()
  const {data: languages} = useLanguages()

  const langName = (code: string) => languages?.find(l => l.code === code)?.name ?? code

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]} edges={['top']}>
      <ScrollView contentContainerStyle={[a.p_xl, a.gap_xl]}>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.rounded_full,
              {width: 64, height: 64, backgroundColor: t.palette.surface},
            ]}>
            <Text variant="title">{(profile?.displayName ?? '?').slice(0, 1)}</Text>
          </View>
          <View style={a.gap_xs}>
            <Text variant="heading">{profile?.displayName ?? '…'}</Text>
            <Text variant="caption" muted>
              {session?.user.email}
            </Text>
          </View>
        </View>

        {profile?.bio ? <Text variant="body">{profile.bio}</Text> : null}

        <Section title="Speaks natively">
          <ChipRow items={profile?.nativeLanguages.map(l => langName(l.code)) ?? []} />
        </Section>

        <Section title="Learning">
          <ChipRow items={profile?.learningLanguages.map(l => `${langName(l.code)} · ${l.level}`) ?? []} />
        </Section>

        <Section title="Interests">
          <ChipRow items={profile?.interests ?? []} />
        </Section>

        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={a.gap_sm}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  )
}

function ChipRow({items}: {items: string[]}) {
  if (items.length === 0) return <Text variant="caption" muted>—</Text>
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
      {items.map(i => (
        <Chip key={i} label={i} selected={false} onPress={() => {}} />
      ))}
    </View>
  )
}
