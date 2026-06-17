/**
 * Button — primary / secondary / ghost variants, themed and pressable.
 */
import React from 'react'
import {ActivityIndicator, Pressable, type PressableProps, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Text'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string
  variant?: Variant
  loading?: boolean
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const t = useTheme()
  const isDisabled = disabled || loading

  const bg =
    variant === 'primary'
      ? t.palette.primary
      : variant === 'secondary'
        ? t.palette.surface
        : 'transparent'
  const fg = variant === 'primary' ? t.palette.onPrimary : t.palette.text
  const border = variant === 'secondary' ? t.palette.border : 'transparent'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({pressed}) => [
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        a.px_lg,
        a.py_md,
        a.rounded_md,
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Text variant="label" style={{color: fg}}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
