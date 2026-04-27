import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth } from './auth.runtime';
import { avatarPublicId, signImageDestroy, signImageUpload } from './cloudinary-sign';

const SET_PASSWORD_CONFLICT =
  'User already has a password. Please use change-password API.';

type AccountRow = { providerId?: string };

/** 与前端 listAccounts 解析逻辑一致（数组或 { data, error }）。 */
function parseAccountsPayload(result: unknown): AccountRow[] | undefined {
  if (Array.isArray(result)) {
    return result as AccountRow[];
  }
  if (result && typeof result === 'object') {
    const r = result as {
      data?: unknown;
      error?: { message?: string };
    };
    if (r.error?.message) return undefined;
    const d = r.data;
    if (Array.isArray(d)) return d as AccountRow[];
  }
  return undefined;
}

type Bindings = {
  DB: D1Database;
  /** OAuth 回调与签发链接所依据的站点根 URL。本地应与 Vite 同源，例如 http://localhost:5173 */
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
  DEV_RESET_LINK?: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const PROD_ORIGIN = 'https://account.matsubarasoda.com';
const LOCAL_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
let runtimeAuth: ReturnType<typeof createAuth> | null = null;

function getAuth(bindings: Bindings): ReturnType<typeof createAuth> {
  if (!runtimeAuth) {
    runtimeAuth = createAuth(bindings);
  }
  return runtimeAuth;
}

function resolveCorsOrigin(origin: string | undefined, c: { req: { url: string } }) {
  const requestHost = new URL(c.req.url).hostname;
  const isLocalRuntime = requestHost === 'localhost' || requestHost === '127.0.0.1';

  if (origin === PROD_ORIGIN) return origin;
  if (isLocalRuntime && origin && LOCAL_ORIGINS.has(origin)) return origin;

  return '';
}

const corsShared = {
  origin: resolveCorsOrigin,
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(
  '/api/auth/*',
  cors({
    ...corsShared,
    allowMethods: ['POST', 'GET', 'OPTIONS'],
  }),
);

app.use(
  '/api/cloudinary/*',
  cors({
    ...corsShared,
    allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
  }),
);

app.use(
  '/api/account/*',
  cors({
    ...corsShared,
    allowMethods: ['POST', 'OPTIONS'],
  }),
);

app.get('/api/health', (c) => {
  return c.json({ ok: true, service: 'auth', timestamp: Date.now() });
});

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/**', (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.post('/api/account/set-password', async (c) => {
  let body: { newPassword?: string; confirmPassword?: string };
  try {
    body = await c.req.json<{ newPassword?: string; confirmPassword?: string }>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const newPassword = body.newPassword?.trim();
  const confirmPassword = body.confirmPassword?.trim();
  if (!newPassword) {
    return c.json({ error: 'newPassword is required' }, 400);
  }
  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    return c.json({ error: 'Passwords do not match' }, 400);
  }

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.session || !session?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let rawList: unknown;
  try {
    rawList = await auth.api.listUserAccounts({
      headers: c.req.raw.headers,
    });
  } catch {
    return c.json({ error: 'Failed to load linked accounts' }, 500);
  }

  const accounts = parseAccountsPayload(rawList);
  if (accounts === undefined) {
    return c.json({ error: 'Failed to verify account state' }, 500);
  }

  const hasCredentialAccount = accounts.some(
    (a) => a?.providerId === 'credential',
  );
  if (hasCredentialAccount) {
    return c.json({ error: SET_PASSWORD_CONFLICT }, 400);
  }

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: c.req.raw.headers,
    });
  } catch (e) {
    const message =
      typeof e === 'object' &&
      e !== null &&
      'message' in e &&
      typeof (e as { message: unknown }).message === 'string'
        ? (e as { message: string }).message
        : 'Failed to set password';
    return c.json({ error: message }, 400);
  }

  return c.json({ ok: true });
});

app.post('/api/cloudinary/upload-signature', async (c) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = c.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return c.json({ error: 'Cloudinary is not configured' }, 503);
  }

  const signed = await signImageUpload(session.user.id, CLOUDINARY_API_SECRET);

  return c.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    signature: signed.signature,
    timestamp: signed.timestamp,
    publicId: signed.public_id,
    eager: signed.eager,
  });
});

app.delete('/api/cloudinary/avatar', async (c) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = c.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return c.json({ error: 'Cloudinary is not configured' }, 503);
  }

  const publicId = avatarPublicId(session.user.id);
  const { signature, timestamp } = await signImageDestroy(publicId, CLOUDINARY_API_SECRET);

  const body = new URLSearchParams({
    public_id: publicId,
    signature,
    timestamp,
    api_key: CLOUDINARY_API_KEY,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    },
  );

  let payload: { result?: string; error?: { message?: string } } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    /* empty */
  }

  if (!res.ok) {
    return c.json(
      { error: payload.error?.message ?? 'Cloudinary destroy request failed' },
      502,
    );
  }

  const r = payload.result;
  if (r !== 'ok' && r !== 'not found') {
    return c.json({ error: payload.error?.message ?? 'Unexpected destroy response' }, 502);
  }

  return c.body(null, 204);
});

export default app;
