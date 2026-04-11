import type { Metadata } from 'next';
import { VerifyEmailClient } from './page.client';

export const metadata: Metadata = {
  title: 'Verify Email | Mint',
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
