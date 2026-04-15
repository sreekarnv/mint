import { BadRequestException } from '@nestjs/common';
import { isIPv4, isIPv6 } from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
]);

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a >= 224 && a <= 255)
  );
}

function ipv4MappedToDecimal(after: string): string | null {
  const parts = after.split(':');
  if (parts.length !== 2) return null;
  const hi = parseInt(parts[0].padStart(4, '0'), 16);
  const lo = parseInt(parts[1].padStart(4, '0'), 16);
  if (isNaN(hi) || isNaN(lo)) return null;
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (lower.startsWith('::ffff:')) {
    const ipv4 = ipv4MappedToDecimal(lower.slice(7));
    if (ipv4) return isBlockedIpv4(ipv4);
  }

  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||
    lower.startsWith('ff')
  );
}

export function validateWebhookUrl(url: string): void {
  if (!url.startsWith('https://')) {
    throw new BadRequestException('Webhook URL must use HTTPS');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new BadRequestException(
      'Webhook URL targets a disallowed destination',
    );
  }

  if (
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  ) {
    throw new BadRequestException(
      'Webhook URL targets a disallowed destination',
    );
  }

  const rawHost = hostname.replace(/^\[|\]$/g, '');

  if (isIPv4(rawHost) && isBlockedIpv4(rawHost)) {
    throw new BadRequestException(
      'Webhook URL targets a disallowed destination',
    );
  }

  if (isIPv6(rawHost) && isBlockedIpv6(rawHost)) {
    throw new BadRequestException(
      'Webhook URL targets a disallowed destination',
    );
  }
}
