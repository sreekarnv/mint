import type { Metadata } from 'next';
import { TransactionsClient } from './page.client';

export const metadata: Metadata = {
  title: 'Transactions | Mint',
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
