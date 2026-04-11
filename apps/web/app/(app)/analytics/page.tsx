import type { Metadata } from 'next';
import { AnalyticsClient } from './page.client';

export const metadata: Metadata = {
  title: 'Analytics | Mint',
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
