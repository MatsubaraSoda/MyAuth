import { createAuthClient } from "better-auth/vue"

export const authClient = createAuthClient({
    // 同源策略：前端与 auth API 共享同一个 origin（API 仍挂在 /api/auth/*）
    baseURL: window.location.origin,
})