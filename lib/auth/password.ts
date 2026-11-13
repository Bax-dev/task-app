import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | undefined;

/** Burns the same bcrypt time as a real check, so unknown emails can't be told apart by response time. */
export async function verifyPasswordAgainstNothing(password: string): Promise<false> {
  dummyHash ??= hashPassword('dummy-password-for-timing');
  await bcrypt.compare(password, await dummyHash);
  return false;
}
