import type { Metadata } from 'next';
import { WalletClient } from './page.client';

export const metadata: Metadata = {
  title: 'Wallet | Mint',
};

export default function WalletPage() {
  return <WalletClient />;
}
