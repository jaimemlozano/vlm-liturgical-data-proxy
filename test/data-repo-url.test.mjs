import assert from 'node:assert/strict';
import test from 'node:test';

import handler from '../api/data/[...path].js';

const DATA_ENV = ['DATA_REPO_OWNER', 'DATA_REPO_NAME', 'DATA_REPO_BRANCH'];
const AUTH_ENV = ['API_KEY', 'GITHUB_PAT'];

function saveEnv(names) {
  const saved = new Map();
  for (const name of names) {
    saved.set(name, Object.hasOwn(process.env, name) ? process.env[name] : undefined);
  }
  return saved;
}

function restoreEnv(saved) {
  for (const [name, value] of saved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function callHandler(fileSegments) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      async text() {
        return '{}';
      },
    };
  };

  const res = {
    statusCode: null,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };

  const req = {
    method: 'GET',
    url: `/api/data/${fileSegments.join('/')}`,
    headers: { 'x-api-key': process.env.API_KEY },
    query: { path: fileSegments },
  };

  try {
    await handler(req, res);
  } finally {
    globalThis.fetch = originalFetch;
  }

  return { res, calls };
}

test('with no data-repo env, the handler requests jaimemlozano/vlm-liturgical-data on main', async () => {
  const saved = saveEnv([...DATA_ENV, ...AUTH_ENV]);
  try {
    for (const name of DATA_ENV) {
      delete process.env[name];
    }
    process.env.API_KEY = 'unit-test-api-key';
    process.env.GITHUB_PAT = 'unit-test-github-token';

    const { res, calls } = await callHandler(['en', 'sequences.json']);

    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0],
      'https://api.github.com/repos/jaimemlozano/vlm-liturgical-data/contents/en/sequences.json?ref=main',
    );
  } finally {
    restoreEnv(saved);
  }
});

test('DATA_REPO_OWNER, DATA_REPO_NAME, and DATA_REPO_BRANCH override the GitHub contents URL', async () => {
  const saved = saveEnv([...DATA_ENV, ...AUTH_ENV]);
  try {
    process.env.DATA_REPO_OWNER = 'example-owner';
    process.env.DATA_REPO_NAME = 'example-repo';
    process.env.DATA_REPO_BRANCH = 'example-branch';
    process.env.API_KEY = 'unit-test-api-key';
    process.env.GITHUB_PAT = 'unit-test-github-token';

    const { res, calls } = await callHandler(['data', 'calendars.json']);

    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0],
      'https://api.github.com/repos/example-owner/example-repo/contents/data/calendars.json?ref=example-branch',
    );
  } finally {
    restoreEnv(saved);
  }
});
