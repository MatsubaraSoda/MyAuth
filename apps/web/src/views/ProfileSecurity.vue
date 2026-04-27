<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import {
  Link2,
  Link2Off,
  Loader2,
  LogOut,
  X,
} from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import ChangePassword from '@/components/profile/ChangePassword.vue'
import SetPassword from '@/components/profile/SetPassword.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const PLACEHOLDER_ICON = 'https://placehold.co/40x40'

const { t } = useI18n()

const accountsLoading = ref(true)
const accountsError = ref('')
const hasCredentialAccount = ref(false)

/**
 * 解析 listAccounts 的返回（数组或 { data, error }），得到账户行列表。
 */
function parseListAccountsPayload(result: unknown): {
  rows: Array<{ providerId?: string }> | undefined
  message: string | undefined
} {
  if (Array.isArray(result)) {
    return { rows: result as Array<{ providerId?: string }>, message: undefined }
  }
  if (result && typeof result === 'object') {
    const r = result as {
      data?: unknown
      error?: { message?: string }
    }
    if (r.error?.message) {
      return { rows: undefined, message: r.error.message }
    }
    const d = r.data
    if (Array.isArray(d)) {
      return { rows: d as Array<{ providerId?: string }>, message: undefined }
    }
  }
  return { rows: undefined, message: undefined }
}

async function loadLinkedAccounts() {
  accountsLoading.value = true
  accountsError.value = ''
  try {
    const result = await authClient.listAccounts()
    const { rows, message } = parseListAccountsPayload(result)
    if (message) {
      accountsError.value = message
      return
    }
    hasCredentialAccount.value =
      rows?.some((a) => a?.providerId === 'credential') ?? false
  } catch (e) {
    accountsError.value =
      e instanceof Error ? e.message : t('auth.profile.security.msg_accounts_load_error')
  } finally {
    accountsLoading.value = false
  }
}

onMounted(() => {
  void loadLinkedAccounts()
})

const passwordSectionHeading = computed(() => {
  if (accountsLoading.value || accountsError.value) {
    return t('auth.profile.security.section_password')
  }
  return hasCredentialAccount.value
    ? t('auth.profile.security.section_change_password')
    : t('auth.profile.security.section_set_password')
})

async function onSetPasswordSuccess() {
  await loadLinkedAccounts()
  toast.success(t('auth.profile.security.msg_set_password_success'))
}
</script>

<template>
  <!-- Password: credential vs OAuth-only -->
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ passwordSectionHeading }}
    </h2>
    <Card>
      <CardContent class="space-y-4">
        <div
          v-if="accountsLoading"
          class="flex items-center gap-2 py-6 text-sm text-muted-foreground"
        >
          <Loader2 class="size-4 shrink-0 animate-spin" />
          <span>{{ t('auth.profile.security.msg_accounts_loading') }}</span>
        </div>

        <template v-else-if="accountsError">
          <p class="text-sm text-destructive">
            {{ accountsError }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ t('auth.profile.security.msg_accounts_load_hint') }}
          </p>
        </template>

        <ChangePassword v-else-if="hasCredentialAccount" />

        <SetPassword
          v-else
          @success="onSetPasswordSuccess"
        />
      </CardContent>
    </Card>
  </section>

  <!-- Linked accounts -->
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_linked_accounts') }}
    </h2>
    <Card class="overflow-hidden py-0">
      <CardContent class="space-y-0 p-0">
        <div
          class="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <img
              :src="PLACEHOLDER_ICON"
              alt=""
              class="size-10 shrink-0 rounded-md border border-border object-cover"
              width="40"
              height="40"
            />
            <div class="min-w-0">
              <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.provider_github') }}
              </p>
              <p class="truncate text-sm text-muted-foreground">
                {{ t('auth.profile.security.github_user_sample') }}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            class="h-auto min-h-0 shrink-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
          >
            <Link2Off class="size-3.5 shrink-0" />
            {{ t('auth.profile.security.btn_unlink') }}
          </Button>
        </div>

        <Separator />

        <div
          class="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <img
              :src="PLACEHOLDER_ICON"
              alt=""
              class="size-10 shrink-0 rounded-md border border-border object-cover opacity-60 grayscale"
              width="40"
              height="40"
            />
            <div class="min-w-0">
              <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.provider_github') }}
              </p>
              <p class="truncate text-sm text-muted-foreground">
                {{ t('auth.profile.security.github_link_hint') }}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            class="h-auto min-h-0 shrink-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
          >
            <Link2 class="size-3.5 shrink-0" />
            {{ t('auth.profile.security.btn_link') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>

  <!-- Active sessions -->
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_active_sessions') }}
    </h2>
    <Card class="overflow-hidden py-0">
      <CardContent class="space-y-0 p-0">
        <div
          class="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <img
              :src="PLACEHOLDER_ICON"
              alt=""
              class="size-10 shrink-0 rounded-md border border-border object-cover"
              width="40"
              height="40"
            />
            <div class="min-w-0 space-y-1">
              <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.session_chrome_macos') }}
              </p>
              <Badge variant="secondary" class="text-[10px] font-normal">
                {{ t('auth.profile.security.session_current_badge') }}
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            class="h-auto min-h-0 shrink-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
          >
            <LogOut class="size-3.5 shrink-0" />
            {{ t('auth.profile.security.btn_session_sign_out') }}
          </Button>
        </div>

        <Separator />

        <div
          class="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <img
              :src="PLACEHOLDER_ICON"
              alt=""
              class="size-10 shrink-0 rounded-md border border-border object-cover"
              width="40"
              height="40"
            />
            <div class="min-w-0">
              <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.session_safari_ios') }}
              </p>
              <p class="truncate text-sm text-muted-foreground">
                {{ t('auth.profile.security.session_time_sample') }}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            class="h-auto min-h-0 shrink-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
          >
            <X class="size-3.5 shrink-0" />
            {{ t('auth.profile.security.btn_revoke') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>

  <!-- Danger zone -->
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_danger_zone') }}
    </h2>
    <Card>
      <CardContent class="flex flex-col items-start gap-4">
        <div class="min-w-0 max-w-prose space-y-1">
          <p class="font-semibold">
            {{ t('auth.profile.security.danger_delete_title') }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ t('auth.profile.security.danger_delete_desc') }}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          class="h-auto min-h-0 shrink-0 cursor-pointer px-3 py-2 text-xs leading-tight"
        >
          {{ t('auth.profile.security.btn_delete_user') }}
        </Button>
      </CardContent>
    </Card>
  </section>
</template>
