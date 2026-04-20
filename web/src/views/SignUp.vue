<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Github, Loader2 } from 'lucide-vue-next'
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
import { Separator } from '@/components/ui/separator'

const router = useRouter()

// 定义表单数据
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const socialLoading = ref(false)
const errorMessage = ref('')

// 编写注册函数
async function handleSignUp() {
    errorMessage.value = ''

    // 前端先做二次密码一致性校验，避免无效请求打到后端
    if (password.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match. Please check and try again.'
        return
    }

    await authClient.signUp.email({
        email: email.value,
        password: password.value,
        name: name.value,
    }, {
        onRequest: () => { loading.value = true },
        onResponse: () => { loading.value = false },
        onSuccess: () => { router.push('/profile') },
        onError: (ctx) => {
            errorMessage.value = ctx.error.message
        }
    })
}

async function handleGithubSignIn() {
    errorMessage.value = ''
    await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/profile',
    }, {
        onRequest: () => { socialLoading.value = true },
        onResponse: () => { socialLoading.value = false },
        onError: (ctx) => {
            errorMessage.value = ctx.error.message
        }
    })
}

</script>

<template>
    <Card class="w-full max-w-sm">
        <CardHeader>
            <CardTitle class="text-lg">Sign Up</CardTitle>
            <CardDescription>
                Enter your information to create an account
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form id="sign-up-form" @submit.prevent="handleSignUp">
                <div class="grid w-full items-center gap-4">
                    <p v-if="errorMessage" class="text-sm font-medium text-destructive">
                        {{ errorMessage }}
                    </p>
                    <div class="flex flex-col space-y-1.5">
                        <Label for="name">Name</Label>
                        <Input
                            id="name"
                            v-model="name"
                            name="name"
                            type="text"
                            autocomplete="name"
                            placeholder="Name"
                            required
                        />
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            v-model="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            placeholder="m@example.com"
                            required
                        />
                        <p class="text-sm text-muted-foreground">
                            We'll use this to contact you. We will not share your email with anyone else.
                        </p>
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <div class="flex items-center">
                            <Label for="password">Password</Label>
                        </div>
                        <Input
                            id="password"
                            v-model="password"
                            name="password"
                            type="password"
                            autocomplete="new-password"
                            required
                        />
                        <p class="text-sm text-muted-foreground">
                            Must be at least 8 characters long.
                        </p>
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <div class="flex items-center">
                            <Label for="confirm-password">Confirm Password</Label>
                        </div>
                        <Input
                            id="confirm-password"
                            v-model="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autocomplete="new-password"
                            required
                        />
                        <p class="text-sm text-muted-foreground">
                            Please confirm your password.
                        </p>
                    </div>
                </div>
            </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-5">
            <Button class="w-full cursor-pointer" type="submit" form="sign-up-form" :disabled="loading || socialLoading">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                {{ loading ? 'Creating account...' : 'Create an account' }}
            </Button>
            
            <div class="relative w-full">
                <Separator />
                <span
                    class="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
                >
                    OR
                </span>
            </div>
            
            <Button
                class="w-full cursor-pointer"
                type="button"
                variant="outline"
                :disabled="loading || socialLoading"
                @click="handleGithubSignIn"
            >
                <Loader2 v-if="socialLoading" class="mr-2 h-4 w-4 animate-spin" />
                <Github v-else class="mr-2 h-4 w-4" />
                Continue with GitHub
            </Button>
            <CardDescription>
                Already have an account?
                <RouterLink
                    to="/auth/sign-in"
                    class="ml-auto inline-block cursor-pointer text-sm text-foreground underline transition-colors"
                >
                    Sign In
                </RouterLink>
            </CardDescription>
        </CardFooter>
    </Card>
</template>
