import type { Metadata } from 'next';
import { KycClient } from './page.client';

export const metadata: Metadata = {
  title: 'Identity Verification | Mint',
};

export default function KycPage() {
  return <KycClient />;
}
