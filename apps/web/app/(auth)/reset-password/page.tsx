import type { Metadata } from 'next';
import { ResetPasswordClient } from './page.client';

export const metadata: Metadata = {
  title: 'Set New Password | Mint',
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
