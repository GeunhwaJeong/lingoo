/**
 * Data layer — all Supabase reads/writes wrapped in TanStack Query hooks.
 * Screens import these and never touch the supabase client directly.
 */
import {
  type Conversation,
  type Correction,
  type MatchCandidate,
  type Message,
  type ProfileSummary,
} from '@lingoo/shared'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {supabase} from '#/lib/supabase'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function currentUserId(): Promise<string> {
  const {data} = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

/** Row shape returned by get_match_candidates(). */
interface CandidateRow {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  country_code: string | null
  is_online: boolean
  native_languages: {code: string}[]
  learning_languages: {code: string; level: string}[]
  compatibility_score: number
}

function rowToCandidate(r: CandidateRow): MatchCandidate {
  return {
    compatibilityScore: r.compatibility_score,
    profile: {
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      countryCode: r.country_code,
      isOnline: r.is_online,
      nativeLanguages: r.native_languages ?? [],
      learningLanguages: (r.learning_languages ?? []) as ProfileSummary['learningLanguages'],
    },
  }
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export function useMatchCandidates() {
  return useQuery({
    queryKey: ['matchCandidates'],
    queryFn: async (): Promise<MatchCandidate[]> => {
      const {data, error} = await supabase.rpc('get_match_candidates', {limit_count: 30})
      if (error) throw error
      return (data as CandidateRow[]).map(rowToCandidate)
    },
  })
}

/** "Say hi" — like + get-or-create a conversation. Returns conversation id. */
export function useSayHi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (targetId: string): Promise<string> => {
      const {data, error} = await supabase.rpc('start_conversation', {other_user: targetId})
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['matchCandidates']})
      qc.invalidateQueries({queryKey: ['conversations']})
    },
  })
}

/** "Skip" — record a pass so they don't show up again. */
export function useSkip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (targetId: string) => {
      const me = await currentUserId()
      const {error} = await supabase
        .from('match_decisions')
        .upsert({actor_id: me, target_id: targetId, decision: 'pass'})
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: ['matchCandidates']}),
  })
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

interface ConversationRow {
  id: string
  updated_at: string
  partner: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    country_code: string | null
    is_online: boolean
  } | null
  last_message: {id: string; text: string; type: string; sender_id: string; created_at: string} | null
  unread_count: number
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const {data, error} = await supabase.rpc('get_conversations')
      if (error) throw error
      return (data as ConversationRow[]).map(r => ({
        id: r.id,
        updatedAt: r.updated_at,
        unreadCount: r.unread_count,
        participants: r.partner
          ? [
              {
                id: r.partner.id,
                username: r.partner.username,
                displayName: r.partner.display_name,
                avatarUrl: r.partner.avatar_url,
                countryCode: r.partner.country_code,
                isOnline: r.partner.is_online,
                nativeLanguages: [],
                learningLanguages: [],
              },
            ]
          : [],
        lastMessage: r.last_message
          ? ({
              id: r.last_message.id,
              conversationId: r.id,
              senderId: r.last_message.sender_id,
              type: r.last_message.type as Message['type'],
              text: r.last_message.text,
              mediaUrl: null,
              replyToMessageId: null,
              reactions: [],
              corrections: [],
              callStatus: null,
              callDuration: null,
              createdAt: r.last_message.created_at,
            } satisfies Message)
          : null,
      }))
    },
  })
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  type: Message['type']
  text: string
  media_url: string | null
  reply_to_message_id: string | null
  call_status: Message['callStatus']
  call_duration: number | null
  created_at: string
  corrections: {
    id: string
    message_id: string
    author_id: string
    source: 'partner' | 'ai'
    original_text: string
    corrected_text: string
    note: string | null
    created_at: string
  }[]
}

function rowToMessage(r: MessageRow): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    type: r.type,
    text: r.text,
    mediaUrl: r.media_url,
    replyToMessageId: r.reply_to_message_id,
    reactions: [],
    corrections: (r.corrections ?? []).map(
      (c): Correction => ({
        id: c.id,
        messageId: c.message_id,
        authorId: c.author_id,
        source: c.source,
        originalText: c.original_text,
        correctedText: c.corrected_text,
        note: c.note,
        createdAt: c.created_at,
      }),
    ),
    callStatus: r.call_status,
    callDuration: r.call_duration,
    createdAt: r.created_at,
  }
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      const {data, error} = await supabase
        .from('messages')
        .select('*, corrections(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', {ascending: true})
      if (error) throw error
      return (data as MessageRow[]).map(rowToMessage)
    },
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      const me = await currentUserId()
      const {error} = await supabase
        .from('messages')
        .insert({conversation_id: conversationId, sender_id: me, text, type: 'text'})
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['messages', conversationId]})
      qc.invalidateQueries({queryKey: ['conversations']})
    },
  })
}

/** Attach a correction to a partner's message (our differentiator). */
export function useAddCorrection(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {messageId: string; originalText: string; correctedText: string; note?: string}) => {
      const me = await currentUserId()
      const {error} = await supabase.from('corrections').insert({
        message_id: input.messageId,
        author_id: me,
        source: 'partner',
        original_text: input.originalText,
        corrected_text: input.correctedText,
        note: input.note ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({queryKey: ['messages', conversationId]}),
  })
}

/** Mark the conversation read up to now. */
export async function markConversationRead(conversationId: string) {
  const me = await currentUserId()
  await supabase
    .from('conversation_participants')
    .update({last_read_at: new Date().toISOString()})
    .eq('conversation_id', conversationId)
    .eq('user_id', me)
}
