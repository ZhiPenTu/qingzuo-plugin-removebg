import test from 'node:test';
import assert from 'node:assert/strict';
import { cutout } from '../ui/cutout.mjs';
const input = { token: 'input', name: '商品.png', mime: 'image/png', size: 5 };
test('multipart parameters, PNG results and paid error paths belong to the plugin', async () => {
  for (const [status, png, expected] of [[200, true, null], [401, true, /密钥/], [402, true, /额度/], [429, true, /频繁/], [500, true, /处理/], [200, false, /PNG/]]) {
    let calls = 0, releases = 0;
    const client = { network: { request: async options => { calls++; assert.equal(options.multipart.files[0].token, input.token); assert.equal(options.multipart.fields.format, 'png'); assert.equal(options.credentialHeader, 'X-Api-Key'); return { status, file: { token: 'result' } }; } }, files: { read: async () => ({ data: Buffer.from(png ? [137,80,78,71,13,10,26,10] : [1]).toString('base64') }), release: async () => { releases++; } } };
    if (expected) { await assert.rejects(cutout(client, input), expected); assert.equal(releases, 1); } else assert.equal((await cutout(client, input)).token, 'result');
    assert.equal(calls, 1);
  }
});
test('oversized inputs and cancelled requests do not trigger automatic retry', async () => {
  let calls = 0;
  const client = { network: { request: async () => { calls++; throw new Error('取消'); } } };
  await assert.rejects(cutout(client, { ...input, size: 23 * 1024 ** 2 }), /22 MB/);
  assert.equal(calls, 0);
  await assert.rejects(cutout(client, input), /取消/);
  assert.equal(calls, 1);
});
