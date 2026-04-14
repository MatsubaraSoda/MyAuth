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
// 引入图标以增强 UX，如果没有安装可以直接 npm install lucide-vue-next
import { Loader2 } from 'lucide-vue-next'

const email = ref('')
const sentEmail = ref('')
const isSubmitting = ref(false)
const isSent = ref(false)
const cooldown = ref(0)

// 倒计时逻辑
const startCooldown = () => {
    cooldown.value = 60
    const timer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
            clearInterval(timer)
        }
    }, 1000)
}

// 模拟表单提交
const onSubmit = () => {
    if (!email.value || isSubmitting.value || cooldown.value > 0) return

    // 在点击发送时冻结本次邮箱展示文案，直到下一次真正发送
    sentEmail.value = email.value
    isSubmitting.value = true
    
    // 模拟 1.5 秒的网络请求延迟
    setTimeout(() => {
        isSubmitting.value = false
        isSent.value = true
        startCooldown() // 发送成功后开始倒计时
    }, 1500)
}

</script>

<template>
    <Card class="w-full max-w-sm">
        <CardHeader>
            <CardTitle class="text-xl">Forgot Password</CardTitle>
            <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
            <CardDescription v-if="isSent">
                If an account exists for <span class="font-medium text-foreground">{{ sentEmail }}</span>,
                we've sent a password reset link.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form @submit.prevent="onSubmit">
                <div class="grid w-full items-center gap-4">
                    <div class="flex flex-col space-y-1.5">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            v-model="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            :disabled="isSubmitting"
                        />
                    </div>
                </div>

                <Button type="submit" class="w-full mt-6" :disabled="isSubmitting || !email || cooldown > 0">
                    <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                    {{
                        isSubmitting
                            ? 'Sending...'
                            : cooldown > 0
                                ? `Resend available in ${cooldown}s`
                                : 'Send reset link'
                    }}
                </Button>
            </form>
        </CardContent>

        <CardFooter class="flex justify-center gap-1 pt-2 pb-6 text-sm text-muted-foreground">
            <span>Remember your password?</span>
            <RouterLink
                to="/auth/sign-in"
                class="underline transition-colors hover:text-foreground"
            >
                Sign in
            </RouterLink>
        </CardFooter>
    </Card>
</template>