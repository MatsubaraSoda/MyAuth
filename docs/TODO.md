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

## Profile API 接入清单（按 section）

- [ ] Section 1 - Profile（头像 + 昵称）
  - 接入资料查询：进入页面时拉取用户基础资料（`name`、`image`、`email`）并回填到表单。
  - 接入昵称更新：保存按钮调用更新用户资料接口；成功后刷新会话，失败时展示后端错误。
  - 接入头像上传/删除：为“上传头像 / 删除头像”菜单接入后端接口（建议提供上传凭证 + 更新用户头像 URL 的闭环）。
  - 后端配合：在 `src/auth.runtime.ts` 对应 auth 配置中确认可更新字段与校验规则（昵称长度、头像 URL 白名单等）。

- [ ] Section 2 - Change email（修改邮箱）
  - 接入“发起改绑邮箱”接口：提交新邮箱后触发验证邮件，进入 pending 状态。
  - 接入“确认改绑”流程：新增 token 校验与确认更新接口，前端根据结果提示成功/失效/过期。
  - 页面状态处理：展示当前邮箱、新邮箱待确认状态、可重发验证邮件与取消流程。
  - 后端配合：在 `src/auth.runtime.ts` 增加邮件改绑相关能力（发信、token 存储与校验、防重复/限流）。

- [ ] Section 3 - Manage accounts（账户管理 / 登出）
  - 校验并统一当前登出能力：按钮调用后端 sign-out 接口，成功后清理本地状态并跳转登录页。
  - 可选扩展：支持“登出当前设备”与“登出所有设备”区分，为后续 sessions section 复用。

- [ ] Section 4 - Change password（修改密码）
  - 接入密码修改接口：提交 `currentPassword`、`newPassword`、`confirmPassword`，前端先做一致性校验。
  - 增加成功后的会话策略：可配置“仅当前会话保留”或“强制其他会话下线”。
  - 错误映射：将后端错误（旧密码错误、弱密码、不满足策略）转换为字段级提示。
  - 后端配合：在 `src/auth.runtime.ts` 补充密码策略与修改密码动作的安全校验（限流、最小复杂度）。

- [ ] Section 5 - Linked accounts（第三方账号绑定）
  - 接入已绑定列表查询：页面真实展示 provider 绑定状态（如 GitHub 已绑定/未绑定）。
  - 接入绑定流程：点击“Link”发起 OAuth 绑定并在回调后刷新列表。
  - 接入解绑流程：点击“Unlink”调用解绑接口，处理“最后一种登录方式禁止解绑”等约束。
  - 后端配合：在 `src/auth.runtime.ts` 确认 social provider 的 link/unlink 能力、回调安全校验和冲突处理。

- [ ] Section 6 - Active sessions（活跃会话）
  - 接入会话列表查询：显示设备名、最近活跃时间、是否当前会话。
  - 接入单会话撤销：对指定 session 执行 revoke 并刷新列表。
  - 接入“当前会话登出”：当前设备触发后需本地清理并跳转登录。
  - 后端配合：在 `src/auth.runtime.ts` 提供 session 管理接口（list/revoke/revokeOthers）与审计日志。

- [ ] Section 7 - Danger zone（危险操作 / 删除账号）
  - 接入删除账号前确认流程：二次确认 + 密码校验或邮件验证码校验。
  - 接入账号删除执行接口：删除后注销所有会话并跳转到安全落地页。
  - 数据一致性处理：定义软删除/硬删除策略，以及关联数据清理或匿名化规则。
  - 后端配合：在 `src/auth.runtime.ts` 增加账号删除动作与权限校验、冷静期或可恢复策略（如需要）。
