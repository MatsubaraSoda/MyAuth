本文件记录本项目**初始化搭建**时实际执行过的命令，以及**执行成功**时终端中的对应输出，便于日后复现或回忆操作顺序。命令提示符统一写作 `MyAuth>`；各次会话之间用 `---` 分隔，每段输入与输出包在 `bash` 代码块中。其中不包含失败重试、误输入等与有效搭建无关的片段。

---

首先，使用 Hono 官方脚手架初始化一个基于 Cloudflare Workers 的无服务器架构项目模板。

```bash
MyAuth> npm create hono@latest
Need to install the following packages:
create-hono@0.19.4
Ok to proceed? (y) y


> npx
> create-hono

create-hono version 0.19.4
✔ Target directory .
✔ Which template do you want to use? cloudflare-workers
✔ Do you want to install project dependencies? Yes
✔ Which package manager do you want to use? npm
✔ Cloning the template
✔ Installing project dependencies
🎉 Copied project files
```

---

启动本地开发服务器，测试初始模板环境是否能够正常运行并响应基础的路由请求。

```bash
MyAuth> npm run dev

> dev
> wrangler dev


 ⛅️ wrangler 4.81.1
───────────────────
╭──────────────────────────────────────────────────────────────────────╮
│  [b] open a browser [d] open devtools [c] clear console [x] to exit  │
╰──────────────────────────────────────────────────────────────────────╯
⎔ Starting local server...
[wrangler:info] Ready on http://127.0.0.1:8787
[wrangler:info] GET / 200 OK (8ms)
[wrangler:info] GET /favicon.ico 404 Not Found (3ms)
⎔ Shutting down local server...

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
```

---

准备对接云端基础设施，使用 Wrangler 命令行工具通过浏览器授权登录个人的 Cloudflare 账号。

```bash
MyAuth> npx wrangler login

 ⛅️ wrangler 4.81.1
───────────────────
Attempting to login via OAuth...
Opening a link in your default browser: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20ai-search%3Awrite%20ai-search%3Arun%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20containers%3Awrite%20cloudchamber%3Awrite%20connectivity%3Aadmin%20email_routing%3Awrite%20email_sending%3Awrite%20offline_access&state=s2V1s60tggvIDynjopzrfs-vnrRS-oYq&code_challenge=bUea-MIEaAiXz12WjM-Qx57t2RjcfV3YRpeyPIcAH98&code_challenge_method=S256
Successfully logged in.
```

---

在 Cloudflare 边缘计算平台上创建一个名为 auth-db 的 D1 数据库实例，并获取绑定该数据库所需的环境变量配置。

```bash
MyAuth> npx wrangler d1 create auth-db

 ⛅️ wrangler 4.81.1
───────────────────
✅ Successfully created DB 'auth-db' in region WNAM
Created your new D1 database.

To access your new D1 Database in your Worker, add the following snippet to your configuration file:
{
  "d1_databases": [
    {
      "binding": "auth_db",
      "database_name": "auth-db",
      "database_id": "3304c09e-d68b-4640-94d9-868d96114bb1"
    }
  ]
}
√ Would you like Wrangler to add it on your behalf? ... yes
√ What binding name would you like to use? ... DB
√ For local dev, do you want to connect to the remote resource instead of a local resource? ... no
```

---

安装实现身份验证体系所需的核心业务依赖模块，其中 better-auth 提供身份验证引擎，drizzle-orm 提供数据库操作映射工具。

```bash
MyAuth> npm install better-auth drizzle-orm

added 24 packages, and audited 115 packages in 2m

34 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

---

安装数据库架构管理与迁移工具 drizzle-kit，作为开发环境依赖，用于后续生成 SQL 脚本。

```bash
MyAuth> npm install -D drizzle-kit
npm warn deprecated @esbuild-kit/core-utils@3.3.2: Merged into tsx: https://tsx.is
npm warn deprecated @esbuild-kit/esm-loader@2.6.5: Merged into tsx: https://tsx.is

added 60 packages, and audited 175 packages in 13s

36 packages are looking for funding
  run `npm fund` for details

4 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```

---

新建 `src/auth.ts` ，进行 better-auth 的初步配置与初始化：

```TypeScript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

// 1. 【战时引擎】供 Hono 运行时调用的工厂函数
// 每次有用户请求登录时，我们会把当前环境的 D1 数据库连接传进来
export function createAuth(env: { DB: any }) {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite", // Cloudflare D1 底层是 SQLite
    }),
    emailAndPassword: {
      enabled: true, // 核心：开启邮箱和密码登录功能
    },
  });
}

// 2. 【设计图纸】仅供 CLI 工具生成表结构使用的静态配置
// CLI 在本地运行，连不上云端数据库，所以我们丢一个空对象骗过它，它只需读取上面的 provider 和插件配置即可
export const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

---

借助 better-auth 的命令行工具，基于上一步的静态配置自动生成标准的认证系统表结构，并将其移动至正确的源码目录。

```bash
MyAuth> npx @better-auth/cli generate
Need to install the following packages:
@better-auth/cli@1.4.21
Ok to proceed? (y) y

npm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.
2026-04-12T16:54:50.665Z WARN [Better Auth]: [better-auth] Base URL could not be determined. Please set a valid base URL using the baseURL config option or the BETTER_AUTH_URL environment variable. Without this, callbacks and redirects may not work correctly.
√ Do you want to generate the schema to ./auth-schema.ts? ... yes
🚀 Schema was generated successfully!
```

```bash
MyAuth> mv ./auth-schema.ts ./src/schema.ts
```

---

新建 `drizzle.config.ts` 文件，配置 Drizzle 的架构图纸路径，并生成对应的 SQL 迁移脚本文件。

```TypeScript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts', // 刚才通过 better-auth 生成的表结构文件路径
  out: './drizzle',          // 等会儿生成的 SQL 脚本存放的目录
  dialect: 'sqlite',         // Cloudflare D1 使用 SQLite 语法
});
```

```bash
> npx drizzle-kit generate
No config path provided, using default 'drizzle.config.ts'
Reading config file 'E:\WorkSpace\Projects\MyAuth\drizzle.config.ts'
4 tables
account 13 columns 1 indexes 1 fks
session 8 columns 2 indexes 1 fks
user 7 columns 1 indexes 0 fks
verification 6 columns 1 indexes 0 fks

[✓] Your SQL migration file ➜ drizzle\0000_amazing_unicorn.sql 🚀
```

---

由于 Drizzle 与 Wrangler 对迁移脚本文件夹的默认命名存在偏差，在 `wrangler.jsonc` 中指定路径，随后执行命令将表结构写入本地的 D1 沙箱数据库中。

在 `wrangler.jsonc` 中，将：

```jsonc
  "d1_databases": [
		{
			"binding": "DB",
			"database_name": "auth-db",
			"database_id": "3304c09e-d68b-4640-94d9-868d96114bb1"
		}
```

修改为：

```jsonc
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "auth-db",
			"database_id": "3304c09e-d68b-4640-94d9-868d96114bb1",
			"migrations_dir": "drizzle"
		}
```

然后终端执行：

```bash
MyAuth> npx wrangler d1 migrations apply auth-db --local

 ⛅️ wrangler 4.81.1
───────────────────
Resource location: local 

Use --remote if you want to access the remote instance.

Migrations to be applied:
┌──────────────────────────┐
│ name                     │
├──────────────────────────┤
│ 0000_amazing_unicorn.sql │
└──────────────────────────┘
√ About to apply 1 migration(s)
Your database may not be available to serve requests during the migration, continue? ... yes
🌀 Executing on local database auth-db (3304c09e-d68b-4640-94d9-868d96114bb1) from .wrangler\state\v3\d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 10 commands executed successfully.
┌──────────────────────────┬────────┐
│ name                     │ status │
├──────────────────────────┼────────┤
│ 0000_amazing_unicorn.sql │ ✅     │
└──────────────────────────┴────────┘
```

---

整合路由架构与类型定义。修改 `/src/index.ts` 为新的微服务架构代码，将认证相关的请求透传给 better-auth 引擎。

```TypeScript
import { Hono } from 'hono';
import { createAuth } from './auth';

// 1. 定义 Cloudflare 的环境变量类型，享受完美的 TypeScript 提示
type Bindings = {
  DB: D1Database;
};

// 2. 实例化 Hono，并注入环境变量类型
const app = new Hono<{ Bindings: Bindings }>();

// 3. 根目录测试路由：用于检测微服务是否存活
app.get('/', (c) => {
  return c.text('Hello Hono! Auth Microservice is running 🚀');
});

// 4. 【核心路由】将所有与认证相关的请求，全部拦截并交给 better-auth 处理
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  // 唤醒我们在 auth.ts 中写好的引擎，并把数据库连接 (c.env) 喂给它
  const auth = createAuth(c.env);
  
  // Hono 非常轻量，c.req.raw 就是最标准的 Web Request 对象
  // better-auth 底层完全基于 Web 标准，所以可以直接无缝接管
  return auth.handler(c.req.raw);
});

export default app;
```

为了解决上述代码中 `D1Database` 出现的类型缺失报错，安装专属的 Cloudflare Worker 类型定义依赖。

```bash
MyAuth> npm install -D @cloudflare/workers-types

added 1 package, and audited 176 packages in 6s

36 packages are looking for funding
  run `npm fund` for details

4 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

尝试启动带有完整认证逻辑的本地服务，虽然服务成功拉起，但终端暴露了环境兼容性和基础路径未配置的警告信息。

```bash
> npm run dev

> dev
> wrangler dev


 ⛅️ wrangler 4.81.1
───────────────────
Your Worker has access to the following bindings:
Binding               Resource         Mode
env.DB (auth-db)      D1 Database      local

╭──────────────────────────────────────────────────────────────────────╮
│  [b] open a browser [d] open devtools [c] clear console [x] to exit  │
╰──────────────────────────────────────────────────────────────────────╯
▲ [WARNING] The package "node:async_hooks" wasn't found on the file system but is built into node.

  Your Worker may throw errors at runtime unless you enable the "nodejs_compat" compatibility flag.
  Refer to https://developers.cloudflare.com/workers/runtime-apis/nodejs/ for more details. Imported
  from:
   - node_modules\@better-auth\core\dist\async_hooks\index.mjs


⎔ Starting local server...
▲ [WARNING] [better-auth] Warning: AsyncLocalStorage is not available in this environment. Some features may not work as expected.


▲ [WARNING] [better-auth] Please read more about this warning at https://better-auth.com/docs/installation#mount-handler


▲ [WARNING] [better-auth] If you are using Cloudflare Workers, please see: https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag


▲ [WARNING] 2026-04-13T03:15:30.150Z WARN [Better Auth]: [better-auth] Base URL could not be determined. Please set a valid base URL using the baseURL config option or the BETTER_AUTH_URL environment variable. Without this, callbacks and redirects may not work correctly.


[wrangler:info] Ready on http://127.0.0.1:8787
[wrangler:info] GET / 200 OK (6ms)
[wrangler:info] GET /favicon.ico 404 Not Found (2ms)
```

---

针对 `npm run dev` 时出现的 `nodejs_compat` 与 `Base URL` 警告，修改 `wrangler.jsonc` 补充全局兼容性标记与环境变量，使警告消除。

```TypeScript
// 1. 开启 Node.js 兼容模式
  "compatibility_flags": [
    "nodejs_compat"
  ],

  // 2. 注入全局环境变量，告诉 better-auth 当前的运行地址
  "vars": {
    "BETTER_AUTH_URL": "http://localhost:8787"
  },
```

```bash
\MyAuth> npm run dev

> dev
> wrangler dev


 ⛅️ wrangler 4.81.1
───────────────────
Your Worker has access to the following bindings:
Binding                                            Resource                  Mode
env.DB (auth-db)                                   D1 Database               local
env.BETTER_AUTH_URL ("http://localhost:8787")      Environment Variable      local

╭──────────────────────────────────────────────────────────────────────╮
│  [b] open a browser [d] open devtools [c] clear console [x] to exit  │
╰──────────────────────────────────────────────────────────────────────╯
⎔ Starting local server...
[wrangler:info] Ready on http://127.0.0.1:8787
[wrangler:info] GET / 200 OK (5ms)
⎔ Shutting down local server...
```

---

修复在进行接口注册测试时出现的内部 500 错误。由于数据库适配器找不到具体表结构，需将 schema 文件显式引入并传递给 `drizzleAdapter`。

在 `/src/auth.ts` 中，在文件顶部增加 `schema` 的导入，并在**两处** `drizzleAdapter(..., { ... })` 的第二个参数对象里各加入一行 `schema: schema`（分别对应运行时工厂与 CLI 静态配置）：

```TypeScript
import * as schema from "./schema";
// ... 其余 import 不变 ...

export function createAuth(env: { DB: any }) {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: schema,
    }),
    // ...
  });
}

export const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: "sqlite",
    schema: schema,
  }),
  // ...
});
```

---

为了本地能够直接使用图形化面板管理沙箱数据，需指明本地底层 SQLite 文件的路径，并安装纯 JavaScript 版本的 SQLite 驱动以规避 Windows 平台的 C++ 编译异常。

**本次变动**：在 `drizzle.config.ts` 的 `defineConfig` 里**仅新增** `dbCredentials` 一段，让 **Drizzle Kit** 连到本机 Wrangler 写入的 **本地 D1**（SQLite 位于 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`；文件名由 miniflare 生成，**换机或清空 `.wrangler` 后可能变化**，需重新对照目录里的 `.sqlite` 更新 `url`）。

```TypeScript
export default defineConfig({
  // ...
  dbCredentials: {
    // 将数据库路径指派给 Drizzle
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4c408efaefdfd07587d53e000390c688ea0e0f379b3bc67193d48b6b20a69754.sqlite',
  },
});
```

```bash
MyAuth> npx drizzle-kit studio
No config path provided, using default 'drizzle.config.ts'
Reading config file 'E:\WorkSpace\Projects\MyAuth\drizzle.config.ts'
Please install either 'better-sqlite3' or '@libsql/client' for Drizzle Kit to connect to SQLite databases
```

```bash
MyAuth> npm install -D @libsql/client
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

added 32 packages, and audited 208 packages in 12s

39 packages are looking for funding
  run `npm fund` for details

4 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

```bash
MyAuth> npx drizzle-kit studio
No config path provided, using default 'drizzle.config.ts'
Reading config file 'E:\WorkSpace\Projects\MyAuth\drizzle.config.ts'

 Warning  Drizzle Studio is currently in Beta. If you find anything that is not working as expected or should be improved, feel free to create an issue on GitHub: https://github.com/drizzle-team/drizzle-kit-mirror/issues/new or write to us on Discord: https://discord.gg/WcRKz2FFxN

Drizzle Studio is up and running on https://local.drizzle.studio
```

---

为支持前后端分离架构或其它非浏览器终端发起的接口请求，必须激活 Token 头解析功能，打破默认的仅限 Cookie 校验机制。

**本次变动**：在 `/src/auth.ts` 中启用 **Bearer** 插件：顶部增加 `import { bearer } from "better-auth/plugins"`；在 **`createAuth`** 与 **`auth`** 两处 `betterAuth({ ... })` 的**同一层级**各增加 `plugins: [bearer()]`（与 `database`、`emailAndPassword` 等并列）。下方 `// ...` 表示其余字段保持与当前文件一致。

```TypeScript
import { bearer } from "better-auth/plugins";
// ... 其余 import ...

export function createAuth(env: { DB: any }) {
  return betterAuth({
    // ...
    plugins: [bearer()],
  });
}

export const auth = betterAuth({
  // ...
  plugins: [bearer()],
});
```

```bash
MyAuth> npx drizzle-kit studio
No config path provided, using default 'drizzle.config.ts'
Reading config file 'E:\WorkSpace\Projects\MyAuth\drizzle.config.ts'

 Warning  Drizzle Studio is currently in Beta. If you find anything that is not working as expected or should be improved, feel free to create an issue on GitHub: https://github.com/drizzle-team/drizzle-kit-mirror/issues/new or write to us on Discord: https://discord.gg/WcRKz2FFxN

Drizzle Studio is up and running on https://local.drizzle.studio
```

---

```bash
MyAuth> npx wrangler d1 migrations apply auth-db --remote

 ⛅️ wrangler 4.81.1
───────────────────
Resource location: remote 

Migrations to be applied:
┌──────────────────────────┐
│ name                     │
├──────────────────────────┤
│ 0000_amazing_unicorn.sql │
└──────────────────────────┘
√ About to apply 1 migration(s)
Your database may not be available to serve requests during the migration, continue? ... yes
🌀 Executing on remote database auth-db (3304c09e-d68b-4640-94d9-868d96114bb1):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 10 commands in 2.60ms
┌──────────────────────────┬────────┐
│ name                     │ status │
├──────────────────────────┼────────┤
│ 0000_amazing_unicorn.sql │ ✅     │
└──────────────────────────┴────────┘
```

新建 `.dev.vars` ：

```txt
BETTER_AUTH_SECRET=
```

```bash
MyAuth> npx wrangler secret put BETTER_AUTH_SECRET

 ⛅️ wrangler 4.81.1
───────────────────
√ Enter a secret value: ... ********************************
🌀 Creating the secret for the Worker "myauth"
√ There doesn't seem to be a Worker called "myauth". Do you want to create a new Worker with that name and add secrets to it? ... yes
🌀 Creating new Worker "myauth"...
✨ Success! Uploaded secret BETTER_AUTH_SECRET
```

```bash
MyAuth> npm run deploy

> deploy
> wrangler deploy --minify


 ⛅️ wrangler 4.81.1
───────────────────
Total Upload: 878.27 KiB / gzip: 229.22 KiB
Worker Startup Time: 92 ms
Your Worker has access to the following bindings:
Binding                                            Resource
env.DB (auth-db)                                   D1 Database
env.BETTER_AUTH_URL ("http://localhost:8787")      Environment Variable

Uploaded myauth (6.47 sec)
▲ [WARNING] Because 'workers_dev' is not in your Wrangler file, it will be enabled for this deployment by default.

  To override this setting, you can disable workers.dev by explicitly setting 'workers_dev = false'
  in your Wrangler file.


▲ [WARNING] Because your 'workers.dev' route is enabled and your 'preview_urls' setting is not in your Wrangler file, Preview URLs will be enabled for this deployment by default.

  To override this setting, you can disable Preview URLs by explicitly setting 'preview_urls =
  false' in your Wrangler file.


Deployed myauth triggers (2.19 sec)
  https://myauth.matsubarasoda.workers.dev
Current Version ID: cfab5dc5-7a62-42df-9de5-9b8875ea3750
```

---

在 `wrangler.jsonc` 中注释掉 `vars` ：

```jsonc
	// "vars": {
	//   "BETTER_AUTH_URL": "http://localhost:8787"
	// },
```

```bash
MyAuth> npm run deploy

> deploy
> wrangler deploy --minify


 ⛅️ wrangler 4.81.1
───────────────────
Total Upload: 878.27 KiB / gzip: 229.22 KiB
Worker Startup Time: 79 ms
Your Worker has access to the following bindings:
Binding               Resource
env.DB (auth-db)      D1 Database

Uploaded myauth (6.90 sec)
Deployed myauth triggers (2.30 sec)
  https://myauth.matsubarasoda.workers.dev
Current Version ID: a3625f0e-d7c5-49e9-ad95-a17ab904cfcd
```

```bash
MyAuth> npx wrangler secret put BETTER_AUTH_URL

 ⛅️ wrangler 4.81.1
───────────────────
√ Enter a secret value: ... *****************************************
🌀 Creating the secret for the Worker "myauth"
✨ Success! Uploaded secret BETTER_AUTH_URL
```

```bash
MyAuth> npx wrangler secret list
[
  {
    "name": "BETTER_AUTH_SECRET",
    "type": "secret_text"
  },
  {
    "name": "BETTER_AUTH_URL",
    "type": "secret_text"
  }
]
```

```bash
MyAuth> npm run deploy

> deploy
> wrangler deploy --minify


 ⛅️ wrangler 4.81.1
───────────────────
Total Upload: 878.27 KiB / gzip: 229.22 KiB
Worker Startup Time: 86 ms
Your Worker has access to the following bindings:
Binding               Resource
env.DB (auth-db)      D1 Database

Uploaded myauth (6.16 sec)
Deployed myauth triggers (1.23 sec)
  https://myauth.matsubarasoda.workers.dev
Current Version ID: b4037cdf-126d-49c9-86d1-ee3014a0f338
```

---


