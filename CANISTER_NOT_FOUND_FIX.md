# Canister Not Found 错误修复指南

## 🚨 错误信息

```
⚠️ Error while making call: Server returned an error: Code: 400 () 
Body: error: canister_not_found details: The specified canister does not exist.
```

## 🔍 问题原因

这个错误通常发生在以下情况：

1. **前端使用了错误的 canister ID**
   - 前端构建时使用了旧的 canister ID
   - .env 文件中的 canister ID 不正确
   - 前端没有重新构建

2. **网络配置不匹配**
   - 前端检测到的网络类型与后端不匹配
   - 本地开发时使用了主网的 canister ID
   - 主网访问时使用了本地的 canister ID

3. **Canister 未部署或已删除**
   - 后端 canister 不存在
   - Canister 被删除或重新创建

## 🛠️ 快速修复

### 方法 1：使用自动修复脚本（推荐）

```bash
# 本地环境
./fix-canister-id.sh local

# 主网环境
./fix-canister-id.sh ic
```

这个脚本会：
1. 检查 canister 状态
2. 验证 canister ID
3. 更新 .env 文件
4. 重新构建前端（如果需要）

### 方法 2：手动修复步骤

#### 步骤 1：检查 canister 状态

```bash
# 本地
dfx canister status icp_chat_backend
dfx canister id icp_chat_backend

# 主网
dfx canister --network ic status icp_chat_backend
dfx canister --network ic id icp_chat_backend
```

#### 步骤 2：检查 .env 文件

```bash
cat .env | grep CANISTER_ID_ICP_CHAT_BACKEND
```

确认 canister ID 是否正确。

#### 步骤 3：更新 .env 文件

```bash
# 重新部署后端以更新 .env
dfx deploy --upgrade-unchanged icp_chat_backend        # 本地
dfx deploy --network ic --upgrade-unchanged icp_chat_backend  # 主网
```

#### 步骤 4：重新构建前端

```bash
cd src/icp_chat_frontend
npm run build
cd ../..
```

#### 步骤 5：重新部署前端（如果使用部署版本）

```bash
dfx deploy --upgrade-unchanged icp_chat_frontend        # 本地
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend  # 主网
```

#### 步骤 6：重启开发服务器（如果使用开发模式）

```bash
# 停止当前服务器（Ctrl+C）
cd src/icp_chat_frontend
npm run dev
```

## 🔍 诊断步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页，查找：

```
[Config] 从 ... 获取 canister ID: xxx
[Config] 检测到的网络类型: local/ic
[ICP Agent] 尝试使用端点: ...
```

**确认**：
- Canister ID 是否正确
- 网络类型是否正确
- 使用的端点是否正确

### 2. 检查 Canister ID 匹配

```bash
# 获取实际的 canister ID
BACKEND_ID=$(dfx canister id icp_chat_backend)

# 检查 .env 文件
grep CANISTER_ID_ICP_CHAT_BACKEND .env

# 应该匹配
```

### 3. 检查网络类型

在浏览器控制台输入：

```javascript
// 检查配置
console.log('Canister ID:', window.__ICP_ENV__?.CANISTER_ID_ICP_CHAT_BACKEND);
console.log('Network:', window.__ICP_ENV__?.DFX_NETWORK);
console.log('Hostname:', window.location.hostname);
```

## 📋 常见场景修复

### 场景 1：本地开发时错误

**症状**：本地开发时提示 canister_not_found

**原因**：前端使用了主网的 canister ID

**修复**：
```bash
# 1. 确保本地网络运行
dfx start --background

# 2. 确保本地 canister 已部署
dfx deploy icp_chat_backend

# 3. 更新 .env（确保是本地配置）
dfx deploy icp_chat_backend

# 4. 重新构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 5. 重启开发服务器
cd src/icp_chat_frontend
npm run dev
```

### 场景 2：主网部署后错误

**症状**：主网部署后提示 canister_not_found

**原因**：前端构建时使用了本地的 canister ID

**修复**：
```bash
# 1. 确保主网 canister 已部署
dfx deploy --network ic icp_chat_backend

# 2. 检查 .env 文件（应该是主网配置）
cat .env | grep DFX_NETWORK
# 应该显示: DFX_NETWORK='ic'

# 3. 重新构建前端（重要！）
cd src/icp_chat_frontend
npm run build
cd ../..

# 4. 重新部署前端
dfx deploy --network ic icp_chat_frontend
```

### 场景 3：Canister 被重新创建

**症状**：部署后 canister ID 改变了

**原因**：Canister 被重新创建而不是升级

**修复**：
```bash
# 1. 检查新的 canister ID
dfx canister id icp_chat_backend

# 2. 更新 .env
dfx deploy --upgrade-unchanged icp_chat_backend

# 3. 重新构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 4. 重新部署前端
dfx deploy --upgrade-unchanged icp_chat_frontend
```

## 🔧 验证修复

修复后，验证以下内容：

### 1. 浏览器控制台检查

打开浏览器控制台，应该看到：

```
[Config] 从 Vite 环境变量获取 canister ID: bw4dl-smaaa-aaaaa-qaacq-cai  # 本地
或
[Config] 从 Vite 环境变量获取 canister ID: pxbfw-3iaaa-aaaam-qesya-cai  # 主网

[Config] 检测到的网络类型: local  # 或 ic

[ICP Agent] 成功使用端点: http://localhost:4943  # 本地
或
[ICP Agent] 成功使用端点: https://icp-api.io  # 主网
```

### 2. 功能测试

- ✅ 可以发送消息
- ✅ 可以查看历史消息
- ✅ 可以查看余额（钱包功能）
- ✅ 可以修改个人资料

### 3. 网络请求检查

打开浏览器开发者工具 -> Network 标签页，查看请求：

- 请求 URL 应该包含正确的 canister ID
- 请求应该成功（状态码 200）

## ⚠️ 预防措施

### 1. 部署顺序

**正确的部署顺序**：

```bash
# 1. 先部署后端
dfx deploy --upgrade-unchanged icp_chat_backend

# 2. 再构建前端（读取最新的 .env）
cd src/icp_chat_frontend
npm run build
cd ../..

# 3. 最后部署前端
dfx deploy --upgrade-unchanged icp_chat_frontend
```

### 2. 使用安全部署脚本

```bash
# 自动处理所有步骤
./safe-deploy.sh local
./safe-deploy.sh ic
```

### 3. 检查清单

部署前检查：
- [ ] Canister 已存在
- [ ] .env 文件存在且正确
- [ ] Canister ID 匹配
- [ ] 网络类型正确

部署后检查：
- [ ] 浏览器控制台无错误
- [ ] Canister ID 正确
- [ ] 网络类型正确
- [ ] 功能正常

## 📞 如果问题仍然存在

1. **清除浏览器缓存**
   - 清除浏览器缓存和 Cookie
   - 硬刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

2. **检查 canister 状态**
   ```bash
   dfx canister status icp_chat_backend
   ```

3. **检查 cycles 余额（主网）**
   ```bash
   dfx canister --network ic status icp_chat_backend
   ```

4. **查看详细日志**
   - 浏览器控制台
   - DFX 日志
   - Canister 日志

5. **重新部署**
   ```bash
   # 使用安全部署脚本
   ./safe-deploy.sh local
   # 或
   ./safe-deploy.sh ic
   ```

## 📚 相关文档

- `DEPLOY_COMMANDS.md` - 完整部署命令
- `DATA_PROTECTION_GUIDE.md` - 数据保护指南
- `DEPLOYMENT.md` - 部署指南

