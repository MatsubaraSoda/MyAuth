<script setup lang="ts">
import { ref } from 'vue'
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

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

// 开发阶段占位：先做交互壳，后续再接入真实重置 API
const onSubmit = () => {
  if (loading.value) return
  errorMessage.value = ''
  message.value = ''

  // 前端先做二次密码一致性校验
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match. Please check and try again.'
    return
  }

  loading.value = true

  setTimeout(() => {
    loading.value = false
    message.value = 'Password reset request submitted.'
  }, 1200)
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
            />
            <p class="text-sm text-muted-foreground">
              Please re-enter your new password.
            </p>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex flex-col gap-5">
      <Button class="w-full" type="submit" form="reset-password-form" :disabled="loading">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? 'Saving...' : 'Update password' }}
      </Button>
      <CardDescription class="text-muted-foreground">
        Remember your password?
        <RouterLink
          to="/auth/sign-in"
          class="ml-auto inline-block text-sm underline transition-colors hover:text-foreground"
        >
          Sign in
        </RouterLink>
      </CardDescription>
    </CardFooter>
  </Card>
</template>
