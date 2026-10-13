# AGENTS.md

本仓库是轻作独立 `official.removebg` 插件，负责通过受控的 remove.bg 网络接口生成透明背景图片。桌面底座、市场签名和目录发布在其他仓库完成。

## 项目边界

- `package.json` 中 manifest 的 API 兼容范围为 `^1.1.0`，仅声明 `https://api.remove.bg`、`removebg` 凭据和文件权限。
- UI 与插件逻辑在 `ui/`；`scripts/pack-plugin.mjs` 生成平台 `.ecplugin` 与 `catalog-*.json`；`tests/` 覆盖 cutout 错误处理、主机验收和市场生命周期。
- SDK 使用固定的 1.1.1 Release tarball。不要把业务处理、市场目录或桌面代码复制回本仓库。

## 开发与验证

```sh
npm ci --ignore-scripts
npm test
npm run pack
QINGZUO_HOST_EXECUTABLE=/path/to/Qingzuo npm run test:host
```

`npm run pack` 只生成当前平台制品；跨平台发布由 `.github/workflows/release.yml` 完成。公开市场安装/升级验收使用 `.github/workflows/market-acceptance.yml` 和固定的 `QINGZUO_HOST_RUN_ID`，不要用本地源码或未固定的底座替代它。

## 实现与安全约定

- 所有 remove.bg 请求必须通过 SDK `client.network.request()`，使用 manifest 声明的 origin 和 `removebg` 凭据注入；UI 不得读取或回显 API key，也不得自行使用 `fetch`、代理或系统网络。
- 上传使用 SDK 文件令牌和受控 multipart 通道，结果先校验为 PNG，再保存为私有文件。不要把原图、密钥、返回令牌或完整响应写入日志。
- 保持取消、失败、无效 PNG、HTTP 错误、配额/速率限制和重复请求的行为；开始新请求前释放旧结果，失败或取消后不能继续展示过期预览。
- 测试使用 fixture 响应，不发起真实计费请求，不把真实账户 key、市场私钥或用户文件提交进仓库。
- 不要把 `node_modules`、`.env*`、`release/`、`output/` 或打包临时目录提交。

## 发布与市场边界

- tag 必须与 `package.json` 版本一致，并生成 macOS arm64 / Windows x64 制品和目录片段；制品来源、摘要和 manifest 由市场再次审核。
- CI 只能使用成功且固定的底座验证运行；它可以模拟 remove.bg 响应，但不能把模拟结果描述成真实账户、额度或计费验收。
- 市场 Ed25519 签名、目录更新和跨仓库 PR 由 `qingzuo-market` 负责。本仓库不保存市场私钥，也不直接修改线上 `catalog.json`。

## 变更流程

1. 先阅读受影响的 UI/网络逻辑、`tests/cutout.test.mjs`、host 测试和相关 workflow。
2. API、manifest 权限或错误状态变化要同时更新测试、release notes 和文档。
3. 先运行 `npm test`，再运行 `npm run pack` 和固定 host/市场测试（若涉及制品或安装流程）。
4. 检查 `git diff --check`、`git status` 和生成物，报告实际使用的 host、平台及未完成的真实 API 验收。
