import type { Metadata } from 'next';
import { RegisterClient } from './page.client';

export const metadata: Metadata = {
  title: 'Create Account | Mint',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
