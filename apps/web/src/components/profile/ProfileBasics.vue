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
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

type UploadSig = {
  cloudName: string
  apiKey: string
  signature: string
  timestamp: string
  publicId: string
  eager: string
}

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
const isUploading = ref(false)
const nameDraft = ref('')
const uploadAvatarDialogOpen = ref(false)
const deleteAvatarDialogOpen = ref(false)
const saveProfileDialogOpen = ref(false)
const selectedFile = ref<File | null>(null)
const selectedPreviewUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

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

function revokePreview() {
  if (selectedPreviewUrl.value) {
    URL.revokeObjectURL(selectedPreviewUrl.value)
    selectedPreviewUrl.value = null
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  revokePreview()
  const file = input.files?.[0] ?? null
  selectedFile.value = file
  if (file) {
    selectedPreviewUrl.value = URL.createObjectURL(file)
  }
}

watch(uploadAvatarDialogOpen, (open) => {
  if (!open) {
    revokePreview()
    selectedFile.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
})

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
  if (savingProfile.value || props.loading || isUploading.value) return
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

async function handleAvatarUpload() {
  if (isUploading.value) return
  const file = selectedFile.value
  if (!file) {
    toast.error(t('auth.profile.msg_avatar_no_file'))
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    toast.error(t('auth.profile.avatar_file_hint'))
    return
  }

  isUploading.value = true
  try {
    const sigRes = await fetch(`${window.location.origin}/api/cloudinary/upload-signature`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!sigRes.ok) {
      const err = (await sigRes.json().catch(() => ({}))) as { error?: string }
      toast.error(err.error ?? t('auth.profile.msg_avatar_signature_error'))
      return
    }
    const sig = (await sigRes.json()) as UploadSig

    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', sig.apiKey)
    fd.append('timestamp', sig.timestamp)
    fd.append('signature', sig.signature)
    fd.append('public_id', sig.publicId)
    fd.append('eager', sig.eager)

    const up = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: 'POST', body: fd },
    )
    const body = (await up.json().catch(() => ({}))) as {
      secure_url?: string
      error?: { message?: string }
    }
    if (!up.ok) {
      toast.error(body.error?.message ?? t('auth.profile.msg_avatar_upload_error'))
      return
    }
    if (!body.secure_url) {
      toast.error(t('auth.profile.msg_avatar_upload_error'))
      return
    }

    const { error } = await authClient.updateUser({ image: body.secure_url })
    if (error?.message) {
      toast.error(error.message)
      return
    }

    emit('saved')
    toast.success(t('auth.profile.msg_avatar_upload_success'))
    uploadAvatarDialogOpen.value = false
  } finally {
    isUploading.value = false
    selectedFile.value = null
    revokePreview()
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

async function handleConfirmDeleteAvatar() {
  if (isUploading.value) return
  isUploading.value = true
  try {
    const del = await fetch(`${window.location.origin}/api/cloudinary/avatar`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!del.ok) {
      const err = (await del.json().catch(() => ({}))) as { error?: string }
      toast.error(err.error ?? t('auth.profile.msg_avatar_delete_error'))
      return
    }

    const { error } = await authClient.updateUser({ image: null })
    if (error?.message) {
      toast.error(error.message)
      return
    }

    emit('saved')
    toast.success(t('auth.profile.msg_avatar_delete_success'))
    deleteAvatarDialogOpen.value = false
  } finally {
    isUploading.value = false
  }
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
                  :disabled="isUploading"
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
                  :disabled="isUploading"
                  @select="uploadAvatarDialogOpen = true"
                >
                  <Upload />
                  {{ t('auth.profile.menu_upload_avatar') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  class="cursor-pointer text-xs"
                  :disabled="isUploading"
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
                      ref="fileInputRef"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      :disabled="isUploading"
                      @change="handleFileChange"
                    />
                    <p class="text-xs text-muted-foreground">
                      {{ t('auth.profile.avatar_file_hint') }}
                    </p>
                  </div>

                  <div
                    class="flex min-h-30 items-center justify-center overflow-hidden rounded-md border border-dashed p-3 text-xs text-muted-foreground"
                  >
                    <img
                      v-if="selectedPreviewUrl"
                      :src="selectedPreviewUrl"
                      alt=""
                      class="max-h-40 w-auto max-w-full rounded object-contain"
                    />
                    <span v-else>{{ t('auth.profile.avatar_preview_placeholder') }}</span>
                  </div>

                  <div class="flex justify-end gap-2">
                    <DialogClose as-child>
                      <Button
                        type="button"
                        variant="secondary"
                        class="cursor-pointer"
                        :disabled="isUploading"
                      >
                        {{ t('auth.profile.btn_cancel') }}
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      class="cursor-pointer gap-1.5"
                      :disabled="isUploading"
                      @click="handleAvatarUpload"
                    >
                      <Loader2
                        v-if="isUploading"
                        class="size-3 shrink-0 animate-spin"
                      />
                      {{
                        isUploading
                          ? t('auth.profile.btn_avatar_uploading')
                          : t('auth.profile.btn_upload_avatar')
                      }}
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
                        :disabled="isUploading"
                      >
                        {{ t('auth.profile.btn_cancel') }}
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      class="cursor-pointer gap-1.5"
                      :disabled="isUploading"
                      @click="handleConfirmDeleteAvatar"
                    >
                      <Loader2
                        v-if="isUploading"
                        class="size-3 shrink-0 animate-spin"
                      />
                      {{
                        isUploading
                          ? t('auth.profile.btn_avatar_deleting')
                          : t('auth.profile.btn_delete_avatar')
                      }}
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
            :disabled="savingProfile || isUploading"
          />
        </div>

        <div class="flex justify-start">
          <Button
            type="button"
            class="h-auto min-h-0 cursor-pointer gap-1.5 px-2 py-2 text-xs leading-tight"
            :disabled="savingProfile || isUploading"
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
