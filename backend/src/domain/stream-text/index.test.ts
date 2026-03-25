import assert from 'node:assert/strict';
import test from 'node:test';
import { createLongText } from './index';

test('createLongText generates requested number of paragraphs', () => {
  const text = createLongText(3);
  const paragraphs = text.split('\n\n');
  assert.equal(paragraphs.length, 3);
  assert.equal(paragraphs.every((entry) => entry.length > 20), true);
});
