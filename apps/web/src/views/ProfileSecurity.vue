<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Loader2 } from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import ActiveSessions from '@/components/profile/ActiveSessions.vue'
import ChangePassword from '@/components/profile/ChangePassword.vue'
import LinkedAccounts from '@/components/profile/LinkedAccounts.vue'
import SetPassword from '@/components/profile/SetPassword.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type AccountRow = {
  providerId: string
  accountId: string
  [key: string]: any
}

const { t } = useI18n()

const accountsLoading = ref(true)
const accountsError = ref('')
const accounts = ref<AccountRow[]>([])
const hasCredentialAccount = ref(false)

/**
 * 解析 listAccounts 的返回（数组或 { data, error }），得到账户行列表。
 */
function parseListAccountsPayload(result: unknown): {
  rows: AccountRow[] | undefined
  message: string | undefined
} {
  const normalizeRows = (input: unknown[]): AccountRow[] =>
    input
      .filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'))
      .filter(item => typeof item.providerId === 'string' && typeof item.accountId === 'string')
      .map(item => item as AccountRow)

  if (Array.isArray(result)) {
    return { rows: normalizeRows(result), message: undefined }
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
      return { rows: normalizeRows(d), message: undefined }
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
    accounts.value = rows ?? []
    hasCredentialAccount.value = accounts.value.some(a => a?.providerId === 'credential')
  } catch (e) {
    accountsError.value =
      e instanceof Error ? e.message : t('auth.profile.security.msg_accounts_load_error')
    accounts.value = []
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

  <LinkedAccounts
    :accounts="accounts"
    :loading="accountsLoading"
    :has-credential-account="hasCredentialAccount"
    :error-message="accountsError"
  />

  <ActiveSessions />

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
