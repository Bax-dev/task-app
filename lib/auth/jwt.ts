import { SignJWT, jwtVerify } from 'jose';
import { ACCESS_TOKEN_MAX_AGE } from './constants';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export { ACCESS_TOKEN_MAX_AGE } from './constants';

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
