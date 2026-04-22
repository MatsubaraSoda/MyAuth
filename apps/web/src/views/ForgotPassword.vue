<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
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

const email = ref('')
const sentEmail = ref('')
const isSubmitting = ref(false)
const isSent = ref(false)
const cooldown = ref(0)
const errorMessage = ref('')

const startCooldown = () => {
    cooldown.value = 60
    const timer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
            clearInterval(timer)
        }
    }, 1000)
}

const onSubmit = async () => {
    if (!email.value || isSubmitting.value || cooldown.value > 0) return

    sentEmail.value = email.value
    errorMessage.value = ''
    isSubmitting.value = true

    try {
        const { error } = await authClient.requestPasswordReset({
            email: email.value,
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
            errorMessage.value = error.message ?? ''
            return
        }

        isSent.value = true
        startCooldown()
    } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : ''
    } finally {
        isSubmitting.value = false
    }
}

</script>

<template>
    <Card class="w-full max-w-sm">
        <CardHeader>
            <CardTitle class="text-xl">{{ t('auth.forgot_pwd.title_page') }}</CardTitle>
            <CardDescription>
                {{ t('auth.forgot_pwd.msg_instructions') }}
            </CardDescription>
            <CardDescription v-if="isSent">
                {{ t('auth.forgot_pwd.msg_sent_after_send', { email: sentEmail }) }}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form @submit.prevent="onSubmit">
                <div class="grid w-full items-center gap-4">
                    <p v-if="errorMessage" class="text-sm font-medium text-destructive">
                        {{ errorMessage }}
                    </p>
                    <div class="flex flex-col space-y-1.5">
                        <Label for="email">{{ t('auth.forgot_pwd.label_email') }}</Label>
                        <Input
                            id="email"
                            v-model="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            :placeholder="t('auth.forgot_pwd.ph_email')"
                            required
                            :disabled="isSubmitting"
                        />
                    </div>
                </div>

                <Button type="submit" class="mt-6 w-full cursor-pointer" :disabled="isSubmitting || !email || cooldown > 0">
                    <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                    {{
                        isSubmitting
                            ? t('auth.forgot_pwd.btn_send_loading')
                            : cooldown > 0
                                ? t('auth.forgot_pwd.msg_resend_in', { seconds: cooldown })
                                : t('auth.forgot_pwd.btn_send')
                    }}
                </Button>
            </form>
        </CardContent>

        <CardFooter class="flex justify-center gap-1 pt-2 pb-6 text-sm text-muted-foreground">
            <span>{{ t('auth.forgot_pwd.msg_remember') }}</span>
            <RouterLink
                to="/auth/sign-in"
                class="cursor-pointer text-foreground underline transition-colors"
            >
                {{ t('auth.forgot_pwd.link_sign_in') }}
            </RouterLink>
        </CardFooter>
    </Card>
</template>
