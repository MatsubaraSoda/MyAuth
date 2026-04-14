import { createAuthClient } from "better-auth/vue"

export const authClient = createAuthClient({
    // 统一同源：本地配合 Vite 代理，线上直接走当前域名
    baseURL: window.location.origin,
})