<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Link2, Link2Off, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

const props = defineProps<{
  accounts: Array<{ providerId: string, accountId: string, [key: string]: unknown }>
  loading: boolean
  hasCredentialAccount: boolean
  errorMessage?: string
}>()
const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const isActionLoading = ref(false)
const unlinkDialogOpen = ref(false)

const githubAccount = computed(() =>
  props.accounts.find(a => a?.providerId === 'github'),
)

const hasGithubLinked = computed(() => Boolean(githubAccount.value))
const githubDisplayName = ref('')

const cannotUnlink = computed(() => {
  const oauthAccountsCount = props.accounts.filter(a => a?.providerId !== 'credential').length
  return !props.hasCredentialAccount && oauthAccountsCount <= 1
})

async function fetchGithubUsername(accountId: string) {
  githubDisplayName.value = `ID: ${accountId}`
  try {
    const res = await fetch(`https://api.github.com/user/${accountId}`)
    if (!res.ok) {
      githubDisplayName.value = `ID: ${accountId}`
      return
    }
    const payload = await res.json() as { login?: unknown }
    if (typeof payload.login === 'string' && payload.login.trim()) {
      githubDisplayName.value = payload.login
      return
    }
    githubDisplayName.value = `ID: ${accountId}`
  } catch {
    githubDisplayName.value = `ID: ${accountId}`
  }
}

watch(
  githubAccount,
  (account) => {
    if (account?.accountId) {
      void fetchGithubUsername(account.accountId)
      return
    }
    githubDisplayName.value = ''
  },
  { immediate: true },
)

onMounted(() => {
  const currentURL = new URL(window.location.href)
  const errorCode = currentURL.searchParams.get('error')
  if (!errorCode)
    return

  toast.error(t('auth.profile.security.msg_oauth_callback_error', { code: errorCode }))

  currentURL.searchParams.delete('error')
  const cleanURL = `${currentURL.pathname}${currentURL.search}${currentURL.hash}`
  window.history.replaceState(window.history.state, '', cleanURL)
})

async function handleLink() {
  isActionLoading.value = true
  try {
    await authClient.linkSocial({
      provider: 'github',
      callbackURL: window.location.href,
    })
  } catch (error: unknown) {
    void error
    toast.error(t('auth.profile.security.msg_link_failed'))
    isActionLoading.value = false
  }
}

async function handleUnlink() {
  isActionLoading.value = true
  const { error } = await authClient.unlinkAccount({
    providerId: 'github',
  })
  isActionLoading.value = false

  if (error) {
    toast.error(t('auth.profile.security.msg_unlink_failed'))
    return
  }
  toast.success(t('auth.profile.security.msg_unlink_success'))
  unlinkDialogOpen.value = false
  emit('refresh')
}

function onPrimaryActionClick() {
  if (hasGithubLinked.value) {
    if (!cannotUnlink.value)
      unlinkDialogOpen.value = true
    return
  }
  void handleLink()
}
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_linked_accounts') }}
    </h2>
    <Card class="overflow-hidden py-0">
      <CardContent class="space-y-0 p-0">
        <div
          v-if="loading"
          class="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground"
        >
          <Loader2 class="size-4 shrink-0 animate-spin" />
          <span>{{ t('auth.profile.security.msg_accounts_loading') }}</span>
        </div>

        <template v-else-if="errorMessage">
          <div class="px-6 py-4">
            <p class="text-sm text-destructive">
              {{ errorMessage }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t('auth.profile.security.msg_accounts_load_hint') }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  class="size-5 fill-current"
                  aria-hidden="true"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.provider_github') }}
                </p>
                <p class="truncate text-sm text-muted-foreground">
                  {{
                    hasGithubLinked
                      ? githubDisplayName
                      : t('auth.profile.security.github_link_hint')
                  }}
                </p>
              </div>
            </div>
            <div class="shrink-0">
              <Button
                type="button"
                variant="outline"
                class="h-auto min-h-0 shrink-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
                :disabled="(hasGithubLinked && cannotUnlink) || isActionLoading"
                :title="hasGithubLinked && cannotUnlink ? t('auth.profile.security.hint_cannot_unlink_last_key') : undefined"
                @click="onPrimaryActionClick"
              >
                <Loader2
                  v-if="isActionLoading"
                  class="size-3.5 shrink-0 animate-spin"
                />
                <Link2Off
                  v-else-if="hasGithubLinked"
                  class="size-3.5 shrink-0"
                />
                <Link2
                  v-else
                  class="size-3.5 shrink-0"
                />
                {{
                  hasGithubLinked
                    ? t('auth.profile.security.btn_unlink')
                    : t('auth.profile.security.btn_link')
                }}
              </Button>
              <p
                v-if="hasGithubLinked && cannotUnlink"
                class="mt-1 max-w-44 text-[11px] leading-snug text-muted-foreground"
              >
                {{ t('auth.profile.security.hint_cannot_unlink_last_key') }}
              </p>
            </div>
          </div>

          <DialogRoot v-model:open="unlinkDialogOpen">
            <DialogPortal>
              <DialogOverlay
                class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
              />
              <DialogContent
                class="bg-background data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-5 shadow-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              >
                <div class="space-y-1">
                  <DialogTitle class="text-base font-semibold">
                    {{ t('auth.profile.security.unlink_confirm_title') }}
                  </DialogTitle>
                  <DialogDescription class="text-sm text-muted-foreground">
                    {{ t('auth.profile.security.unlink_confirm_desc') }}
                  </DialogDescription>
                </div>

                <div class="flex justify-end gap-2">
                  <DialogClose as-child>
                    <Button
                      type="button"
                      variant="secondary"
                      class="cursor-pointer"
                      :disabled="isActionLoading"
                    >
                      {{ t('auth.profile.btn_cancel') }}
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    class="cursor-pointer gap-1.5"
                    :disabled="isActionLoading"
                    @click="handleUnlink"
                  >
                    <Loader2
                      v-if="isActionLoading"
                      class="size-3 shrink-0 animate-spin"
                    />
                    {{ t('auth.profile.security.btn_unlink') }}
                  </Button>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </template>
      </CardContent>
    </Card>
  </section>
</template>
