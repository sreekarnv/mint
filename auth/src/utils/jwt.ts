import fs from 'fs';
import path from 'path';
import { sign, verify, type JwtPayload } from 'jsonwebtoken';

const privateKey = fs.readFileSync(path.resolve(Bun.env.JWT_PRIVATE_KEY_PATH));
const publicKey = fs.readFileSync(path.resolve(Bun.env.JWT_PUBLIC_KEY_PATH));

export function signToken(id: string, email: string): string {
	// @ts-expect-error "Sign Token Private Key Type Error"
	return sign({ id, email }, privateKey, {
		algorithm: 'RS256',
		expiresIn: process.env.JWT_EXPIRES_IN || '15m',
	});
}

export function verifyToken(token: string): JwtPayload {
	return verify(token, publicKey, { algorithms: ['RS256'] }) as any;
}
