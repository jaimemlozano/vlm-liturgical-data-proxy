import assert from 'node:assert/strict';
import test from 'node:test';

import { isPublishedDataPath } from '../lib/path-policy.mjs';

test('allows published liturgical data paths', () => {
  const paths = [
    'version.json',
    'en/firstReadings.json',
    'es/gospelAcclamations.json',
    'data/calendars.json',
    'data/future-file_2.json',
  ];

  for (const path of paths) {
    assert.equal(isPublishedDataPath(path), true, path);
  }
});

test('rejects repository files and path traversal', () => {
  const paths = [
    'README.md',
    'release.sh',
    '.github/workflows/release.yml',
    '../version.json',
    'en/../README.md',
    'en/nested/readings.json',
    'fr/readings.json',
    'en/.hidden.json',
    'en/readings.txt',
    'en%2Freadings.json',
    '',
    null,
  ];

  for (const path of paths) {
    assert.equal(isPublishedDataPath(path), false, String(path));
  }
});
