/**
 * Conversation — message thread with:
 *  - live updates (Supabase Realtime on messages + corrections)
 *  - send box
 *  - corrections: long-press a partner's message to suggest a fix (our feature)
 */
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'
import React, {useEffect, useRef, useState} from 'react'
import {FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {type Message} from '@lingoo/shared'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Text'
import {useAuth} from '#/lib/auth'
import {markConversationRead, useAddCorrection, useMessages, useSendMessage} from '#/lib/queries'
import {supabase} from '#/lib/supabase'
import {type RootStackParamList} from '#/navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>

export function ConversationScreen({route}: Props) {
  const {conversationId} = route.params
  const t = useTheme()
  const qc = useQueryClient()
  const {session} = useAuth()
  const myId = session?.user.id

  const {data: messages} = useMessages(conversationId)
  const sendMessage = useSendMessage(conversationId)
  const addCorrection = useAddCorrection(conversationId)

  const [draft, setDraft] = useState('')
  const [correcting, setCorrecting] = useState<Message | null>(null)
  const listRef = useRef<FlatList<Message>>(null)

  // Mark read on open.
  useEffect(() => {
    void markConversationRead(conversationId).then(() =>
      qc.invalidateQueries({queryKey: ['conversations']}),
    )
  }, [conversationId, qc])

  // Live updates: refetch on new messages or corrections in this conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}`},
        () => qc.invalidateQueries({queryKey: ['messages', conversationId]}),
      )
      .on(
        'postgres_changes',
        {event: 'INSERT', schema: 'public', table: 'corrections'},
        () => qc.invalidateQueries({queryKey: ['messages', conversationId]}),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, qc])

  async function onSend() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await sendMessage.mutateAsync(text)
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}))
  }

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]} edges={['bottom']}>
      <KeyboardAvoidingView style={a.flex_1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[a.p_lg, a.gap_md]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
          renderItem={({item}) => (
            <MessageBubble
              message={item}
              mine={item.senderId === myId}
              onLongPress={() => {
                if (item.senderId !== myId) setCorrecting(item)
              }}
            />
          )}
        />

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_lg,
            a.py_md,
            {borderTopWidth: 1, borderTopColor: t.palette.border},
          ]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={t.palette.textMuted}
            multiline
            style={[
              a.flex_1,
              a.px_lg,
              a.py_sm,
              a.rounded_full,
              a.text_md,
              {
                backgroundColor: t.palette.surface,
                borderWidth: 1,
                borderColor: t.palette.border,
                color: t.palette.text,
                maxHeight: 120,
              },
            ]}
          />
          <Button label="Send" onPress={onSend} disabled={!draft.trim() || sendMessage.isPending} />
        </View>
      </KeyboardAvoidingView>

      <CorrectionModal
        message={correcting}
        onClose={() => setCorrecting(null)}
        onSubmit={async (correctedText, note) => {
          if (!correcting) return
          await addCorrection.mutateAsync({
            messageId: correcting.id,
            originalText: correcting.text,
            correctedText,
            note,
          })
          setCorrecting(null)
        }}
      />
    </SafeAreaView>
  )
}

function MessageBubble({
  message,
  mine,
  onLongPress,
}: {
  message: Message
  mine: boolean
  onLongPress: () => void
}) {
  const t = useTheme()
  return (
    <Pressable
      onLongPress={onLongPress}
      style={[mine ? a.self_center : undefined, {alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%'}]}>
      <View
        style={[
          a.px_lg,
          a.py_sm,
          a.rounded_lg,
          {backgroundColor: mine ? t.palette.primary : t.palette.surface},
        ]}>
        <Text variant="body" style={{color: mine ? t.palette.onPrimary : t.palette.text}}>
          {message.text}
        </Text>
      </View>

      {/* Corrections attached to this message */}
      {message.corrections.map(c => (
        <View
          key={c.id}
          style={[
            a.mt_sm,
            a.p_md,
            a.rounded_md,
            a.gap_xs,
            {backgroundColor: t.palette.surface, borderLeftWidth: 3, borderLeftColor: t.palette.positive},
          ]}>
          <Text variant="caption" style={{color: t.palette.positive}}>
            ✎ Correction{c.source === 'ai' ? ' (AI)' : ''}
          </Text>
          <Text variant="body">{c.correctedText}</Text>
          {c.note ? (
            <Text variant="caption" muted>
              {c.note}
            </Text>
          ) : null}
        </View>
      ))}

      {!mine && message.corrections.length === 0 ? (
        <Text variant="caption" muted style={a.mt_sm}>
          Long-press to suggest a correction
        </Text>
      ) : null}
    </Pressable>
  )
}

function CorrectionModal({
  message,
  onClose,
  onSubmit,
}: {
  message: Message | null
  onClose: () => void
  onSubmit: (correctedText: string, note: string) => void
}) {
  const t = useTheme()
  const [corrected, setCorrected] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    setCorrected(message?.text ?? '')
    setNote('')
  }, [message])

  return (
    <Modal visible={!!message} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[a.flex_1, a.justify_end, {backgroundColor: 'rgba(0,0,0,0.4)'}]} onPress={onClose}>
        <Pressable
          style={[
            a.p_xl,
            a.gap_md,
            {
              backgroundColor: t.palette.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}
          onPress={e => e.stopPropagation()}>
          <Text variant="heading">Suggest a correction</Text>
          <Text variant="caption" muted>
            Original: “{message?.text}”
          </Text>

          <Text variant="label">Corrected</Text>
          <TextInput
            value={corrected}
            onChangeText={setCorrected}
            multiline
            style={[
              a.px_lg,
              a.py_md,
              a.rounded_md,
              a.text_md,
              {backgroundColor: t.palette.surface, borderWidth: 1, borderColor: t.palette.border, color: t.palette.text},
            ]}
          />

          <Text variant="label">Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Why? e.g. past tense here"
            placeholderTextColor={t.palette.textMuted}
            style={[
              a.px_lg,
              a.py_md,
              a.rounded_md,
              a.text_md,
              {backgroundColor: t.palette.surface, borderWidth: 1, borderColor: t.palette.border, color: t.palette.text},
            ]}
          />

          <Button label="Send correction" onPress={() => onSubmit(corrected.trim(), note.trim())} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}
