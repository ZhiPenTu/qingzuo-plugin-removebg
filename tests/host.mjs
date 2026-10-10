import { expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { launchPluginTestHost } from '@commerce/plugin-sdk/testing';
const pkg = JSON.parse(await readFile('package.json')), platform = process.platform + '-' + process.arch;
if (!process.env.QINGZUO_HOST_EXECUTABLE) throw new Error('Pinned platform executable required.');
const host = await launchPluginTestHost({ executablePath: process.env.QINGZUO_HOST_EXECUTABLE, artifactPath: 'release/' + pkg.commerce.id + '-' + pkg.version + '-' + platform + '.ecplugin', pluginId: pkg.commerce.id });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz0AAAAASUVORK5CYII=', 'base64');
try {
  const input = path.join(host.temporary, 'input.png'), output = path.join(host.temporary, 'output.png');
  await writeFile(input, png);
  await host.app.evaluate(({ dialog }, files) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [files.input] }); dialog.showSaveDialog = async () => ({ canceled: false, filePath: files.output }); }, { input, output });
  await host.plugin.locator('#key').fill('fixture-not-a-real-key');
  await host.plugin.locator('#save-key').click();
  await expect(host.plugin.locator('#key')).toHaveValue('');
  await host.plugin.locator('#pick').click();
  await expect(host.plugin.locator('#original')).toBeVisible();
  async function fixture(status, slow = false) {
    await host.app.evaluate(async (_, fixture) => {
      const pathModule = process.getBuiltinModule('node:path'), urlModule = process.getBuiltinModule('node:url'), vm = process.getBuiltinModule('node:vm');
      const url = urlModule.pathToFileURL(pathModule.join(process.resourcesPath, 'app.asar/desktop/main.mjs')).href;
      const runtime = await vm.runInThisContext('import(' + JSON.stringify(url) + ')', { importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER });
      runtime.network.request = async (url, options) => {
        if (url !== 'https://api.remove.bg/v1.0/removebg' || options.headers['X-Api-Key'] !== 'fixture-not-a-real-key' || options.body.get('format') !== 'png') throw new Error('Unexpected upload contract.');
        if (fixture.slow) return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
        return new Response(Buffer.from(fixture.png, 'base64'), { status: fixture.status, headers: { 'Content-Type': 'image/png' } });
      };
    }, { status, slow, png: png.toString('base64') });
  }
  await fixture(200);
  await host.plugin.locator('#run').click();
  await expect(host.plugin.locator('#status')).toContainText('抠图完成');
  await expect(host.plugin.locator('#result')).toBeVisible();
  const previousResource = await host.plugin.locator('#result').getAttribute('src');
  await host.plugin.locator('#download').click();
  await expect.poll(async () => { try { return (await readFile(output)).toString('base64'); } catch { return ''; } }).toBe(png.toString('base64'));
  for (const [status, message] of [[401, '密钥无效'], [402, '额度不足'], [429, '频繁']]) {
    await fixture(status); await host.plugin.locator('#run').click(); await expect(host.plugin.locator('#status')).toContainText(message);
    await expect(host.plugin.locator('#result')).toBeHidden();
    await expect(host.plugin.locator('#result')).not.toHaveAttribute('src');
    await expect(host.plugin.locator('#download')).toBeDisabled();
  }
  expect(await host.plugin.evaluate(async token => { try { await window.commercePlugin.invoke('files.read', { token }); return false; } catch { return true; } }, previousResource.split('/').at(-1))).toBe(true);
  await fixture(200, true);
  await host.plugin.locator('#run').click();
  await host.plugin.locator('#cancel').click();
  await expect(host.plugin.locator('#status')).toContainText('取消');
  await expect(host.plugin.locator('#result')).toBeHidden();
  console.log('Independent remove.bg artifact: private preview, scoped multipart, saved PNG, paid-service errors and cancellation passed with fixtures; no paid request made.');
} finally { await host.close(); }
