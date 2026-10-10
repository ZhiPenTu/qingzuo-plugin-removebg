import { _electron, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const executablePath = process.env.QINGZUO_HOST_EXECUTABLE, profile = process.env.QINGZUO_TEST_PROFILE;
if (!executablePath || !profile || !process.env.QINGZUO_EXPECTED_PLUGIN_VERSION) throw new Error('Explicit packaged host, independent profile and expected market version required.');
const applicationRoot = process.platform === 'darwin' ? path.resolve(executablePath, '../../..') : path.dirname(executablePath);
const asar = path.join(applicationRoot, process.platform === 'darwin' ? 'Contents/Resources/app.asar' : 'resources/app.asar');
const digest = createHash('sha256').update(await readFile(asar)).digest('hex'), marker = path.join(profile, 'acceptance-base-sha256');
await mkdir(profile, { recursive: true });
if (process.env.QINGZUO_PRIOR_PLUGIN_VERSION) expect(await readFile(marker, 'utf8')).toBe(digest);
else await writeFile(marker, digest);
const app = await _electron.launch({ executablePath, args: ['--user-data-dir=' + profile], cwd: profile });
try {
  const page = await app.firstWindow();
  await expect(page.getByText('Harness 内核已连接')).toBeVisible();
  const before = await page.evaluate(() => window.commerceDesktop.invoke('status'));
  expect(before.version).toBe('0.2.7');
  expect(before.plugins.find(plugin => plugin.id === 'official.removebg')?.version).toBe(process.env.QINGZUO_PRIOR_PLUGIN_VERSION || undefined);
  await page.getByRole('button', { name: '插件市场', exact: true }).click();
  const card = page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: 'AI 抠图', exact: true }) });
  const reload = page.getByRole('button', { name: '重新加载', exact: true });
  for (let attempt = 0; attempt < 5; attempt++) {
    try { await card.waitFor({ state: 'visible', timeout: 15000 }); break; } catch {}
    await expect.poll(async () => await card.isVisible() || await reload.isVisible(), { timeout: 120000 }).toBe(true);
    if (await card.isVisible()) break;
    console.log('Manual market reload after an unavailable catalog, attempt ' + (attempt + 1));
    try { await reload.click({ timeout: 5000 }); }
    catch (error) { if (!await card.isVisible() && !await page.getByText('正在加载插件目录…', { exact: true }).isVisible()) throw error; }
  }
  await expect(card).toBeVisible();
  for (let attempt = 0; attempt < 5; attempt++) {
    await card.getByRole('button', { name: process.env.QINGZUO_PRIOR_PLUGIN_VERSION ? '更新插件' : '安装插件', exact: true }).click();
    await expect.poll(async () => await card.getByRole('button', { name: '已安装', exact: true }).isVisible() || await page.getByRole('alert').isVisible(), { timeout: 120000 }).toBe(true);
    if (await card.getByRole('button', { name: '已安装', exact: true }).isVisible()) break;
    const failure = await page.getByRole('alert').innerText();
    if (!/fetch failed|下载失败|timeout/i.test(failure)) throw new Error(failure);
    console.log('Manual install/update retry after network failure, attempt ' + (attempt + 1));
  }
  await expect(card.getByRole('button', { name: '已安装', exact: true })).toBeVisible({ timeout: 120000 });
  const after = await page.evaluate(() => window.commerceDesktop.invoke('status'));
  expect(after.plugins.find(plugin => plugin.id === 'official.removebg')).toMatchObject({ version: process.env.QINGZUO_EXPECTED_PLUGIN_VERSION, source: 'market', enabled: true });
  expect(createHash('sha256').update(await readFile(asar)).digest('hex')).toBe(digest);
  await mkdir('output', { recursive: true });
  await page.screenshot({ path: 'output/market-' + process.env.QINGZUO_EXPECTED_PLUGIN_VERSION + '.png' });
  await writeFile('output/market-verification.json', JSON.stringify({ platform: process.platform + '-' + process.arch, baseVersion: after.version, baseRunId: process.env.QINGZUO_HOST_RUN_ID, baseSha256: digest, priorPluginVersion: process.env.QINGZUO_PRIOR_PLUGIN_VERSION || null, pluginVersion: process.env.QINGZUO_EXPECTED_PLUGIN_VERSION, source: 'signed public market', baseUnchanged: true }, null, 2));
  console.log('Public market Release signature install/update passed; base v0.2.7 application digest unchanged: ' + digest);
} catch (error) {
  await mkdir('output', { recursive: true });
  const page = await app.firstWindow();
  await page.screenshot({ path: 'output/market-failure.png' }).catch(() => {});
  await writeFile('output/market-failure.txt', await page.locator('body').innerText().catch(() => 'Renderer closed.'));
  throw error;
} finally { await app.close(); }
