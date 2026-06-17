/**
 * Onboarding — shown once, right after sign-up, for users who haven't set up
 * their profile. Collects the inputs our matching actually uses: native
 * language(s), learning language(s) + level, and interests.
 *
 * Deliberately NOT Meeff-style: no age/gender/distance/looks-ranking. We ask
 * what's needed to pair learners well, and keep it short.
 */
import React, {useMemo, useState} from 'react'
import {ScrollView, TextInput, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {type ProficiencyLevel} from '@lingoo/shared'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Chip} from '#/components/Chip'
import {Text} from '#/components/Text'
import {useLanguages, useSaveOnboarding} from '#/lib/queries'

const LEARNING_LEVELS: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced']

const INTERESTS: {value: string; label: string}[] = [
  {value: 'travel', label: '✈️ Travel'},
  {value: 'music', label: '🎵 Music'},
  {value: 'food', label: '🍜 Food'},
  {value: 'movies', label: '🎬 Movies'},
  {value: 'gaming', label: '🎮 Gaming'},
  {value: 'sports', label: '⚽ Sports'},
  {value: 'reading', label: '📚 Reading'},
  {value: 'art', label: '🎨 Art'},
  {value: 'photography', label: '📷 Photography'},
  {value: 'tech', label: '💻 Tech'},
  {value: 'fitness', label: '🏋️ Fitness'},
  {value: 'cooking', label: '🍳 Cooking'},
  {value: 'kpop', label: '🎤 K-pop'},
  {value: 'anime', label: '🌸 Anime'},
  {value: 'coffee', label: '☕ Coffee'},
  {value: 'nature', label: '🌿 Nature'},
]

type LearningSel = {code: string; level: ProficiencyLevel}

export function OnboardingScreen() {
  const t = useTheme()
  const {data: languages} = useLanguages()
  const save = useSaveOnboarding()

  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [native, setNative] = useState<string[]>([])
  const [learning, setLearning] = useState<LearningSel[]>([])
  const [interests, setInterests] = useState<string[]>([])

  const canContinue = useMemo(() => {
    if (step === 0) return displayName.trim().length > 0
    if (step === 1) return native.length > 0 && learning.length > 0
    return true
  }, [step, displayName, native, learning])

  function toggleNative(code: string) {
    setNative(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]))
  }
  function toggleLearning(code: string) {
    setLearning(prev =>
      prev.some(l => l.code === code)
        ? prev.filter(l => l.code !== code)
        : [...prev, {code, level: 'beginner'}],
    )
  }
  function setLevel(code: string, level: ProficiencyLevel) {
    setLearning(prev => prev.map(l => (l.code === code ? {...l, level} : l)))
  }
  function toggleInterest(value: string) {
    setInterests(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  async function onPrimary() {
    if (step < 2) {
      setStep(step + 1)
      return
    }
    await save.mutateAsync({
      displayName: displayName.trim(),
      bio: bio.trim(),
      countryCode: '',
      interests,
      nativeLanguages: native,
      learningLanguages: learning,
    })
    // myProfile is invalidated on success → RootNavigator routes into the app.
  }

  const langName = (code: string) => languages?.find(l => l.code === code)?.name ?? code

  return (
    <SafeAreaView style={[a.flex_1, {backgroundColor: t.palette.bg}]}>
      {/* progress dots */}
      <View style={[a.flex_row, a.gap_sm, a.px_xl, a.py_md]}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              a.flex_1,
              a.rounded_full,
              {height: 4, backgroundColor: i <= step ? t.palette.primary : t.palette.border},
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={[a.px_xl, a.py_md, a.gap_lg]} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={a.gap_lg}>
            <View style={a.gap_xs}>
              <Text variant="title">Welcome 👋</Text>
              <Text variant="body" muted>
                Let's set up your profile. First, who are you?
              </Text>
            </View>
            <Field label="Display name">
              <Input value={displayName} onChangeText={setDisplayName} placeholder="e.g. Jung" />
            </Field>
            <Field label="Bio (optional)">
              <Input value={bio} onChangeText={setBio} placeholder="A line about you" multiline />
            </Field>
          </View>
        )}

        {step === 1 && (
          <View style={a.gap_xl}>
            <View style={a.gap_xs}>
              <Text variant="title">Languages</Text>
              <Text variant="body" muted>
                This is how we match you with the right partners.
              </Text>
            </View>

            <View style={a.gap_md}>
              <Text variant="label">I speak natively</Text>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                {languages?.map(l => (
                  <Chip
                    key={l.code}
                    label={l.name}
                    selected={native.includes(l.code)}
                    onPress={() => toggleNative(l.code)}
                  />
                ))}
              </View>
            </View>

            <View style={a.gap_md}>
              <Text variant="label">I'm learning</Text>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                {languages?.map(l => (
                  <Chip
                    key={l.code}
                    label={l.name}
                    selected={learning.some(x => x.code === l.code)}
                    onPress={() => toggleLearning(l.code)}
                  />
                ))}
              </View>
            </View>

            {/* level per learning language */}
            {learning.length > 0 && (
              <View style={a.gap_md}>
                <Text variant="label">My level</Text>
                {learning.map(l => (
                  <View key={l.code} style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
                    <Text variant="body">{langName(l.code)}</Text>
                    <View style={[a.flex_row, a.gap_xs]}>
                      {LEARNING_LEVELS.map(lvl => (
                        <Chip
                          key={lvl}
                          label={lvl}
                          selected={l.level === lvl}
                          onPress={() => setLevel(l.code, lvl)}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={a.gap_lg}>
            <View style={a.gap_xs}>
              <Text variant="title">Interests</Text>
              <Text variant="body" muted>
                Pick a few — we use these to find people you'll click with.
              </Text>
            </View>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              {INTERESTS.map(i => (
                <Chip
                  key={i.value}
                  label={i.label}
                  selected={interests.includes(i.value)}
                  onPress={() => toggleInterest(i.value)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[a.px_xl, a.py_md, a.flex_row, a.gap_sm, {borderTopWidth: 1, borderTopColor: t.palette.border}]}>
        {step > 0 && (
          <Button label="Back" variant="secondary" onPress={() => setStep(step - 1)} />
        )}
        <View style={a.flex_1}>
          <Button
            label={step < 2 ? 'Continue' : 'Finish'}
            onPress={onPrimary}
            disabled={!canContinue}
            loading={save.isPending}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View style={a.gap_sm}>
      <Text variant="label">{label}</Text>
      {children}
    </View>
  )
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme()
  return (
    <TextInput
      placeholderTextColor={t.palette.textMuted}
      {...props}
      style={[
        a.px_lg,
        a.py_md,
        a.rounded_md,
        a.text_md,
        {
          backgroundColor: t.palette.surface,
          borderWidth: 1,
          borderColor: t.palette.border,
          color: t.palette.text,
          minHeight: props.multiline ? 72 : undefined,
        },
      ]}
    />
  )
}
