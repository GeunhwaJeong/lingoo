/**
 * @lingoo/shared — domain types shared by the mobile app and the backend.
 *
 * Keeping these in one place means: if the shape of a Message (or anything the
 * API returns) changes, BOTH the app and any backend code that imports this
 * package fail to typecheck until they agree. That is the whole point of the
 * monorepo.
 *
 * Data model adapted from a battle-tested chat schema (conversations /
 * participants / messages / reactions) plus language-exchange specifics
 * (language prefs + the `corrections` feature that is our core differentiator).
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** BCP-47-ish short code, e.g. "en", "ko", "ja", "es". */
export type LanguageCode = string

/** Self-reported proficiency, CEFR-inspired but simplified for UX. */
export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'native'

export interface Language {
  code: LanguageCode
  /** English name, e.g. "Korean". */
  name: string
  /** Endonym, e.g. "한국어". */
  nativeName: string
  /** Right-to-left script (Arabic, Hebrew, …). */
  isRtl: boolean
}

// ---------------------------------------------------------------------------
// User & profile
// ---------------------------------------------------------------------------

/** A language the user speaks natively. */
export interface NativeLanguage {
  code: LanguageCode
}

/** A language the user is learning, with their level. */
export interface LearningLanguage {
  code: LanguageCode
  level: ProficiencyLevel
}

export interface Profile {
  /** Matches Supabase auth.users.id (uuid). */
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  /** ISO 3166-1 alpha-2, e.g. "KR". */
  countryCode: string | null
  nativeLanguages: NativeLanguage[]
  learningLanguages: LearningLanguage[]
  /** Free-text interests / topics for matching. */
  interests: string[]
  createdAt: string
  /** Coarse online signal; never expose exact last-seen to others. */
  isOnline: boolean
}

/** Trimmed profile used in lists, match cards, message headers. */
export interface ProfileSummary {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  countryCode: string | null
  nativeLanguages: NativeLanguage[]
  learningLanguages: LearningLanguage[]
  isOnline: boolean
}

// ---------------------------------------------------------------------------
// Matching (the "discover people" surface)
// ---------------------------------------------------------------------------

export type MatchDecision = 'like' | 'pass'

export interface MatchCandidate {
  profile: ProfileSummary
  /** 0–100, how well their languages complement yours. */
  compatibilityScore: number
}

// ---------------------------------------------------------------------------
// Conversations & messages
// ---------------------------------------------------------------------------

export type MessageType = 'text' | 'image' | 'audio' | 'call_audio' | 'call_video'

export type CallStatus = 'completed' | 'missed' | 'declined'

export interface Conversation {
  id: string
  participants: ProfileSummary[]
  lastMessage: Message | null
  /** Unread count for the current viewer. */
  unreadCount: number
  updatedAt: string
}

export interface MessageReaction {
  userId: string
  emoji: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  text: string
  /** Present for image/audio messages. */
  mediaUrl: string | null
  replyToMessageId: string | null
  reactions: MessageReaction[]
  /** Corrections attached to this message (HelloTalk-style). */
  corrections: Correction[]
  callStatus: CallStatus | null
  /** Seconds, for call messages. */
  callDuration: number | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Corrections — our core differentiator
// ---------------------------------------------------------------------------

/**
 * A correction proposed on someone's message. `correctedText` is the fixed
 * version; `note` explains *why*. Source can be a human partner or our AI
 * tutor, so the learner still gets feedback even with no partner online.
 */
export interface Correction {
  id: string
  messageId: string
  authorId: string
  source: 'partner' | 'ai'
  originalText: string
  correctedText: string
  note: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Reporting / safety
// ---------------------------------------------------------------------------

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake_account' | 'other'

export interface UserReport {
  reportedUserId: string
  reason: ReportReason
  details: string | null
}

// ---------------------------------------------------------------------------
// API envelopes
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[]
  /** Opaque cursor for the next page, or null when exhausted. */
  nextCursor: string | null
}
