# Public market delivery and independent update acceptance

Date: 2026-10-10. All test profiles are disposable and contain no human account credentials. CI and current local hardware do not replace minimum-supported-system physical acceptance.

## Immutable releases and trust boundaries

- Platform: [Qingzuo v0.2.7](https://github.com/ZhiPenTu/LabelEdit/releases/tag/v0.2.7), commit 48376a5fa5286679ea12b493583a13943d6b536e. [Release run 38015823469](https://github.com/ZhiPenTu/LabelEdit/actions/runs/38015823469) passed both platform builds, real Windows installer upgrade, pure-platform startup and macOS component reconstruction. Its publish job downloaded every public asset again, verified GitHub SHA-256 and updater SHA-512, and verified the three-component manifest with the existing desktop public key. Evidence is the Public-release-verification artifact.
- Harness remains 0.2.1-alpha.1. Runtime API is 1.1.0; SDK sdk-v1.1.1 is immutable and lockfile-pinned. API 1.0 compatibility, private file ownership/release, multipart limits, cancellation and migration are covered by 60 platform and 7 Electron tests.
- LabelEdit first independent release is [v0.1.2](https://github.com/ZhiPenTu/qingzuo-plugin-labeledit/releases/tag/v0.1.2). [Public-market run 38015478342](https://github.com/ZhiPenTu/qingzuo-plugin-labeledit/actions/runs/38015478342) downloaded the signed published plugin into the real isolated host on both platforms, performed real offline OCR, edited and previewed a PDF, verified exported replacement text and released document resources. It did not repackage the plugin for that acceptance. The longer Windows profile exposed a DLL path-length limit; compact platform installation IDs fixed it before the platform release.
- remove.bg first independent release is [v0.1.1](https://github.com/ZhiPenTu/qingzuo-plugin-removebg/releases/tag/v0.1.1). The only subsequent plugin release in this acceptance is [v0.1.2](https://github.com/ZhiPenTu/qingzuo-plugin-removebg/releases/tag/v0.1.2), which clears stale cutout previews before a new request. [Release run 38017364089](https://github.com/ZhiPenTu/qingzuo-plugin-removebg/actions/runs/38017364089) passed both platform sandbox tests.
- [Market PR 3](https://github.com/ZhiPenTu/qingzuo-market/pull/3) changed only this plugin's catalog entry. Ingest run 38017827459 verified the two registered formal Release assets without executing plugin code. Same-head validation run 38017953695 passed before review and merge. Both downloaded public artifacts were also verified locally against their size, SHA-256 and market Ed25519 signatures.

## Install, preserve the profile, update only the plugin

Both phases use exactly platform Release run 38015823469, not a floating latest version or platform checkout.

1. [Install run 38017001841](https://github.com/ZhiPenTu/qingzuo-plugin-removebg/actions/runs/38017001841) created independent macOS and Windows profiles and installed market v0.1.1 from its own public Release. Profiles and an app.asar digest marker were saved as seven-day test artifacts.
2. Only remove.bg v0.1.2 was released and its market PR merged. No new platform release, tag or installer was produced for the plugin update.
3. [Upgrade run 38018628698](https://github.com/ZhiPenTu/qingzuo-plugin-removebg/actions/runs/38018628698) restored each original profile, asserted v0.1.1 was still installed, fetched the updated signed public catalog and used the real update button. The resulting plugin was enabled, source market, version 0.1.2.
4. The app.asar SHA-256 matched the saved marker before and after upgrade. The same immutable host artifact pins all remaining platform files. Market-evidence artifacts contain screenshots and machine-readable market-verification.json.

| Platform | Unchanged app.asar SHA-256 |
| --- | --- |
| darwin-arm64 | 93ee75f5a7d3fe0145ea69776b2a12482da9e511b79004363e0ef7e896ac6d23 |
| win32-x64 | 82089b6bc43fe0ecb4e32276465caa11d86c3cfe01ae9d7b66d6f64ca74d186a |

Earlier lifecycle harness failures were not counted as acceptance: one compared an empty optional environment value with undefined; another clicked a transient reload control while the initial catalog request completed. The final successful run keeps all version, source, enable-state, signature-install and base-digest assertions.

## Explicit limits

- remove.bg success/save, errors, quota/rate-limit statuses, invalid PNG and cancellation were simulated inside the real packaged host. No real billing request or actual account quota depletion was performed.
- Minimum macOS 14 and Windows minimum-supported-system physical acceptance is not complete. Dual-platform CI and deployment-target metadata checks are separate evidence.
- MARKET_TRIGGER_TOKEN is not configured in the plugin repositories. The Actions-only REST dispatch hook is implemented without requiring broad repository credentials; scheduled discovery and manual dispatch work. Market signing private keys exist only in the market's signing boundary, never the plugin repositories.
- Desktop installers use the existing unsigned distribution mode (macOS ad-hoc), not Apple notarization or Windows Authenticode certificates. Market package signatures and desktop component Ed25519 signatures are verified separately.
