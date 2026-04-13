import { createAuthClient } from "better-auth/vue"
export const authClient = createAuthClient({
    baseURL: "https://myauth.matsubarasoda.com/" // The base URL of your auth server
})