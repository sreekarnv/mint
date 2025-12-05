import { exportJWK } from "jose";
import { getPublicKey } from "~/utils/jwt";

export async function generateJWKS() {
  const publicKey = getPublicKey();
  const jwk = await exportJWK(publicKey);

  return {
    keys: [
      {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: "main-key",
      },
    ],
  };
}
