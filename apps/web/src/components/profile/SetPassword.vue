<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

const { t } = useI18n()

const emit = defineEmits<{
  success: []
}>()

const setPasswordDraft = ref('')
const confirmSetPasswordDraft = ref('')
const showSetPasswordFields = ref(false)
const errorMessage = ref('')
const submitting = ref(false)

const SET_PASSWORD_API_CONFLICT_EN =
  'User already has a password. Please use change-password API.'

function mapApiError(raw: string): string {
  if (raw === SET_PASSWORD_API_CONFLICT_EN) {
    return t('auth.profile.security.err_already_has_password')
  }
  return raw
}

async function onSubmit() {
  errorMessage.value = ''
  if (setPasswordDraft.value !== confirmSetPasswordDraft.value) {
    errorMessage.value = t('auth.profile.security.err_pwd_mismatch')
    return
  }

  submitting.value = true
  try {
    const res = await fetch(
      `${window.location.origin}/api/account/set-password`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: setPasswordDraft.value,
          confirmPassword: confirmSetPasswordDraft.value,
        }),
      },
    )

    let payload: { error?: string; ok?: boolean } = {}
    try {
      const text = await res.text()
      if (text) {
        payload = JSON.parse(text) as typeof payload
      }
    } catch {
      /* empty */
    }

    if (!res.ok) {
      const raw =
        typeof payload.error === 'string' && payload.error
          ? payload.error
          : t('auth.profile.security.msg_set_password_failed')
      errorMessage.value = mapApiError(raw)
      return
    }

    setPasswordDraft.value = ''
    confirmSetPasswordDraft.value = ''
    errorMessage.value = ''

    emit('success')
  } catch {
    errorMessage.value = t(
      'auth.profile.security.msg_set_password_network_error',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">
      {{ t('auth.profile.security.hint_oauth_set_password') }}
    </p>

    <div class="space-y-2">
      <Label
        class="text-xs"
        for="security-set-password"
      >
        {{ t('auth.profile.security.label_password') }}
      </Label>
      <InputGroup>
        <InputGroupInput
          id="security-set-password"
          v-model="setPasswordDraft"
          class="text-sm"
          :type="showSetPasswordFields ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.profile.security.ph_password')"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            type="button"
            :aria-label="
              showSetPasswordFields
                ? t('auth.profile.security.aria_toggle_password_hide')
                : t('auth.profile.security.aria_toggle_password')
            "
            class="cursor-pointer rounded-[calc(var(--radius)-5px)]"
            @click="showSetPasswordFields = !showSetPasswordFields"
          >
            <EyeOff
              v-if="showSetPasswordFields"
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
        for="security-set-password-confirm"
      >
        {{ t('auth.profile.security.label_confirm_password') }}
      </Label>
      <InputGroup>
        <InputGroupInput
          id="security-set-password-confirm"
          v-model="confirmSetPasswordDraft"
          class="text-sm"
          :type="showSetPasswordFields ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.profile.security.ph_confirm_password_set')"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            type="button"
            :aria-label="
              showSetPasswordFields
                ? t('auth.profile.security.aria_toggle_password_hide')
                : t('auth.profile.security.aria_toggle_password')
            "
            class="cursor-pointer rounded-[calc(var(--radius)-5px)]"
            @click="showSetPasswordFields = !showSetPasswordFields"
          >
            <EyeOff
              v-if="showSetPasswordFields"
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
        @click="onSubmit"
      >
        <Loader2
          v-if="submitting"
          class="mr-1.5 size-3 shrink-0 animate-spin"
        />
        {{ t('auth.profile.security.btn_set_password') }}
      </Button>
    </div>
  </div>
</template>
