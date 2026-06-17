/**
 * Root navigation.
 * - Signed out → Welcome screen.
 * - Signed in  → native stack: bottom tabs + pushable Conversation screen.
 */
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {ActivityIndicator, View} from 'react-native'

import {useTheme} from '#/alf'
import {useAuth} from '#/lib/auth'
import {type RootStackParamList, type TabParamList} from '#/navigation/types'
import {ChatsScreen} from '#/screens/ChatsScreen'
import {ConversationScreen} from '#/screens/ConversationScreen'
import {DiscoverScreen} from '#/screens/DiscoverScreen'
import {ProfileScreen} from '#/screens/ProfileScreen'
import {WelcomeScreen} from '#/screens/WelcomeScreen'

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

function MainTabs() {
  const t = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.palette.primary,
        tabBarInactiveTintColor: t.palette.textMuted,
        tabBarStyle: {backgroundColor: t.palette.bg, borderTopColor: t.palette.border},
      }}>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  const t = useTheme()
  const {session, initializing} = useAuth()

  if (initializing) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.palette.bg}}>
        <ActivityIndicator color={t.palette.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={t.name === 'dark' ? DarkTheme : DefaultTheme}>
      {session ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {backgroundColor: t.palette.bg},
            headerTintColor: t.palette.text,
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}} />
          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={({route}) => ({title: route.params.partnerName})}
          />
        </Stack.Navigator>
      ) : (
        <WelcomeScreen />
      )}
    </NavigationContainer>
  )
}
