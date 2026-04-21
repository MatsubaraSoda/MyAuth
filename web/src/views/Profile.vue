<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authClient } from '@/lib/auth-client'
import { Loader2, LogOut } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PLACEHOLDER_AVATAR = 'https://placehold.co/100x100'

const router = useRouter()
const { t } = useI18n()

type SessionData = Awaited<ReturnType<typeof authClient.getSession>>['data']

const session = ref<SessionData | null>(null)
const loading = ref(true)
const signingOut = ref(false)
const savingProfile = ref(false)
const errorMessage = ref('')
const nameDraft = ref('')

const avatarSrc = computed(
  () => session.value?.user?.image ?? PLACEHOLDER_AVATAR,
)

const initials = computed(() =>
  initialsFromName(session.value?.user?.name ?? ''),
)

function initialsFromName(name: string) {
  const s = name.trim()
  if (!s) return '?'
  const first = s[0]
  return first ? first.toUpperCase() : '?'
}

async function loadSession() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await authClient.getSession()
  session.value = data

  if (error?.message) {
    errorMessage.value = error.message
  } else if (data?.user?.name != null) {
    nameDraft.value = data.user.name ?? ''
  } else {
    nameDraft.value = ''
  }

  loading.value = false
}

async function handleSaveProfile() {
  if (savingProfile.value || loading.value) return
  errorMessage.value = ''
  savingProfile.value = true

  const { error } = await authClient.updateUser({
    name: nameDraft.value.trim(),
  })

  savingProfile.value = false

  if (error?.message) {
    errorMessage.value = error.message
    return
  }

  await loadSession()
}

async function handleSignOut() {
  if (signingOut.value) return
  errorMessage.value = ''
  signingOut.value = true

  const { error } = await authClient.signOut()
  signingOut.value = false

  if (error?.message) {
    errorMessage.value = error.message
    return
  }

  await router.push('/auth/sign-in')
}

onMounted(loadSession)
</script>

<template>
  <div class="-mx-4 rounded-xl bg-muted/40 px-4 py-6">
    <div class="mx-auto w-full max-w-lg space-y-8">
      <p
        v-if="errorMessage"
        class="text-sm font-medium text-destructive"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="loading"
        class="text-sm text-muted-foreground"
      >
        {{ t('auth.profile.page_loading') }}
      </p>

      <template v-else>
        <!-- Profile -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold tracking-tight">
            {{ t('auth.profile.section_profile') }}
          </h2>
          <Card>
            <CardContent class="space-y-6 pt-6">
              <div class="space-y-2">
                <Label class="text-xs">
                  {{ t('auth.profile.label_avatar') }}
                </Label>
                <div class="flex flex-wrap items-center gap-4">
                  <Avatar class="size-10">
                    <AvatarImage
                      :src="avatarSrc"
                      :alt="t('auth.profile.aria_profile_avatar')"
                    />
                    <AvatarFallback>{{ initials }}</AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled
                    >
                      {{ t('auth.profile.btn_change_avatar') }}
                    </Button>
                    <p class="text-xs text-muted-foreground">
                      {{ t('auth.profile.hint_change_avatar_disabled') }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label
                  class="text-xs"
                  for="profile-name"
                >
                  {{ t('auth.profile.label_name') }}
                </Label>
                <Input
                  id="profile-name"
                  v-model="nameDraft"
                  type="text"
                  autocomplete="name"
                  :disabled="savingProfile"
                />
              </div>

              <div class="flex justify-start">
                <Button
                  type="button"
                  :disabled="savingProfile"
                  @click="handleSaveProfile"
                >
                  <Loader2
                    v-if="savingProfile"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{
                    savingProfile
                      ? t('auth.profile.btn_save_profile_loading')
                      : t('auth.profile.btn_save_profile')
                  }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Change email -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold tracking-tight">
            {{ t('auth.profile.section_change_email') }}
          </h2>
          <Card>
            <CardContent class="space-y-4 pt-6">
              <CardDescription>
                {{ t('auth.profile.hint_change_email_disabled') }}
              </CardDescription>
              <div class="space-y-2">
                <Label
                  class="text-xs"
                  for="profile-email"
                >
                  {{ t('auth.profile.label_email') }}
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  :model-value="session?.user?.email ?? ''"
                  disabled
                  readonly
                />
              </div>
              <div class="flex justify-start">
                <Button
                  type="button"
                  disabled
                >
                  {{ t('auth.profile.btn_update_email') }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- Manage accounts -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold tracking-tight">
            {{ t('auth.profile.section_manage_accounts') }}
          </h2>
          <Card>
            <CardContent class="pt-6">
              <div
                class="flex flex-wrap items-center justify-between gap-4"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <Avatar class="size-10 shrink-0">
                    <AvatarImage
                      :src="avatarSrc"
                      :alt="t('auth.profile.aria_profile_avatar')"
                    />
                    <AvatarFallback>{{ initials }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0">
                    <p class="truncate font-semibold">
                      {{ session?.user?.name || '—' }}
                    </p>
                    <p class="truncate text-sm text-muted-foreground">
                      {{ session?.user?.email || '—' }}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  class="shrink-0"
                  :disabled="signingOut"
                  @click="handleSignOut"
                >
                  <Loader2
                    v-if="signingOut"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  <LogOut
                    v-else
                    class="mr-2 h-4 w-4"
                  />
                  {{
                    signingOut
                      ? t('auth.profile.btn_sign_out_loading')
                      : t('auth.profile.btn_sign_out')
                  }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </template>
    </div>
  </div>
</template>
