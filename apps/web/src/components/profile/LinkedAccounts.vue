<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Link2, Link2Off, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type AccountRow = {
  providerId?: string
  accountId?: string
}

const props = defineProps<{
  accounts: AccountRow[]
  loading: boolean
  errorMessage?: string
}>()

const { t } = useI18n()

const githubAccount = computed(() =>
  props.accounts.find(a => a?.providerId === 'github'),
)

const hasGithubLinked = computed(() => Boolean(githubAccount.value))

function maskAccountId(id?: string): string {
  if (!id)
    return t('auth.profile.security.linked_account_connected')
  if (id.length <= 6)
    return id
  return `${id.slice(0, 3)}***${id.slice(-3)}`
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
            <div class="min-w-0">
              <p class="font-semibold leading-tight">
                {{ t('auth.profile.security.provider_github') }}
              </p>
              <p class="truncate text-sm text-muted-foreground">
                {{
                  hasGithubLinked
                    ? t('auth.profile.security.linked_account_id', { id: maskAccountId(githubAccount?.accountId) })
                    : t('auth.profile.security.github_link_hint')
                }}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled
              class="h-auto min-h-0 shrink-0 gap-1.5 px-2 py-2 text-xs leading-tight"
            >
              <Link2Off
                v-if="hasGithubLinked"
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
          </div>

          <Separator />

          <div class="px-6 py-3 text-xs text-muted-foreground">
            {{
              hasGithubLinked
                ? t('auth.profile.security.linked_account_connected')
                : t('auth.profile.security.linked_account_not_connected')
            }}
          </div>
        </template>
      </CardContent>
    </Card>
  </section>
</template>
