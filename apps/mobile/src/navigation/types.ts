import {type NavigatorScreenParams} from '@react-navigation/native'

export type TabParamList = {
  Discover: undefined
  Chats: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined
  Conversation: {conversationId: string; partnerName: string}
}
