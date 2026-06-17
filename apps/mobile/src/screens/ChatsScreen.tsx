/**
 * Chats — list of conversations, backed by the get_conversations RPC.
 */
import {type BottomTabScreenProps} from '@react-navigation/bottom-tabs'
import {type CompositeScreenProps} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import React from 'react'
import {ActivityIndicator, FlatList, Pressable, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {type Conversation} from '@lingoo/shared'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Text'
import {useConversations} from '#/lib/queries'
import {type RootStackParamList, type TabParamList} from '#/navigation/types'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Chats'>,
  NativeStackScreenProps<RootStackParamList>
>

export function ChatsScreen({navigation}: Props) {
  const t = useTheme()
  const {data, isLoading} = useConversations()

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]} edges={['top']}>
      <View style={[a.px_lg, a.py_md]}>
        <Text variant="heading">Chats</Text>
      </View>

      {isLoading ? (
        <View style={[a.flex_1, a.align_center, a.justify_center]}>
          <ActivityIndicator color={t.palette.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={c => c.id}
          contentContainerStyle={[a.py_sm]}
          ListEmptyComponent={
            <View style={[a.align_center, a.justify_center, a.p_xl, a.gap_sm]}>
              <Text variant="body" muted style={a.text_center}>
                No conversations yet.
              </Text>
              <Text variant="caption" muted style={a.text_center}>
                Say hi to someone in Discover to start practicing.
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <ConversationRow
              conversation={item}
              onPress={() => {
                const partner = item.participants[0]
                navigation.navigate('Conversation', {
                  conversationId: item.id,
                  partnerName: partner?.displayName ?? 'Chat',
                })
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function ConversationRow({conversation, onPress}: {conversation: Conversation; onPress: () => void}) {
  const t = useTheme()
  const partner = conversation.participants[0]
  const preview = conversation.lastMessage?.text || 'Say hi 👋'
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.px_lg,
        a.py_md,
        {backgroundColor: pressed ? t.palette.surface : 'transparent'},
      ]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          {width: 44, height: 44, backgroundColor: t.palette.surface},
        ]}>
        <Text variant="label">{(partner?.displayName ?? '?').slice(0, 1)}</Text>
      </View>
      <View style={[a.flex_1, a.gap_xs]}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <Text variant="label">{partner?.displayName ?? 'Unknown'}</Text>
          {conversation.unreadCount > 0 && (
            <View
              style={[
                a.rounded_full,
                a.align_center,
                a.justify_center,
                {minWidth: 20, height: 20, paddingHorizontal: 6, backgroundColor: t.palette.primary},
              ]}>
              <Text variant="caption" style={{color: t.palette.onPrimary}}>
                {conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text variant="caption" muted numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Pressable>
  )
}
