import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "~/env";

const JWKS = createRemoteJWKSet(new URL(env.JWKS_ENDPOINT));

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: env.JWT_ISS,
    audience: env.JWT_AUD,
    algorithms: ["RS256"],
  });

  return payload;
}
