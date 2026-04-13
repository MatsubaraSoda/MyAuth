<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-vue-next'
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

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSignIn() {
  errorMessage.value = ''
  await authClient.signIn.email({
    email: email.value,
    password: password.value,
  }, {
    onRequest: () => { loading.value = true },
    onResponse: () => { loading.value = false },
    onSuccess: () => { router.push('/profile') },
    onError: (ctx) => {
      errorMessage.value = ctx.error.message
    }
  })
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-lg">Sign In</CardTitle>
      <CardDescription>
        Enter your email below to login to your account
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form id="sign-in-form" @submit.prevent="handleSignIn">
        <div class="grid w-full items-center gap-4">
          <p v-if="errorMessage" class="text-sm font-medium text-destructive">
            {{ errorMessage }}
          </p>
          <div class="flex flex-col space-y-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="m@example.com" />
          </div>
          <div class="flex flex-col space-y-1.5">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <RouterLink to="/auth/forgot-password" class="ml-auto inline-block text-sm hover:underline">
                Forgot your password?
              </RouterLink>
            </div>
            <Input id="password" v-model="password" type="password" placeholder="Password" />
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex flex-col gap-5">
      <Button class="w-full" type="submit" form="sign-in-form" :disabled="loading">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? 'Logging in...' : 'Login' }}
      </Button>
      <CardDescription>
        Don't have an account?
        <RouterLink to="/auth/sign-up" class="ml-auto inline-block text-sm underline hover:text-black">
          Sign Up
        </RouterLink>
      </CardDescription>
    </CardFooter>
  </Card>
</template>
