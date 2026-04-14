<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const router = useRouter()

type SessionData = Awaited<ReturnType<typeof authClient.getSession>>['data']

const session = ref<SessionData | null>(null)
const loading = ref(true)
const signingOut = ref(false)
const errorMessage = ref('')

async function loadSession() {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await authClient.getSession()
  session.value = data

  if (error?.message) {
    errorMessage.value = error.message
  }

  loading.value = false
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
  <Card class="w-full max-w-lg">
    <CardHeader>
      <CardTitle class="text-xl">Profile</CardTitle>
      <CardDescription>
        Basic account information from Better Auth session.
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-3">
      <p v-if="errorMessage" class="text-sm font-medium text-destructive">
        {{ errorMessage }}
      </p>

      <p v-if="loading" class="text-sm text-muted-foreground">
        Loading profile...
      </p>

      <template v-else>
        <div class="grid gap-1">
          <span class="text-xs text-muted-foreground">Name</span>
          <span class="text-sm font-medium">{{ session?.user?.name || '-' }}</span>
        </div>
        <div class="grid gap-1">
          <span class="text-xs text-muted-foreground">Email</span>
          <span class="text-sm font-medium">{{ session?.user?.email || '-' }}</span>
        </div>
        <div class="grid gap-1">
          <span class="text-xs text-muted-foreground">User ID</span>
          <span class="text-sm font-medium break-all">{{ session?.user?.id || '-' }}</span>
        </div>
        <div class="grid gap-1">
          <span class="text-xs text-muted-foreground">Session ID</span>
          <span class="text-sm font-medium break-all">{{ session?.session?.id || '-' }}</span>
        </div>
      </template>
    </CardContent>

    <CardFooter>
      <Button
        class="w-full"
        variant="destructive"
        :disabled="loading || signingOut"
        @click="handleSignOut"
      >
        <Loader2 v-if="signingOut" class="mr-2 h-4 w-4 animate-spin" />
        {{ signingOut ? 'Signing out...' : 'Sign out' }}
      </Button>
    </CardFooter>
  </Card>
</template>
