<script setup lang="ts">
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
    errorMessage.value = 'INVALID_TOKEN'
    return
  }

  // 前端先做二次密码一致性校验
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match. Please check and try again.'
    return
  }

  await authClient.resetPassword({
    newPassword: newPassword.value,
    token: token.value,
  }, {
    onRequest: () => { loading.value = true },
    onResponse: () => { loading.value = false },
    onSuccess: async () => {
      message.value = 'Password updated. Redirecting to sign in...'
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
      <CardTitle class="text-lg">Reset Password</CardTitle>
      <CardDescription>
        Enter a new password for your account.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form id="reset-password-form" @submit.prevent="onSubmit">
        <div class="grid w-full items-center gap-4">
          <p v-if="!token" class="text-sm font-medium text-destructive">
            Invalid or missing reset token.
          </p>
          <p v-if="errorMessage" class="text-sm font-medium text-destructive">
            {{ errorMessage }}
          </p>
          <p v-if="message" class="text-sm text-muted-foreground">
            {{ message }}
          </p>
          <div class="flex flex-col space-y-1.5">
            <Label for="new-password">New Password</Label>
            <Input
              id="new-password"
              v-model="newPassword"
              type="password"
              :disabled="loading || !token"
            />
            <p class="text-sm text-muted-foreground">
              Must be at least 8 characters long.
            </p>
          </div>

          <div class="flex flex-col space-y-1.5">
            <Label for="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              :disabled="loading || !token"
            />
            <p class="text-sm text-muted-foreground">
              Please re-enter your new password.
            </p>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex flex-col gap-5">
      <Button class="w-full cursor-pointer" type="submit" form="reset-password-form" :disabled="loading || !token">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? 'Saving...' : 'Update password' }}
      </Button>
      <CardDescription class="text-muted-foreground">
        Remember your password?
        <RouterLink
          to="/auth/sign-in"
          class="ml-auto inline-block cursor-pointer text-sm text-foreground underline transition-colors"
        >
          Sign in
        </RouterLink>
      </CardDescription>
    </CardFooter>
  </Card>
</template>
