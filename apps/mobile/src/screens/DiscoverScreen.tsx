/**
 * Discover — find a language partner. Backed by the get_match_candidates RPC.
 */
import {type BottomTabScreenProps} from '@react-navigation/bottom-tabs'
import {type CompositeScreenProps} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import React from 'react'
import {ActivityIndicator, FlatList, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {type MatchCandidate} from '@lingoo/shared'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Text'
import {useMatchCandidates, useSayHi, useSkip} from '#/lib/queries'
import {type RootStackParamList, type TabParamList} from '#/navigation/types'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>

export function DiscoverScreen({navigation}: Props) {
  const t = useTheme()
  const {data, isLoading, isError, error} = useMatchCandidates()
  const sayHi = useSayHi()
  const skip = useSkip()

  async function onSayHi(c: MatchCandidate) {
    const conversationId = await sayHi.mutateAsync(c.profile.id)
    navigation.navigate('Conversation', {conversationId, partnerName: c.profile.displayName})
  }

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]} edges={['top']}>
      <View style={[a.px_lg, a.py_md]}>
        <Text variant="heading">Discover</Text>
        <Text variant="caption" muted>
          People whose languages complement yours
        </Text>
      </View>

      {isLoading ? (
        <View style={[a.flex_1, a.align_center, a.justify_center]}>
          <ActivityIndicator color={t.palette.primary} />
        </View>
      ) : isError ? (
        <View style={[a.flex_1, a.align_center, a.justify_center, a.p_xl]}>
          <Text variant="body" muted style={a.text_center}>
            Couldn't load people. {(error as Error)?.message}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={c => c.profile.id}
          contentContainerStyle={[a.px_lg, a.gap_md, a.py_md]}
          ListEmptyComponent={
            <View style={[a.align_center, a.justify_center, a.p_xl]}>
              <Text variant="body" muted style={a.text_center}>
                No one new right now. Check back soon!
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <MatchCard
              candidate={item}
              busy={sayHi.isPending || skip.isPending}
              onSayHi={() => onSayHi(item)}
              onSkip={() => skip.mutate(item.profile.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function MatchCard({
  candidate,
  busy,
  onSayHi,
  onSkip,
}: {
  candidate: MatchCandidate
  busy: boolean
  onSayHi: () => void
  onSkip: () => void
}) {
  const t = useTheme()
  const p = candidate.profile
  return (
    <View
      style={[
        a.p_lg,
        a.rounded_lg,
        a.gap_md,
        {backgroundColor: t.palette.surface, borderWidth: 1, borderColor: t.palette.border},
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Text variant="label">{p.displayName}</Text>
          {p.isOnline && (
            <View style={[a.rounded_full, {width: 8, height: 8, backgroundColor: t.palette.positive}]} />
          )}
        </View>
        <Text variant="caption" muted>
          {candidate.compatibilityScore}% match
        </Text>
      </View>
      <Text variant="caption" muted>
        Speaks {p.nativeLanguages.map(l => l.code).join(', ') || '—'} · learning{' '}
        {p.learningLanguages.map(l => l.code).join(', ') || '—'}
      </Text>
      <View style={[a.flex_row, a.gap_sm]}>
        <View style={a.flex_1}>
          <Button label="Say hi" variant="primary" disabled={busy} onPress={onSayHi} />
        </View>
        <View style={a.flex_1}>
          <Button label="Skip" variant="secondary" disabled={busy} onPress={onSkip} />
        </View>
      </View>
    </View>
  )
}
