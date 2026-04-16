jest.mock(
  '../generated/prisma/enums',
  () => ({
    Category: {
      FOOD: 'FOOD',
      TRANSPORT: 'TRANSPORT',
      ENTERTAINMENT: 'ENTERTAINMENT',
      UTILITIES: 'UTILITIES',
      OTHER: 'OTHER',
    },
  }),
  { virtual: true },
);

import { ClassificationService } from './classification.service';

describe('ClassificationService', () => {
  let service: ClassificationService;

  beforeEach(() => {
    service = new ClassificationService();
  });

  describe('FOOD', () => {
    it.each([
      ["McDonald's", null],
      [null, 'Starbucks Coffee'],
      ['Lunch at chipotle', null],
      ['grocery run', null],
      [null, 'Uber Eats'],
      ['uber eats delivery', null],
      ['doordash order', null],
      ['door dash', null],
      ['grubhub pickup', null],
      ['grub hub delivery', null],
      ['instacart delivery', null],
      ['supermarket run', null],
    ])('classifies "%s" / "%s" as FOOD', (description, merchant) => {
      expect(service.classify(description, merchant)).toBe('FOOD');
    });
  });

  describe('TRANSPORT', () => {
    it.each([
      ['uber ride home', null],
      [null, 'Lyft'],
      ['taxi fare', null],
      ['metro transit pass', null],
      [null, 'Delta Airlines flight'],
      ['bus ticket', null],
    ])('classifies "%s" / "%s" as TRANSPORT', (description, merchant) => {
      expect(service.classify(description, merchant)).toBe('TRANSPORT');
    });

    it('classifies plain "uber" as TRANSPORT (not FOOD) when no food keyword present', () => {
      expect(service.classify('uber ride', null)).toBe('TRANSPORT');
    });
  });

  describe('ENTERTAINMENT', () => {
    it.each([
      [null, 'Netflix'],
      ['spotify premium', null],
      ['movie tickets', null],
      ['concert tickets', null],
      [null, 'Disney+'],
      ['video game purchase', null],
    ])('classifies "%s" / "%s" as ENTERTAINMENT', (description, merchant) => {
      expect(service.classify(description, merchant)).toBe('ENTERTAINMENT');
    });
  });

  describe('UTILITIES', () => {
    it.each([
      ['electricity bill', null],
      [null, 'Verizon'],
      ['internet bill', null],
      ['water utility', null],
      [null, 'Comcast'],
      ['phone bill', null],
    ])('classifies "%s" / "%s" as UTILITIES', (description, merchant) => {
      expect(service.classify(description, merchant)).toBe('UTILITIES');
    });
  });

  describe('OTHER', () => {
    it('returns OTHER when no keywords match', () => {
      expect(service.classify('random transfer', 'John Doe')).toBe('OTHER');
    });

    it('returns OTHER for null inputs', () => {
      expect(service.classify(null, null)).toBe('OTHER');
    });

    it('returns OTHER for empty strings', () => {
      expect(service.classify('', '')).toBe('OTHER');
    });
  });

  describe('FOOD takes priority over TRANSPORT for delivery apps', () => {
    it('classifies "Uber Eats" merchant as FOOD, not TRANSPORT', () => {
      expect(service.classify(null, 'Uber Eats')).toBe('FOOD');
    });

    it('classifies description containing "uber eats" as FOOD', () => {
      expect(service.classify('order from uber eats', null)).toBe('FOOD');
    });
  });
});
