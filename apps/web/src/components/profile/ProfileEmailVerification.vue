<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2 } from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  email?: string | null
  verified?: boolean
}>()

const emit = defineEmits<{
  (e: 'sent'): void
  (e: 'error', message: string): void
}>()

const { t } = useI18n()

const emailVerifyState = ref<'idle' | 'sending' | 'cooldown' | 'error'>('idle')
const cooldown = ref(0)
const cooldownEndTime = ref(0)
const isSuccessHintVisible = ref(false)
const errorMessage = ref('')
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

const isVerifying = computed(() => emailVerifyState.value === 'sending')
const isCooldown = computed(() => emailVerifyState.value === 'cooldown')
const isError = computed(() => emailVerifyState.value === 'error')
const isVerified = computed(() => Boolean(props.verified))
const hasEmail = computed(() => Boolean(props.email))
const canSendVerify = computed(
  () => !isVerified.value && emailVerifyState.value === 'idle' && hasEmail.value,
)
const resendButtonText = computed(() =>
  t('auth.profile.btn_resend_verify_countdown', {
    seconds: cooldown.value,
  }),
)

function clearCountdownTimer() {
  if (!countdownTimer.value) return
  clearInterval(countdownTimer.value)
  countdownTimer.value = null
}

function resetToIdle() {
  clearCountdownTimer()
  cooldown.value = 0
  cooldownEndTime.value = 0
  isSuccessHintVisible.value = false
  emailVerifyState.value = 'idle'
}

function updateCooldownFromEndTime() {
  cooldown.value = Math.max(
    0,
    Math.ceil((cooldownEndTime.value - Date.now()) / 1000),
  )

  if (cooldown.value <= 0) {
    resetToIdle()
  }
}

function startCooldown(durationMs = 60_000) {
  clearCountdownTimer()
  cooldownEndTime.value = Date.now() + durationMs
  emailVerifyState.value = 'cooldown'
  isSuccessHintVisible.value = true
  errorMessage.value = ''
  updateCooldownFromEndTime()

  countdownTimer.value = setInterval(() => {
    updateCooldownFromEndTime()
  }, 1_000)
}

function extractRetryAfterSeconds(error: unknown): number | null {
  if (!(error instanceof Error)) return null
  const statusMatch = error.message.match(/\b429\b/)
  const retryAfterMatch = error.message.match(/retry[-_\s]?after[:=\s]+(\d+)/i)
  if (statusMatch && retryAfterMatch?.[1]) {
    return Number.parseInt(retryAfterMatch[1], 10)
  }
  return null
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    /\b429\b/.test(error.message) ||
    /too many requests/i.test(error.message)
  )
}

async function handleSendVerifyEmail() {
  if (!hasEmail.value) return
  if (isVerified.value || (!canSendVerify.value && !isError.value)) return

  errorMessage.value = ''
  isSuccessHintVisible.value = false
  emailVerifyState.value = 'sending'

  try {
    await authClient.sendVerificationEmail({
      email: props.email ?? '',
      callbackURL: `${window.location.origin}/auth/verify-success`,
    })
    emit('sent')
    startCooldown()
  } catch (error) {
    if (isRateLimitError(error)) {
      const retryAfterSeconds = extractRetryAfterSeconds(error) ?? 60
      startCooldown(retryAfterSeconds * 1_000)
      return
    }

    emailVerifyState.value = 'error'
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t('auth.profile.msg_verify_email_error')
    emit('error', errorMessage.value)
  }
}

onBeforeUnmount(() => {
  clearCountdownTimer()
})
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.section_email_verification') }}
    </h2>
    <Card>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label
            class="flex items-center justify-between gap-3 text-xs"
            for="profile-email"
          >
            <span>{{ t('auth.profile.label_email') }}</span>
            <span
              class="inline-flex cursor-default items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
              :class="
                isVerified
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              "
            >
              <span
                class="size-1.5 rounded-full"
                :class="isVerified ? 'bg-primary' : 'bg-muted-foreground'"
              />
              {{
                isVerified
                  ? t('auth.profile.status_verified')
                  : t('auth.profile.status_unverified')
              }}
            </span>
          </Label>
          <Input
            id="profile-email"
            type="email"
            :model-value="email ?? ''"
            disabled
            readonly
          />
        </div>
        <div
          v-if="!isVerified"
          class="flex justify-start"
        >
          <Button
            type="button"
            class="h-auto min-h-0 px-2 py-2 text-xs leading-tight"
            :disabled="isVerifying || isCooldown || (!canSendVerify && !isError) || !hasEmail"
            @click="handleSendVerifyEmail"
          >
            <Loader2
              v-if="isVerifying"
              class="mr-1 size-3 shrink-0 animate-spin"
            />
            {{
              isVerifying
                ? t('auth.profile.btn_send_verify_loading')
                : isCooldown
                  ? resendButtonText
                  : isError
                    ? t('auth.profile.btn_retry_verify')
                    : t('auth.profile.btn_send_verify')
            }}
          </Button>
        </div>
        <Transition
          enter-active-class="duration-200 ease-out transition-all"
          enter-from-class="translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="duration-200 ease-out transition-all"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-1 opacity-0"
        >
          <p
            v-if="isSuccessHintVisible"
            class="text-xs text-primary"
            aria-live="polite"
          >
            {{ t('auth.profile.msg_verify_email_sent') }}
          </p>
        </Transition>
        <Transition
          enter-active-class="duration-200 ease-out transition-all"
          enter-from-class="translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="duration-200 ease-out transition-all"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-1 opacity-0"
        >
          <p
            v-if="isError && errorMessage"
            class="text-xs text-destructive"
            aria-live="polite"
          >
            {{ errorMessage }}
          </p>
        </Transition>
      </CardContent>
    </Card>
  </section>
</template>
