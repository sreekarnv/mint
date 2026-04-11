import type { Metadata } from 'next';
import { ForgotPasswordClient } from './page.client';

export const metadata: Metadata = {
  title: 'Reset Password | Mint',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
