<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Eye,
  EyeOff,
  Link2,
  Link2Off,
  LogOut,
  X,
} from 'lucide-vue-next'
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

const currentPasswordDraft = ref('')
const newPasswordDraft = ref('')
const confirmPasswordDraft = ref('')
const showNewPassword = ref(false)
</script>

<template>
    <!-- Change password -->
    <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_change_password') }}
    </h2>
    <Card>
      <CardContent class="space-y-4">
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
          <Input
            id="security-confirm-password"
            v-model="confirmPasswordDraft"
            type="password"
            autocomplete="new-password"
            class="text-sm"
            :placeholder="t('auth.profile.security.ph_confirm_password')"
          />
        </div>

        <div class="flex justify-start pt-1">
          <Button
            type="button"
            class="h-auto min-h-0 cursor-pointer px-4 py-2 text-xs leading-tight"
          >
            {{ t('auth.profile.security.btn_update_password') }}
          </Button>
        </div>
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
