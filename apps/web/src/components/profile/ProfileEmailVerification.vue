<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  email?: string | null
}>()

const { t } = useI18n()

const emailVerifyState = ref<'unverified' | 'sending' | 'cooldown' | 'verified'>(
  'unverified',
)
const cooldown = ref(0)
const cooldownEndTime = ref(0)
const isSuccessHintVisible = ref(false)
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
const sendingTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const isVerifying = computed(() => emailVerifyState.value === 'sending')
const isCooldown = computed(() => emailVerifyState.value === 'cooldown')
const isVerified = computed(() => emailVerifyState.value === 'verified')
const canSendVerify = computed(
  () => emailVerifyState.value === 'unverified' && Boolean(props.email),
)
const resendButtonText = computed(() =>
  t('auth.profile.btn_resend_verify_countdown', {
    seconds: cooldown.value,
  }),
)

function clearSendingTimer() {
  if (!sendingTimer.value) return
  clearTimeout(sendingTimer.value)
  sendingTimer.value = null
}

function clearCountdownTimer() {
  if (!countdownTimer.value) return
  clearInterval(countdownTimer.value)
  countdownTimer.value = null
}

function resetToUnverified() {
  clearCountdownTimer()
  cooldown.value = 0
  cooldownEndTime.value = 0
  isSuccessHintVisible.value = false
  emailVerifyState.value = 'unverified'
}

function updateCooldownFromEndTime() {
  const remainingMs = Math.max(0, cooldownEndTime.value - Date.now())
  cooldown.value = Math.ceil(remainingMs / 1000)

  if (remainingMs <= 0) {
    resetToUnverified()
  }
}

function startCooldown() {
  clearCountdownTimer()
  cooldownEndTime.value = Date.now() + 60_000
  emailVerifyState.value = 'cooldown'
  isSuccessHintVisible.value = true
  updateCooldownFromEndTime()

  countdownTimer.value = setInterval(() => {
    updateCooldownFromEndTime()
  }, 250)
}

function handleSendVerifyEmail() {
  if (!canSendVerify.value) return

  clearSendingTimer()
  emailVerifyState.value = 'sending'

  sendingTimer.value = setTimeout(() => {
    sendingTimer.value = null
    startCooldown()
  }, 1_500)
}

function handleBadgeAltClick() {
  clearSendingTimer()
  clearCountdownTimer()
  cooldown.value = 0
  cooldownEndTime.value = 0
  isSuccessHintVisible.value = false
  emailVerifyState.value = 'verified'
}

onBeforeUnmount(() => {
  clearSendingTimer()
  clearCountdownTimer()
})
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.section_change_email') }}
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
              @click.alt.exact="handleBadgeAltClick"
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
            :disabled="isVerifying || isCooldown || !canSendVerify"
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
          >
            {{ t('auth.profile.msg_verify_email_sent') }}
          </p>
        </Transition>
      </CardContent>
    </Card>
  </section>
</template>
