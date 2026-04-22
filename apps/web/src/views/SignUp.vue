<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const socialLoading = ref(false)
const errorMessage = ref('')

async function handleSignUp() {
    errorMessage.value = ''

    if (password.value !== confirmPassword.value) {
        errorMessage.value = t('auth.sign_up.err_pwd_mismatch')
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
            <CardTitle class="text-lg">{{ t('auth.sign_up.title_page') }}</CardTitle>
            <CardDescription>
                {{ t('auth.sign_up.msg_intro') }}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form id="sign-up-form" @submit.prevent="handleSignUp">
                <div class="grid w-full items-center gap-4">
                    <p v-if="errorMessage" class="text-sm font-medium text-destructive">
                        {{ errorMessage }}
                    </p>
                    <div class="flex flex-col space-y-1.5">
                        <Label for="name">{{ t('auth.sign_up.label_name') }}</Label>
                        <Input
                            id="name"
                            v-model="name"
                            name="name"
                            type="text"
                            autocomplete="name"
                            :placeholder="t('auth.sign_up.ph_name')"
                            required
                        />
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <Label for="email">{{ t('auth.sign_up.label_email') }}</Label>
                        <Input
                            id="email"
                            v-model="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            :placeholder="t('auth.sign_up.ph_email')"
                            required
                        />
                        <p class="text-sm text-muted-foreground">
                            {{ t('auth.sign_up.msg_email_privacy') }}
                        </p>
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <div class="flex items-center">
                            <Label for="password">{{ t('auth.sign_up.label_password') }}</Label>
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
                            {{ t('auth.sign_up.msg_password_hint') }}
                        </p>
                    </div>
                    <div class="flex flex-col space-y-1.5">
                        <div class="flex items-center">
                            <Label for="confirm-password">{{ t('auth.sign_up.label_password_confirm') }}</Label>
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
                            {{ t('auth.sign_up.msg_confirm_hint') }}
                        </p>
                    </div>
                </div>
            </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-5">
            <Button class="w-full cursor-pointer" type="submit" form="sign-up-form" :disabled="loading || socialLoading">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                {{ loading ? t('auth.sign_up.btn_submit_loading') : t('auth.sign_up.btn_submit') }}
            </Button>

            <div class="relative w-full">
                <Separator />
                <span
                    class="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
                >
                    {{ t('auth.sign_up.msg_or') }}
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
                {{ t('auth.sign_up.btn_github') }}
            </Button>
            <CardDescription>
                {{ t('auth.sign_up.msg_has_account') }}
                <RouterLink
                    to="/auth/sign-in"
                    class="ml-auto inline-block cursor-pointer text-sm text-foreground underline transition-colors"
                >
                    {{ t('auth.sign_up.link_sign_in') }}
                </RouterLink>
            </CardDescription>
        </CardFooter>
    </Card>
</template>
