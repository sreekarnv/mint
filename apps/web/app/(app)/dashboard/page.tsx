import type { Metadata } from 'next';
import { DashboardClient } from './page.client';

export const metadata: Metadata = {
  title: 'Dashboard | Mint',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
