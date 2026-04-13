<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
</script>

<template>
    <Card class="w-full max-w-sm">
        <CardHeader>
            <CardTitle class="text-lg">Forgot Password</CardTitle>
            <CardDescription>
                Enter your email to reset your password
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form>
                <div class="grid w-full items-center gap-4">
                    <div class="flex flex-col space-y-1.5">
                        <Label for="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" />
                    </div>
                </div>
            </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-5">
            <Button class="w-full">
                Send reset link
            </Button>
            <CardDescription>
                Already have an account?
                <a href="#" class="ml-auto inline-block text-sm underline hover:text-black">
                    Sign In
                </a>
            </CardDescription>
        </CardFooter>
    </Card>
</template>
