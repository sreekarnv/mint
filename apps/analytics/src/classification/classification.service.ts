import { Injectable } from '@nestjs/common';
import { Category } from '../generated/prisma/enums';

interface ClassificationRule {
  keywords: string[];
  category: Category;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    keywords: [
      'restaurant',
      'cafe',
      'coffee',
      'mcdonald',
      'burger',
      'pizza',
      'chipotle',
      'starbucks',
      'food',
      'doordash',
      'grubhub',
      'ubereats',
      'grocery',
      'supermarket',
    ],
    category: Category.FOOD,
  },
  {
    keywords: [
      'uber',
      'lyft',
      'taxi',
      'transit',
      'train',
      'flight',
      'airline',
      'bus',
      'metro',
      'subway',
    ],
    category: Category.TRANSPORT,
  },
  {
    keywords: [
      'netflix',
      'spotify',
      'amazon prime',
      'hulu',
      'disney',
      'hbo',
      'youtube',
      'apple music',
      'theater',
      'cinema',
      'movie',
      'concert',
      'game',
    ],
    category: Category.ENTERTAINMENT,
  },
  {
    keywords: [
      'electric',
      'electricity',
      'water',
      'gas',
      'internet',
      'phone',
      'mobile',
      'cable',
      'utility',
      'bill',
      'verizon',
      'at&t',
      'comcast',
    ],
    category: Category.UTILITIES,
  },
];

@Injectable()
export class ClassificationService {
  classify(description: string | null, merchant: string | null): Category {
    const text = `${description ?? ''} ${merchant ?? ''}`.toLowerCase();

    for (const rule of CLASSIFICATION_RULES) {
      if (rule.keywords.some((keyword) => text.includes(keyword))) {
        return rule.category;
      }
    }

    return Category.OTHER;
  }
}
