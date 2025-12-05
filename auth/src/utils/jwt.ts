import { createPublicKey } from "crypto";
import fs from "fs";
import { type KeyObject, importPKCS8, SignJWT, jwtVerify, exportJWK, JWTVerifyResult, JWTPayload } from "jose";
import path from "path";
import { env } from "~/env";
import { UserResType } from "~/schemas/auth.schema";

function getPublicPemPath(): string {
  return path.join(__dirname, "..", "..", "keys", "public.pem");
}

function getPrivatePemPath(): string {
  return path.join(__dirname, "..", "..", "keys", "private.pem");
}

async function getPrivateKey(): Promise<KeyObject> {
  const privatePemPath = getPrivatePemPath();
  const privatePem = fs.readFileSync(privatePemPath, "utf8");
  return await importPKCS8(privatePem, "RS256");
}

export function getPublicKey(): KeyObject {
  const publicPemPath = getPublicPemPath();
  const publicPem = fs.readFileSync(publicPemPath, "utf8");
  return createPublicKey(publicPem);
}

export async function signAccessToken(user: UserResType): Promise<string> {
  const privateKey = await getPrivateKey();
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "RS256", kid: "main-key" })
    .setIssuedAt()
    .setIssuer(env.JWT_ISS)
    .setAudience(env.JWT_AUD.split(" "))
    .setExpirationTime("1d")
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<JWTVerifyResult<JWTPayload & { user: UserResType }>> {
  const publicKey = getPublicKey();
  const jwk = await exportJWK(publicKey);

  return await jwtVerify(token, jwk, { algorithms: ["RS256"] });
}
