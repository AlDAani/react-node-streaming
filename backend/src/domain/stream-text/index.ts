import { faker } from '@faker-js/faker';
import { DEFAULT_STREAM_PARAGRAPHS } from './constants';
import { TParagraphCount } from './types';

export function createLongText(paragraphCount: TParagraphCount = DEFAULT_STREAM_PARAGRAPHS): string {
  const safeParagraphCount =
    Number.isInteger(paragraphCount) && paragraphCount > 0
      ? paragraphCount
      : DEFAULT_STREAM_PARAGRAPHS;
  return faker.lorem.paragraphs(safeParagraphCount, '\n\n');
}

export type { TParagraphCount, TParagraphList } from './types';
