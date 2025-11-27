# 部署后问题诊断指南

## 问题：部署到主网后仍然请求本地

### 诊断步骤

1. **检查浏览器控制台日志**

打开浏览器开发者工具（F12），查看控制台输出，应该能看到类似这样的日志：

```
[HTML Init] 环境配置: { network: 'ic', canisterId: 'xxx', hostname: 'xxx.ic0.app', ... }
[Config] 检测到的网络类型: ic hostname: xxx.ic0.app
[Config] 使用的 host: https://icp-api.io network: ic
```

如果看到 `network: 'local'` 或 `host: 'http://localhost:4943'`，说明检测失败。

2. **检查访问的 URL**

- **正确的主网访问方式**：`https://{frontend-canister-id}.ic0.app`
- **错误的访问方式**：`http://localhost:4943?canisterId=xxx`（这是 DFX 代理，用于本地测试主网）

3. **检查 .env 文件**

```bash
cat .env
```

应该看到：
```
DFX_NETWORK=ic
CANISTER_ID_ICP_CHAT_BACKEND=pxbfw-3iaaa-aaaam-qesya-cai
```

4. **检查构建时的环境变量**

```bash
cd src/icp_chat_frontend
npm run build
```

构建时应该看到日志：
```
[Vite Config] 从 .env 文件加载配置: { network: 'ic', canisterId: 'pxbfw-3iaaa-aaaam-qesya-cai' }
```

### 解决方案

#### 方案 1: 重新构建和部署（推荐）

```bash
# 1. 确保后端已部署到主网
dfx deploy --network ic icp_chat_backend

# 2. 检查 .env 文件
cat .env
# 应该看到 DFX_NETWORK=ic

# 3. 重新构建前端（重要：必须在部署后端之后）
cd src/icp_chat_frontend
npm run build
cd ../..

# 4. 重新部署前端
dfx deploy --network ic icp_chat_frontend
```

#### 方案 2: 手动检查网络检测

如果仍然有问题，打开浏览器控制台，运行：

```javascript
// 检查当前配置
console.log('Hostname:', window.location.hostname);
console.log('Protocol:', window.location.protocol);
console.log('Network:', window.__ICP_ENV__?.DFX_NETWORK);
console.log('Canister ID:', window.__ICP_ENV__?.CANISTER_ID_ICP_CHAT_BACKEND);
```

### 常见问题

#### Q: 为什么通过 localhost:4943 访问时还是请求本地？

A: 这是正常的。`localhost:4943` 是 DFX 提供的本地代理，用于测试主网部署的应用。通过这个代理访问时，应该使用 `localhost:4943` 作为 host。

如果要真正使用主网，应该直接访问：`https://{frontend-canister-id}.ic0.app`

#### Q: 如何获取主网的前端 URL？

A: 部署后，运行：

```bash
dfx canister --network ic id icp_chat_frontend
```

然后访问：`https://{返回的-canister-id}.ic0.app`

#### Q: 构建时环境变量是 local，但部署到主网了怎么办？

A: 确保在构建前先部署后端到主网：

```bash
# 先部署后端（会更新 .env 文件）
dfx deploy --network ic icp_chat_backend

# 然后构建前端（会读取更新后的 .env）
cd src/icp_chat_frontend
npm run build
```

