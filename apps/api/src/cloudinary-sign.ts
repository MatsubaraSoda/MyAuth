/**
 * Cloudinary Admin / Upload API 签名：参数字典按 key 排序后 `k=v&...`，再拼接 api_secret，SHA-1 hex。
 * @see https://cloudinary.com/documentation/authentication_signatures
 */

export const AVATAR_EAGER = 'c_fill,w_200,h_200,g_face,f_auto,q_auto';

export function avatarPublicId(userId: string): string {
  return `avatars/${userId}`;
}

export async function sha1Hex(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(plain));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function cloudinaryApiSignature(
  params: Record<string, string>,
  apiSecret: string,
): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return sha1Hex(sorted + apiSecret);
}

export type UploadSignResult = {
  timestamp: string;
  public_id: string;
  eager: string;
  signature: string;
};

export async function signImageUpload(
  userId: string,
  apiSecret: string,
): Promise<UploadSignResult> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const public_id = avatarPublicId(userId);
  const params: Record<string, string> = {
    eager: AVATAR_EAGER,
    public_id,
    timestamp,
  };
  const signature = await cloudinaryApiSignature(params, apiSecret);
  return { timestamp, public_id, eager: AVATAR_EAGER, signature };
}

export type DestroySignResult = {
  timestamp: string;
  signature: string;
};

export async function signImageDestroy(
  publicId: string,
  apiSecret: string,
): Promise<DestroySignResult> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params: Record<string, string> = {
    public_id: publicId,
    timestamp,
  };
  const signature = await cloudinaryApiSignature(params, apiSecret);
  return { timestamp, signature };
}
