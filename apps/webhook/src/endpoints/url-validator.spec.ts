import { BadRequestException } from '@nestjs/common';
import { validateWebhookUrl } from './url-validator';

describe('validateWebhookUrl', () => {
  describe('valid URLs', () => {
    it('accepts a public HTTPS URL', () => {
      expect(() => validateWebhookUrl('https://example.com/webhook')).not.toThrow();
    });

    it('accepts HTTPS URL with path and query', () => {
      expect(() => validateWebhookUrl('https://api.example.com/v1/hooks?id=1')).not.toThrow();
    });
  });

  describe('rejects non-HTTPS', () => {
    it('rejects http://', () => {
      expect(() => validateWebhookUrl('http://example.com/hook')).toThrow(BadRequestException);
    });

    it('rejects no scheme', () => {
      expect(() => validateWebhookUrl('example.com/hook')).toThrow(BadRequestException);
    });
  });

  describe('rejects invalid format', () => {
    it('rejects a completely invalid URL', () => {
      expect(() => validateWebhookUrl('https://')).toThrow(BadRequestException);
    });
  });

  describe('rejects localhost and loopback', () => {
    it('rejects localhost hostname', () => {
      expect(() => validateWebhookUrl('https://localhost/hook')).toThrow(BadRequestException);
    });

    it('rejects 127.0.0.1', () => {
      expect(() => validateWebhookUrl('https://127.0.0.1/hook')).toThrow(BadRequestException);
    });

    it('rejects ::1 (IPv6 loopback)', () => {
      expect(() => validateWebhookUrl('https://[::1]/hook')).toThrow(BadRequestException);
    });
  });

  describe('rejects private RFC1918 ranges', () => {
    it('rejects 10.x.x.x', () => {
      expect(() => validateWebhookUrl('https://10.0.0.1/hook')).toThrow(BadRequestException);
    });

    it('rejects 192.168.x.x', () => {
      expect(() => validateWebhookUrl('https://192.168.1.100/hook')).toThrow(BadRequestException);
    });

    it('rejects 172.16.x.x', () => {
      expect(() => validateWebhookUrl('https://172.16.0.1/hook')).toThrow(BadRequestException);
    });
  });

  describe('rejects link-local and metadata', () => {
    it('rejects 169.254.169.254 (AWS/GCP metadata)', () => {
      expect(() => validateWebhookUrl('https://169.254.169.254/latest')).toThrow(BadRequestException);
    });

    it('rejects metadata.google.internal', () => {
      expect(() => validateWebhookUrl('https://metadata.google.internal/')).toThrow(BadRequestException);
    });

    it('rejects instance-data', () => {
      expect(() => validateWebhookUrl('https://instance-data/latest')).toThrow(BadRequestException);
    });
  });

  describe('rejects internal hostnames', () => {
    it('rejects .internal suffix', () => {
      expect(() => validateWebhookUrl('https://service.internal/hook')).toThrow(BadRequestException);
    });

    it('rejects .local suffix', () => {
      expect(() => validateWebhookUrl('https://myservice.local/hook')).toThrow(BadRequestException);
    });

    it('rejects .localhost suffix', () => {
      expect(() => validateWebhookUrl('https://app.localhost/hook')).toThrow(BadRequestException);
    });
  });
});
