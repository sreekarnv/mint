import { sign, verify, type JwtPayload } from 'jsonwebtoken';

export function signToken(id: string, email: string): string {
	return sign({ id, email }, 'token', { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
	return verify(token, 'token') as JwtPayload;
}
