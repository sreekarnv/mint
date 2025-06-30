import fs from 'fs';
import path from 'path';
import { verify, type JwtPayload } from 'jsonwebtoken';

const publicKey = fs.readFileSync(path.resolve(Bun.env.JWT_PUBLIC_KEY_PATH));

export function verifyToken(token: string): JwtPayload {
	return verify(token, publicKey, { algorithms: ['RS256'] }) as any;
}
