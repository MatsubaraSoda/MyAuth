<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')
const token = computed(() => {
  const queryToken = route.query.token
  return typeof queryToken === 'string' ? queryToken : ''
})

const onSubmit = async () => {
  if (loading.value) return
  errorMessage.value = ''
  message.value = ''

  if (!token.value) {
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = t('auth.reset_pwd.err_pwd_mismatch')
    return
  }

  await authClient.resetPassword({
    newPassword: newPassword.value,
    token: token.value,
  }, {
    onRequest: () => { loading.value = true },
    onResponse: () => { loading.value = false },
    onSuccess: async () => {
      message.value = t('auth.reset_pwd.msg_success_redirect')
      await router.push('/auth/sign-in')
    },
    onError: (ctx) => {
      errorMessage.value = ctx.error.message
    }
  })
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-lg">{{ t('auth.reset_pwd.title_page') }}</CardTitle>
      <CardDescription>
        {{ t('auth.reset_pwd.msg_intro') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form id="reset-password-form" @submit.prevent="onSubmit">
        <div class="grid w-full items-center gap-4">
          <p v-if="!token" class="text-sm font-medium text-destructive">
            {{ t('auth.reset_pwd.err_invalid_token') }}
          </p>
          <p v-if="errorMessage" class="text-sm font-medium text-destructive">
            {{ errorMessage }}
          </p>
          <p v-if="message" class="text-sm text-muted-foreground">
            {{ message }}
          </p>
          <div class="flex flex-col space-y-1.5">
            <Label for="new-password">{{ t('auth.reset_pwd.label_password_new') }}</Label>
            <Input
              id="new-password"
              v-model="newPassword"
              name="newPassword"
              type="password"
              autocomplete="new-password"
              required
              :disabled="loading || !token"
            />
            <p class="text-sm text-muted-foreground">
              {{ t('auth.reset_pwd.msg_password_hint') }}
            </p>
          </div>

          <div class="flex flex-col space-y-1.5">
            <Label for="confirm-password">{{ t('auth.reset_pwd.label_password_confirm') }}</Label>
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              :disabled="loading || !token"
            />
            <p class="text-sm text-muted-foreground">
              {{ t('auth.reset_pwd.msg_confirm_hint') }}
            </p>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex flex-col gap-5">
      <Button class="w-full cursor-pointer" type="submit" form="reset-password-form" :disabled="loading || !token">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? t('auth.reset_pwd.btn_submit_loading') : t('auth.reset_pwd.btn_submit') }}
      </Button>
      <CardDescription class="text-muted-foreground">
        {{ t('auth.reset_pwd.msg_remember') }}
        <RouterLink
          to="/auth/sign-in"
          class="ml-auto inline-block cursor-pointer text-sm text-foreground underline transition-colors"
        >
          {{ t('auth.reset_pwd.link_sign_in') }}
        </RouterLink>
      </CardDescription>
    </CardFooter>
  </Card>
</template>
