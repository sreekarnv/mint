import type { Metadata } from 'next';
import { SocialClient } from './page.client';

export const metadata: Metadata = {
  title: 'Social | Mint',
};

export default function SocialPage() {
  return <SocialClient />;
}
