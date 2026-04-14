# TODO

- [ ] Reset Password 页面增加“当前正在重置哪个账户”的提示（英文文案）。
  - 方案：进入页面后使用 token 做预校验，再返回脱敏邮箱（如 `s***@outlook.com`）用于展示。
  - 推荐实现：使用 Hono 自定义接口（如 `GET /api/auth/validate-token`），后端查询 D1 `verification` 表，返回 `{ valid, email/maskedEmail }`。
  - 约束：不在 URL 中传明文邮箱；token 无效/过期时直接提示并引导用户重新申请重置链接。
