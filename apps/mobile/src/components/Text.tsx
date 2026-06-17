/**
 * Themed Text — the only text primitive the app should use.
 * Defaults to the theme's text color; `muted` for secondary copy.
 */
import React from 'react'
import {Text as RNText, type TextProps} from 'react-native'

import {atoms as a, useTheme} from '#/alf'

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption'

const variantStyle = {
  title: [a.text_xxl, a.font_bold],
  heading: [a.text_xl, a.font_bold],
  body: [a.text_md, a.font_normal],
  label: [a.text_sm, a.font_semibold],
  caption: [a.text_xs, a.font_normal],
} as const

export function Text({
  variant = 'body',
  muted = false,
  style,
  ...rest
}: TextProps & {variant?: Variant; muted?: boolean}) {
  const t = useTheme()
  return (
    <RNText
      style={[
        ...variantStyle[variant],
        {color: muted ? t.palette.textMuted : t.palette.text},
        style,
      ]}
      {...rest}
    />
  )
}
