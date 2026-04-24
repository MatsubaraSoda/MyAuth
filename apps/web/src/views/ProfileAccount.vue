<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authClient } from '@/lib/auth-client'
import { Loader2, LogOut } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ProfileBasics from '@/components/profile/ProfileBasics.vue'

const PLACEHOLDER_AVATAR = 'https://placehold.co/100x100'

const router = useRouter()
const { t } = useI18n()

type SessionData = Awaited<ReturnType<typeof authClient.getSession>>['data']

const session = ref<SessionData | null>(null)
const loading = ref(true)
const signingOut = ref(false)
const errorMessage = ref('')
const emit = defineEmits<{
  (e: 'loading-change', value: boolean): void
  (e: 'error-change', value: string): void
}>()

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

/**
 * @param silent 為 true 時不切換 `loading`（不卸載表單），用於子組件保存成功後刷新 session 等場景。
 */
async function loadSession(options?: { silent?: boolean }) {
  const silent = options?.silent ?? false
  if (!silent) {
    loading.value = true
  }
  errorMessage.value = ''

  const { data, error } = await authClient.getSession()
  session.value = data

  if (error?.message) {
    errorMessage.value = error.message
  }

  if (!silent) {
    loading.value = false
  }
}

function onProfileBasicsSaved() {
  void loadSession({ silent: true })
}

function onProfileBasicsSaveError(message: string) {
  errorMessage.value = message
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

watch(
  loading,
  (value) => {
    emit('loading-change', value)
  },
  { immediate: true },
)

watch(
  errorMessage,
  (value) => {
    emit('error-change', value)
  },
  { immediate: true },
)
</script>

<template>
  <template v-if="!loading">
    <ProfileBasics
      :session="session"
      :loading="loading"
      @saved="onProfileBasicsSaved"
      @save-error="onProfileBasicsSaveError"
    />

    <!-- Section 2 — Change email. See docs/TODO.md. -->
    <section class="space-y-3">
      <h2 class="text-base font-semibold tracking-tight">
        {{ t('auth.profile.section_change_email') }}
      </h2>
      <Card>
        <CardContent class="space-y-4">
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
              class="h-auto min-h-0 px-2 py-2 text-xs leading-tight"
              disabled
            >
              {{ t('auth.profile.btn_update_email') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Section 3 — Manage accounts. See docs/TODO.md. -->
    <section class="space-y-3">
      <h2 class="text-base font-semibold tracking-tight">
        {{ t('auth.profile.section_manage_accounts') }}
      </h2>
      <Card>
        <CardContent>
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
              class="h-auto min-h-0 shrink-0 gap-1.5 px-2 py-2 text-xs leading-tight"
              :disabled="signingOut"
              @click="handleSignOut"
            >
              <Loader2
                v-if="signingOut"
                class="size-3 shrink-0 animate-spin"
              />
              <LogOut
                v-else
                class="size-3 shrink-0"
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
</template>
