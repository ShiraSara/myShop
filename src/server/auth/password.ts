import bcrypt from "bcryptjs";

const ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | null = null;
/** Burns the same CPU time as a real check so login timing doesn't reveal which emails exist. */
export async function fakeVerify(password: string) {
  dummyHash ??= hashPassword("timing-safe-dummy-password");
  await bcrypt.compare(password, await dummyHash);
  return false;
}
