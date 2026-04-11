import type { Metadata } from 'next';
import { LoginClient } from './page.client';

export const metadata: Metadata = {
  title: 'Sign In | Mint',
};

export default function LoginPage() {
  return <LoginClient />;
}
