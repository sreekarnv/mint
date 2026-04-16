jest.mock('geoip-lite', () => ({ lookup: jest.fn() }));

import * as geoip from 'geoip-lite';
import { ScoreRequest } from './base-rule.service';
import { GeoAnomalyRuleService } from './geo-anomaly-rule.service';

const mockLookup = geoip.lookup as jest.Mock;

function makeReq(overrides: Partial<ScoreRequest> = {}): ScoreRequest {
  return {
    transactionId: 'tx-1',
    userId: 'u-1',
    recipientId: 'u-2',
    amountCents: 5000,
    currency: 'USD',
    ipAddress: '8.8.8.8',
    transactionType: 'TRANSFER',
    userCountry: 'US',
    recipientIsContact: false,
    senderCurrency: 'USD',
    recipientCurrency: 'USD',
    usdEquivalentCents: 5000,
    ...overrides,
  };
}

describe('GeoAnomalyRuleService', () => {
  let service: GeoAnomalyRuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeoAnomalyRuleService();
  });

  describe('evaluate', () => {
    it('does not fire when ipAddress is missing', async () => {
      const result = await service.evaluate(makeReq({ ipAddress: '' }));
      expect(result.fired).toBe(false);
    });

    it('does not fire when userCountry is missing', async () => {
      const result = await service.evaluate(makeReq({ userCountry: '' }));
      expect(result.fired).toBe(false);
    });

    it('does not fire when IP resolves to a private address', async () => {
      const result = await service.evaluate(
        makeReq({ ipAddress: '127.0.0.1' }),
      );
      expect(mockLookup).not.toHaveBeenCalled();
      expect(result.fired).toBe(false);
    });

    it('does not fire when geoip returns null', async () => {
      mockLookup.mockReturnValue(null);

      const result = await service.evaluate(makeReq());

      expect(result.fired).toBe(false);
    });

    it('does not fire when IP country matches user country', async () => {
      mockLookup.mockReturnValue({ country: 'US' });

      const result = await service.evaluate(makeReq({ userCountry: 'US' }));

      expect(result.fired).toBe(false);
    });

    it('is case-insensitive for country comparison', async () => {
      mockLookup.mockReturnValue({ country: 'us' });

      const result = await service.evaluate(makeReq({ userCountry: 'US' }));

      expect(result.fired).toBe(false);
    });

    it('fires when IP country differs from user country', async () => {
      mockLookup.mockReturnValue({ country: 'DE' });

      const result = await service.evaluate(makeReq({ userCountry: 'US' }));

      expect(result.fired).toBe(true);
      expect(result.score).toBe(40);
      expect(result.forceBlock).toBe(false);
      expect(result.name).toBe('geo_anomaly');
    });
  });

  describe('normalizeIp', () => {
    it('strips ::ffff: prefix from IPv4-mapped IPv6 addresses', () => {
      expect(GeoAnomalyRuleService.normalizeIp('::ffff:1.2.3.4')).toBe(
        '1.2.3.4',
      );
    });

    it('returns plain IPv4 unchanged', () => {
      expect(GeoAnomalyRuleService.normalizeIp('1.2.3.4')).toBe('1.2.3.4');
    });

    it('returns plain IPv6 unchanged', () => {
      expect(GeoAnomalyRuleService.normalizeIp('2001:db8::1')).toBe(
        '2001:db8::1',
      );
    });
  });

  describe('isPrivateIp', () => {
    it.each([
      ['127.0.0.1'],
      ['::1'],
      ['10.0.0.1'],
      ['192.168.1.1'],
      ['172.16.0.1'],
      ['172.31.255.255'],
      ['fc00::1'],
      ['fe80::1'],
      ['::ffff:10.0.0.1'],
    ])('identifies %s as private', (ip) => {
      expect(GeoAnomalyRuleService.isPrivateIp(ip)).toBe(true);
    });

    it('identifies public IP as non-private', () => {
      expect(GeoAnomalyRuleService.isPrivateIp('8.8.8.8')).toBe(false);
    });
  });
});
