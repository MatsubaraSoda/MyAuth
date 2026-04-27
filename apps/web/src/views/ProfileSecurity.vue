<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Eye,
  EyeOff,
  Link2,
  Link2Off,
  Loader2,
  LogOut,
  X,
} from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const PLACEHOLDER_ICON = 'https://placehold.co/40x40'

const { t } = useI18n()

const accountsLoading = ref(true)
const accountsError = ref('')
const hasCredentialAccount = ref(false)

const currentPasswordDraft = ref('')
const newPasswordDraft = ref('')
const confirmPasswordDraft = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const setPasswordDraft = ref('')
const confirmSetPasswordDraft = ref('')
const showSetPasswordFields = ref(false)

const passwordSectionError = ref('')

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
  passwordSectionError.value = ''
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

function onPlaceholderChangePassword() {
  passwordSectionError.value = ''
  if (newPasswordDraft.value !== confirmPasswordDraft.value) {
    passwordSectionError.value = t('auth.profile.security.err_pwd_mismatch')
    return
  }
  void 0
}

function onPlaceholderSetPassword() {
  passwordSectionError.value = ''
  if (setPasswordDraft.value !== confirmSetPasswordDraft.value) {
    passwordSectionError.value = t('auth.profile.security.err_pwd_mismatch')
    return
  }
  void 0
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

        <template v-else-if="hasCredentialAccount">
          <div class="space-y-2">
            <Label
              class="text-xs"
              for="security-current-password"
            >
              {{ t('auth.profile.security.label_current_password') }}
            </Label>
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
            v-if="passwordSectionError"
            class="text-sm text-destructive"
          >
            {{ passwordSectionError }}
          </p>

          <div class="flex justify-start pt-1">
            <Button
              type="button"
              class="h-auto min-h-0 cursor-pointer px-4 py-2 text-xs leading-tight"
              @click="onPlaceholderChangePassword"
            >
              {{ t('auth.profile.security.btn_update_password') }}
            </Button>
          </div>
        </template>

        <template v-else>
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
            v-if="passwordSectionError"
            class="text-sm text-destructive"
          >
            {{ passwordSectionError }}
          </p>

          <div class="flex justify-start pt-1">
            <Button
              type="button"
              class="h-auto min-h-0 cursor-pointer px-4 py-2 text-xs leading-tight"
              @click="onPlaceholderSetPassword"
            >
              {{ t('auth.profile.security.btn_set_password') }}
            </Button>
          </div>
        </template>
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
