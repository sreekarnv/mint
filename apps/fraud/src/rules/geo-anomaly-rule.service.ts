import { Injectable, Logger } from '@nestjs/common';
import { BaseRuleService, RuleResult, ScoreRequest } from './base-rule.service';
import * as geoip from 'geoip-lite';

const PRIVATE_RANGES = [
  /^127\./,
  /^::1$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^fc00:/,
  /^fe80:/,
  /^::ffff:/,
];

@Injectable()
export class GeoAnomalyRuleService extends BaseRuleService {
  private name: string = 'geo_anomaly';
  private readonly logger = new Logger(GeoAnomalyRuleService.name);

  async evaluate(req: ScoreRequest): Promise<RuleResult> {
    if (!req.userCountry || !req.ipAddress) return this.notFired(this.name);

    const ipCountry = this.getCountryFromIp(req.ipAddress);

    if (!ipCountry) {
      this.logger.debug(
        `${this.name}: skipped for IP ${req.ipAddress} (private or unresolvable)`,
      );
      return this.notFired(this.name);
    }

    const ipCountryUpper = ipCountry.toUpperCase();
    const userCountryUpper = req.userCountry.toUpperCase();

    if (ipCountryUpper !== userCountryUpper) {
      this.logger.warn(
        `${this.name} fired: user ${req.userId} registered in ${userCountryUpper}, ` +
          `request from ${ipCountryUpper} (IP: ${req.ipAddress})`,
      );

      return {
        name: this.name,
        fired: true,
        score: 40,
        forceBlock: false,
        reason: `request came from ${ipCountryUpper} but account is registered in ${userCountryUpper}`,
      };
    }

    return this.notFired(this.name);
  }

  getCountryFromIp(rawIp: string): string | null {
    const ip = GeoAnomalyRuleService.normalizeIp(rawIp);

    if (!GeoAnomalyRuleService.isPrivateIp(ip)) return null;

    const geo = geoip.lookup(ip);
    return geo?.country ?? null;
  }

  static normalizeIp(ip: string): string {
    if (ip.startsWith('::ffff:')) {
      return ip.slice(7);
    }

    return ip;
  }

  static isPrivateIp(ip: string): boolean {
    return PRIVATE_RANGES.some((re) => re.test(ip));
  }
}
