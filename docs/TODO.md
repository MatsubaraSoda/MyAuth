# TODO

- [ ] Reset Password 页面增加“当前正在重置哪个账户”的提示（英文文案）。
  - 方案：进入页面后使用 token 做预校验，再返回脱敏邮箱（如 `s***@outlook.com`）用于展示。
  - 推荐实现：使用 Hono 自定义接口（如 `GET /api/auth/validate-token`），后端查询 D1 `verification` 表，返回 `{ valid, email/maskedEmail }`。
  - 约束：不在 URL 中传明文邮箱；token 无效/过期时直接提示并引导用户重新申请重置链接。

- [ ] Better Auth 显式指定客户端 IP 头优先级（暂不实现）。
  - 目的：避免出现 `Rate limiting skipped: could not determine client IP address` 告警，确保限流策略稳定生效。
  - 计划：在 auth 配置中增加 `advanced.ipAddress.ipAddressHeaders`，优先 `cf-connecting-ip`，其次 `x-real-ip`、`x-forwarded-for`。

- [ ] 未来将邮箱验证流程切换为 Better Auth 中转校验 URL 方案（暂不实现）。
  - 目标：邮件中的链接先由后端校验 token，再跳转前端页面，统一处理无效/过期场景。
  - 备注：完成后可复用同一思路优化 reset-password 的链接体验与错误提示一致性。
