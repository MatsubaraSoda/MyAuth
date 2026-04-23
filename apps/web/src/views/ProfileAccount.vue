<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authClient } from '@/lib/auth-client'
import { CircleAlert, Loader2, LogOut, Trash2, Upload } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

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
const uploadAvatarDialogOpen = ref(false)
const deleteAvatarDialogOpen = ref(false)
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
    <!-- Profile -->
    <section class="space-y-3">
      <h2 class="text-base font-semibold tracking-tight">
        {{ t('auth.profile.section_profile') }}
      </h2>
      <Card>
        <CardContent class="space-y-6">
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
              <DropdownMenu :modal="false">
                <DropdownMenuTrigger as-child>
                  <Button
                    type="button"
                    variant="secondary"
                    class="h-auto min-h-0 cursor-pointer px-2 py-2 text-xs leading-tight"
                  >
                    {{ t('auth.profile.btn_change_avatar') }}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  class="w-auto min-w-max"
                >
                  <DropdownMenuItem
                    class="cursor-pointer text-xs"
                    @select.prevent="uploadAvatarDialogOpen = true"
                  >
                    <Upload />
                    {{ t('auth.profile.menu_upload_avatar') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    class="cursor-pointer text-xs"
                    @select.prevent="deleteAvatarDialogOpen = true"
                  >
                    <Trash2 />
                    {{ t('auth.profile.menu_delete_avatar') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DialogRoot v-model:open="uploadAvatarDialogOpen">
                <DialogPortal>
                  <DialogOverlay
                    class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                  />
                  <DialogContent
                    class="bg-background data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-5 shadow-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                  >
                    <DialogTitle class="text-base font-semibold">
                      {{ t('auth.profile.avatar_upload_title') }}
                    </DialogTitle>
                    <DialogDescription class="text-sm text-muted-foreground">
                      {{ t('auth.profile.avatar_upload_desc') }}
                    </DialogDescription>

                    <div class="space-y-2">
                      <Label
                        class="text-xs"
                        for="avatar-file-input"
                      >
                        {{ t('auth.profile.avatar_file_label') }}
                      </Label>
                      <Input
                        id="avatar-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                      />
                      <p class="text-xs text-muted-foreground">
                        {{ t('auth.profile.avatar_file_hint') }}
                      </p>
                    </div>

                    <div class="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      {{ t('auth.profile.avatar_preview_placeholder') }}
                    </div>

                    <div class="flex justify-end gap-2">
                      <DialogClose as-child>
                        <Button
                          type="button"
                          variant="secondary"
                        >
                          {{ t('auth.profile.btn_cancel') }}
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        disabled
                      >
                        {{ t('auth.profile.btn_upload_avatar_todo') }}
                      </Button>
                    </div>
                  </DialogContent>
                </DialogPortal>
              </DialogRoot>

              <DialogRoot v-model:open="deleteAvatarDialogOpen">
                <DialogPortal>
                  <DialogOverlay
                    class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                  />
                  <DialogContent
                    class="bg-background data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-5 shadow-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                  >
                    <div class="flex items-start gap-3">
                      <div class="rounded-full bg-destructive/10 p-2 text-destructive">
                        <CircleAlert class="size-4" />
                      </div>
                      <div class="space-y-1">
                        <DialogTitle class="text-base font-semibold">
                          {{ t('auth.profile.avatar_delete_title') }}
                        </DialogTitle>
                        <DialogDescription class="text-sm text-muted-foreground">
                          {{ t('auth.profile.avatar_delete_desc') }}
                        </DialogDescription>
                      </div>
                    </div>

                    <div class="flex justify-end gap-2">
                      <DialogClose as-child>
                        <Button
                          type="button"
                          variant="secondary"
                        >
                          {{ t('auth.profile.btn_cancel') }}
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled
                      >
                        {{ t('auth.profile.btn_delete_avatar_todo') }}
                      </Button>
                    </div>
                  </DialogContent>
                </DialogPortal>
              </DialogRoot>
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
              class="h-auto min-h-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
              :disabled="savingProfile"
              @click="handleSaveProfile"
            >
              <Loader2
                v-if="savingProfile"
                class="size-3 shrink-0 animate-spin"
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

    <!-- Manage accounts -->
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
