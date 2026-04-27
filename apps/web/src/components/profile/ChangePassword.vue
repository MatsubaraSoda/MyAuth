<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { t } = useI18n()
const router = useRouter()

const currentPasswordDraft = ref('')
const newPasswordDraft = ref('')
const confirmPasswordDraft = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const submitting = ref(false)

const SIGN_IN_SENSITIVE_REDIRECT_QUERY = {
  redirect: '/profile',
  tab: 'security',
} as const

function extractErrorPayload(err: unknown): {
  status?: number
  message: string
  code?: string
} {
  const raw = err as {
    status?: number
    message?: string
    body?: unknown
    data?: unknown
  }
  const candidates = [raw.body, raw.data].filter(Boolean)
  for (const blob of candidates) {
    if (blob && typeof blob === 'object' && 'code' in blob) {
      const code = (blob as { code?: unknown }).code
      if (typeof code === 'string')
        return { status: raw.status, message: raw.message ?? '', code }
    }
  }
  try {
    const parsed = JSON.parse(raw.message ?? '') as { code?: unknown }
    if (parsed && typeof parsed.code === 'string')
      return { status: raw.status, message: raw.message ?? '', code: parsed.code }
  } catch {
    /* empty */
  }
  const msg =
    typeof raw.message === 'string'
      ? raw.message
      : typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : ''
  return { status: raw.status, message: msg }
}

function requiresReauthentication(payload: {
  status?: number
  code?: string
  message: string
}): boolean {
  if (payload.status === 400)
    return false

  const code = payload.code ?? ''
  const upper = `${code} ${payload.message}`.toUpperCase()

  if (payload.status === 403 || payload.status === 401)
    return true

  return (
    code === 'SESSION_NOT_FRESH'
    || code === 'SESSION_EXPIRED'
    || upper.includes('SESSION_NOT_FRESH')
    || upper.includes('SESSION_EXPIRED')
  )
}

function mapApiError(payload: {
  status?: number
  code?: string
  message: string
}): string {
  const code = payload.code ?? ''
  switch (code) {
    case 'INVALID_PASSWORD':
      return t('auth.profile.security.err_change_password_invalid_current')
    case 'PASSWORD_TOO_SHORT':
      return t('auth.profile.security.err_change_password_too_short')
    case 'PASSWORD_TOO_LONG':
      return t('auth.profile.security.err_change_password_too_long')
    case 'CREDENTIAL_ACCOUNT_NOT_FOUND':
      return t('auth.profile.security.err_change_password_no_credential')
    default:
      break
  }
  if (
    typeof payload.message === 'string'
    && payload.message.trim().length > 0
    && payload.message !== '{}'
  ) {
    return payload.message
  }
  return t('auth.profile.security.msg_change_password_failed')
}

function navigateToSignInForSensitiveOp() {
  toast.info(t('auth.profile.security.msg_sensitive_session_reauth'))
  void router.push({
    path: '/auth/sign-in',
    query: { ...SIGN_IN_SENSITIVE_REDIRECT_QUERY },
  })
}

async function onSubmitChangePassword() {
  errorMessage.value = ''

  if (!currentPasswordDraft.value.trim()) {
    errorMessage.value = t(
      'auth.profile.security.err_change_password_current_required',
    )
    return
  }

  if (newPasswordDraft.value !== confirmPasswordDraft.value) {
    errorMessage.value = t('auth.profile.security.err_pwd_mismatch')
    return
  }

  if (
    newPasswordDraft.value === currentPasswordDraft.value
    && newPasswordDraft.value.length > 0
  ) {
    errorMessage.value = t(
      'auth.profile.security.err_change_password_same_as_old',
    )
    return
  }

  await authClient.changePassword(
    {
      currentPassword: currentPasswordDraft.value,
      newPassword: newPasswordDraft.value,
      revokeOtherSessions: true,
    },
    {
      onRequest: () => {
        submitting.value = true
      },
      onResponse: () => {
        submitting.value = false
      },
      onSuccess: () => {
        toast.success(t('auth.profile.security.msg_change_password_success'))
        currentPasswordDraft.value = ''
        newPasswordDraft.value = ''
        confirmPasswordDraft.value = ''
        showNewPassword.value = false
        showConfirmPassword.value = false
        errorMessage.value = ''
      },
      onError: (ctx) => {
        const payload = extractErrorPayload(ctx.error)
        if (requiresReauthentication(payload)) {
          navigateToSignInForSensitiveOp()
          return
        }
        errorMessage.value = mapApiError(payload)
      },
    },
  )
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <Label
          class="text-xs"
          for="security-current-password"
        >
          {{ t('auth.profile.security.label_current_password') }}
        </Label>
        <RouterLink
          to="/auth/forgot-password"
          class="shrink-0 cursor-pointer text-xs text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {{ t('auth.sign_in.link_forgot_pwd') }}
        </RouterLink>
      </div>
      <Input
        id="security-current-password"
        v-model="currentPasswordDraft"
        type="password"
        autocomplete="current-password"
        class="text-sm"
        :placeholder="t('auth.profile.security.ph_current_password')"
      />
    </div>

    <div class="space-y-2">
      <Label
        class="text-xs"
        for="security-new-password"
      >
        {{ t('auth.profile.security.label_new_password') }}
      </Label>
      <InputGroup>
        <InputGroupInput
          id="security-new-password"
          v-model="newPasswordDraft"
          class="text-sm"
          :type="showNewPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.profile.security.ph_new_password')"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            type="button"
            :aria-label="
              showNewPassword
                ? t('auth.profile.security.aria_toggle_password_hide')
                : t('auth.profile.security.aria_toggle_password')
            "
            class="cursor-pointer rounded-[calc(var(--radius)-5px)]"
            @click="showNewPassword = !showNewPassword"
          >
            <EyeOff
              v-if="showNewPassword"
              class="size-4"
            />
            <Eye
              v-else
              class="size-4"
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>

    <div class="space-y-2">
      <Label
        class="text-xs"
        for="security-confirm-password"
      >
        {{ t('auth.profile.security.label_confirm_password') }}
      </Label>
      <InputGroup>
        <InputGroupInput
          id="security-confirm-password"
          v-model="confirmPasswordDraft"
          class="text-sm"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.profile.security.ph_confirm_password')"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            type="button"
            :aria-label="
              showConfirmPassword
                ? t('auth.profile.security.aria_toggle_password_hide')
                : t('auth.profile.security.aria_toggle_password')
            "
            class="cursor-pointer rounded-[calc(var(--radius)-5px)]"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <EyeOff
              v-if="showConfirmPassword"
              class="size-4"
            />
            <Eye
              v-else
              class="size-4"
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>

    <p
      v-if="errorMessage"
      class="text-sm text-destructive"
    >
      {{ errorMessage }}
    </p>

    <div class="flex justify-start pt-1">
      <Button
        type="button"
        class="inline-flex h-auto min-h-0 cursor-pointer items-center px-4 py-2 text-xs leading-tight"
        :disabled="submitting"
        @click="onSubmitChangePassword"
      >
        <Loader2
          v-if="submitting"
          class="mr-1.5 size-3 shrink-0 animate-spin"
        />
        {{ t('auth.profile.security.btn_update_password') }}
      </Button>
    </div>
  </div>
</template>
