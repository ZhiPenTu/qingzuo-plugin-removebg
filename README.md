# Qingzuo remove.bg plugin

SDK 1.1.1 is pinned to the platform's immutable sdk-v1.1.1 Release tarball with lockfile integrity. The runtime API remains 1.1.0.

Independent plugin extracted from ZhiPenTu/LabelEdit commit 6042881, retaining plugin ID official.removebg and credential name removebg.

Run npm ci, npm test and npm run pack. API ^1.1.0 provides scoped multipart uploads and private file preview URLs. The plugin owns remove.bg request parameters, PNG validation and paid-service error messages.

Host acceptance uses an explicit QINGZUO_HOST_EXECUTABLE. CI downloads a pinned successful platform validation artifact and publishes .ecplugin plus catalog fragments. Market signing belongs to qingzuo-market; no signing private key or user API key belongs in this repository.

Public market lifecycle acceptance uses the same immutable platform Release run ID for install and upgrade. The install workflow saves a disposable test profile; the upgrade workflow restores it and checks the installed version, market signature and unchanged app.asar SHA-256. These profiles contain fixture data only, never a user's credentials. Version 0.1.2 clears stale previews before a new request and proves a plugin-only update without repackaging Qingzuo v0.2.7.
