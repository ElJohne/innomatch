import "server-only";
import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    nodeScrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 14 || password.length > 200)
    throw new Error("PASSWORD_LENGTH");
  const salt = randomBytes(24).toString("hex");
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded?: string) {
  const valid = /^scrypt-v1\$[a-f0-9]{48}\$[a-f0-9]{128}$/.test(encoded ?? "");
  const [, salt, digest] = valid
    ? encoded!.split("$")
    : ["", "0".repeat(48), "0".repeat(128)];
  const key = await derive(password, salt);
  return valid && timingSafeEqual(key, Buffer.from(digest, "hex"));
}
