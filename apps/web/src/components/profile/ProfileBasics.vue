<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { authClient } from '@/lib/auth-client'
import { Loader2, Trash2, Upload } from 'lucide-vue-next'
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

type SessionData = Awaited<ReturnType<typeof authClient.getSession>>['data']

const props = defineProps<{
  session: SessionData | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'save-error', message: string): void
}>()

const { t } = useI18n()

const savingProfile = ref(false)
const nameDraft = ref('')
const uploadAvatarDialogOpen = ref(false)
const deleteAvatarDialogOpen = ref(false)
const saveProfileDialogOpen = ref(false)

const avatarSrc = computed(
  () => props.session?.user?.image ?? PLACEHOLDER_AVATAR,
)

const initials = computed(() =>
  initialsFromName(props.session?.user?.name ?? ''),
)

function initialsFromName(name: string) {
  const s = name.trim()
  if (!s) return '?'
  const first = s[0]
  return first ? first.toUpperCase() : '?'
}

watch(
  () => props.session?.user?.name,
  (name) => {
    if (name != null) {
      nameDraft.value = name
    } else {
      nameDraft.value = ''
    }
  },
  { immediate: true },
)

async function handleSaveProfile() {
  if (savingProfile.value || props.loading) return
  savingProfile.value = true

  const { error } = await authClient.updateUser({
    name: nameDraft.value.trim(),
  })

  savingProfile.value = false

  if (error?.message) {
    emit('save-error', error.message)
    toast.error(error.message)
    return
  }

  emit('saved')
  toast.success(t('auth.profile.msg_profile_save_success'))
}

async function handleConfirmSaveProfile() {
  await handleSaveProfile()
  saveProfileDialogOpen.value = false
}
</script>

<template>
  <!-- Section 1 — Profile (avatar + display name). See docs/TODO.md. -->
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
                  @select="uploadAvatarDialogOpen = true"
                >
                  <Upload />
                  {{ t('auth.profile.menu_upload_avatar') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  class="cursor-pointer text-xs"
                  @select="deleteAvatarDialogOpen = true"
                >
                  <Trash2 />
                  {{ t('auth.profile.menu_delete_avatar') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- Section 1 — dialog: upload avatar -->
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
                        class="cursor-pointer"
                      >
                        {{ t('auth.profile.btn_cancel') }}
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      class="cursor-pointer"
                      disabled
                    >
                      {{ t('auth.profile.btn_upload_avatar_todo') }}
                    </Button>
                  </div>
                </DialogContent>
              </DialogPortal>
            </DialogRoot>

            <!-- Section 1 — dialog: delete avatar -->
            <DialogRoot v-model:open="deleteAvatarDialogOpen">
              <DialogPortal>
                <DialogOverlay
                  class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />
                <DialogContent
                  class="bg-background data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-5 shadow-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                  <div class="flex items-start gap-3">
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
                        class="cursor-pointer"
                      >
                        {{ t('auth.profile.btn_cancel') }}
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      class="cursor-pointer"
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
            @click="saveProfileDialogOpen = true"
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

        <!-- Section 1 — dialog: confirm save profile -->
        <DialogRoot v-model:open="saveProfileDialogOpen">
          <DialogPortal>
            <DialogOverlay
              class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <DialogContent
              class="bg-background data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-5 shadow-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            >
              <div class="flex items-start gap-3">
                <div class="space-y-1">
                  <DialogTitle class="text-base font-semibold">
                    {{ t('auth.profile.profile_save_confirm_title') }}
                  </DialogTitle>
                  <DialogDescription class="text-sm text-muted-foreground">
                    {{ t('auth.profile.profile_save_confirm_desc') }}
                  </DialogDescription>
                </div>
              </div>

              <div class="flex justify-end gap-2">
                <DialogClose as-child>
                  <Button
                    type="button"
                    variant="secondary"
                    class="cursor-pointer"
                    :disabled="savingProfile"
                  >
                    {{ t('auth.profile.btn_cancel') }}
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  class="cursor-pointer gap-1.5"
                  :disabled="savingProfile"
                  @click="handleConfirmSaveProfile"
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
            </DialogContent>
          </DialogPortal>
        </DialogRoot>
      </CardContent>
    </Card>
  </section>
</template>
