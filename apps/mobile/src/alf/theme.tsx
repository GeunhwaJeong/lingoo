/**
 * Theme — semantic colors that flip between light and dark.
 *
 * Components never reference raw palette values for color; they pull from
 * `t.palette` (the active theme) via the useTheme() hook. That's what makes
 * dark mode a one-line switch.
 */
import React, {createContext, useContext, useMemo} from 'react'
import {useColorScheme} from 'react-native'

import {palette} from './tokens'

export type ThemeName = 'light' | 'dark'

export interface Theme {
  name: ThemeName
  palette: {
    /** App background. */
    bg: string
    /** Raised surfaces: cards, input fields. */
    surface: string
    /** Hairlines, dividers, input borders. */
    border: string
    /** Primary text. */
    text: string
    /** Secondary / muted text. */
    textMuted: string
    /** Brand / primary action. */
    primary: string
    /** Text/icon on top of `primary`. */
    onPrimary: string
    /** Positive (online dot, success). */
    positive: string
    /** Negative (errors, destructive). */
    negative: string
  }
}

const light: Theme = {
  name: 'light',
  palette: {
    bg: palette.white,
    surface: palette.gray_50,
    border: palette.gray_100,
    text: palette.gray_900,
    textMuted: palette.gray_500,
    primary: palette.blue_500,
    onPrimary: palette.white,
    positive: palette.green_500,
    negative: palette.red_500,
  },
}

const dark: Theme = {
  name: 'dark',
  palette: {
    bg: palette.gray_950,
    surface: palette.gray_900,
    border: palette.gray_800,
    text: palette.gray_50,
    textMuted: palette.gray_400,
    primary: palette.blue_500,
    onPrimary: palette.white,
    positive: palette.green_500,
    negative: palette.red_500,
  },
}

export const themes = {light, dark} as const

const ThemeContext = createContext<Theme>(light)

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? dark : light), [scheme])
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** Access the active theme. Convention: `const t = useTheme()`. */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}
