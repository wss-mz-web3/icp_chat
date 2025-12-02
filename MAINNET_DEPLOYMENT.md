# 主网（链上）部署完整指南

## 📋 部署前准备

### 1. 检查 DFX 和身份

```bash
# 检查 DFX 版本
dfx --version

# 检查当前身份
dfx identity whoami

# 如果未设置身份，创建或导入
dfx identity new my-identity
# 或使用现有身份
dfx identity use my-identity
```

### 2. 检查 Cycles 余额

```bash
# 检查钱包 cycles 余额（主网）
dfx wallet --network ic balance
```

**重要**：
- 部署需要足够的 cycles（建议至少 2T cycles）
- 如果余额不足，需要充值 cycles

### 3. 充值 Cycles（如果不足）

```bash
# 方法 1: 从 ICP 转换（如果有 ICP）
dfx ledger --network ic top-up <canister-id> --amount <icp-amount>

# 方法 2: 使用 cycles 钱包
# 访问 https://nns.ic0.app 或使用其他 cycles 钱包
```

---

## 🚀 完整部署流程

### 方法 1：使用安全部署脚本（推荐）

```bash
# 一键部署（自动备份+部署+验证）
./safe-deploy.sh ic
```

### 方法 2：手动部署（分步执行）

#### 步骤 1：进入项目目录

```bash
cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat
```

#### 步骤 2：检查并备份数据（如果已有部署）

```bash
# 检查 canister 是否存在
dfx canister --network ic status icp_chat_backend

# 如果存在，备份数据（推荐）
./backup-data.sh ic
```

#### 步骤 3：部署后端到主网

```bash
# 首次部署
dfx deploy --network ic icp_chat_backend

# 后续升级（保留数据）
dfx deploy --network ic --upgrade-unchanged icp_chat_backend
```

**部署过程**：
- 编译 Motoko 代码
- 上传到 ICP 主网
- 安装到 canister
- 生成类型声明文件
- 更新 `.env` 文件

#### 步骤 4：验证后端部署

```bash
# 检查 canister 状态
dfx canister --network ic status icp_chat_backend

# 查看 canister ID
dfx canister --network ic id icp_chat_backend

# 测试查询（可选）
dfx canister --network ic call icp_chat_backend getDataStats
```

#### 步骤 5：构建前端

```bash
# 进入前端目录
cd src/icp_chat_frontend

# 安装依赖（如果未安装）
npm install

# 构建前端（重要：必须在部署后端之后）
npm run build

# 返回项目根目录
cd ../..
```

**重要提示**：
- 构建前端时，Vite 会读取 `.env` 文件中的主网 canister ID
- 确保 `.env` 文件包含正确的 `CANISTER_ID_ICP_CHAT_BACKEND`
- 构建后的前端代码会包含主网的 canister ID

#### 步骤 6：部署前端到主网

```bash
# 首次部署
dfx deploy --network ic icp_chat_frontend

# 后续升级
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend
```

#### 步骤 7：验证前端部署

```bash
# 查看前端 canister ID
dfx canister --network ic id icp_chat_frontend

# 获取前端 URL
FRONTEND_ID=$(dfx canister --network ic id icp_chat_frontend)
echo "前端 URL: https://${FRONTEND_ID}.ic0.app"
```

#### 步骤 8：访问应用

部署完成后，可以通过以下方式访问：

1. **前端 Canister URL**：
   ```
   https://{frontend-canister-id}.ic0.app
   ```

2. **通过 DFX 提供的 URL**：
   ```bash
   dfx canister --network ic status icp_chat_frontend
   ```

---

## 📝 完整命令清单

### 首次部署（完整流程）

```bash
# 1. 进入项目目录
cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat

# 2. 检查身份和 cycles
dfx identity whoami
dfx wallet --network ic balance

# 3. 安装前端依赖（如果未安装）
cd src/icp_chat_frontend && npm install && cd ../..

# 4. 部署后端
dfx deploy --network ic icp_chat_backend

# 5. 构建前端
cd src/icp_chat_frontend && npm run build && cd ../..

# 6. 部署前端
dfx deploy --network ic icp_chat_frontend

# 7. 获取访问 URL
FRONTEND_ID=$(dfx canister --network ic id icp_chat_frontend)
echo "✅ 部署完成！访问: https://${FRONTEND_ID}.ic0.app"
```

### 后续升级（保留数据）

```bash
# 1. 备份数据（推荐）
./backup-data.sh ic

# 2. 升级后端（保留数据）
dfx deploy --network ic --upgrade-unchanged icp_chat_backend

# 3. 如果前端有更新，重新构建
cd src/icp_chat_frontend && npm run build && cd ../..

# 4. 升级前端
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend
```

---

## 🔍 部署验证

### 检查 Canister 状态

```bash
# 后端状态
dfx canister --network ic status icp_chat_backend

# 前端状态
dfx canister --network ic status icp_chat_frontend
```

### 检查 Cycles 余额

```bash
# 检查后端 cycles
dfx canister --network ic status icp_chat_backend | grep Balance

# 检查前端 cycles
dfx canister --network ic status icp_chat_frontend | grep Balance
```

### 测试功能

1. **访问前端**：打开 `https://{frontend-id}.ic0.app`
2. **测试登录**：使用 Internet Identity 登录
3. **测试发送消息**：发送一条测试消息
4. **测试钱包功能**：查看余额、收款地址

---

## ⚠️ 重要注意事项

### 1. Cycles 管理

- **部署需要 cycles**：每次部署都会消耗 cycles
- **运行需要 cycles**：canister 运行也会消耗 cycles
- **建议余额**：保持至少 1-2T cycles
- **监控余额**：定期检查 cycles 余额

```bash
# 检查 cycles 余额
dfx canister --network ic status icp_chat_backend | grep Balance
```

### 2. 数据持久化

- **使用升级模式**：`--upgrade-unchanged` 保留数据
- **部署前备份**：使用 `./backup-data.sh ic` 备份
- **验证数据**：部署后检查数据是否保留

### 3. 前端构建顺序

**重要**：必须先部署后端，再构建前端！

原因：
- 前端构建时需要读取 `.env` 文件中的 canister ID
- `.env` 文件在部署后端时生成/更新
- 如果顺序错误，前端会使用错误的 canister ID

### 4. 网络配置

- **主网部署**：使用 `--network ic` 标志
- **本地测试**：先在本地测试功能正常
- **网络切换**：确保所有命令都使用 `--network ic`

---

## 🐛 常见问题

### 问题 1: Cycles 余额不足

**错误信息**：
```
Error: Insufficient cycles
```

**解决方案**：
```bash
# 检查余额
dfx wallet --network ic balance

# 充值 cycles（从 ICP 转换）
dfx ledger --network ic top-up <canister-id> --amount <icp-amount>
```

### 问题 2: Canister ID 不匹配

**错误信息**：
```
canister_not_found
```

**解决方案**：
```bash
# 使用修复脚本
./fix-canister-id.sh ic

# 或手动修复
dfx deploy --network ic icp_chat_backend
cd src/icp_chat_frontend && npm run build && cd ../..
dfx deploy --network ic icp_chat_frontend
```

### 问题 3: 前端构建失败

**可能原因**：
- `.env` 文件不存在或配置错误
- 依赖未安装

**解决方案**：
```bash
# 1. 确保后端已部署
dfx deploy --network ic icp_chat_backend

# 2. 检查 .env 文件
cat .env | grep CANISTER_ID_ICP_CHAT_BACKEND

# 3. 安装依赖
cd src/icp_chat_frontend
npm install
npm run build
```

### 问题 4: 部署超时

**可能原因**：
- 网络连接问题
- Canister 太大

**解决方案**：
- 检查网络连接
- 使用 VPN（如果需要）
- 分步部署（先后端，再前端）

---

## 📊 部署检查清单

### 部署前

- [ ] DFX 已安装并更新到最新版本
- [ ] 已设置身份：`dfx identity whoami`
- [ ] Cycles 余额充足：`dfx wallet --network ic balance`（至少 2T）
- [ ] 本地功能测试通过
- [ ] 代码已保存并提交

### 部署中

- [ ] 后端部署成功
- [ ] 生成了 `.env` 文件
- [ ] 前端构建成功（无错误）
- [ ] 前端部署成功

### 部署后

- [ ] Canister 状态正常：`dfx canister --network ic status`
- [ ] 可以访问前端 URL
- [ ] 可以登录（Internet Identity）
- [ ] 可以发送消息
- [ ] 钱包功能正常（余额查询、收款地址）
- [ ] 数据已保留（如果是升级部署）

---

## 🎯 快速部署命令

### 一键部署脚本

```bash
# 使用安全部署脚本（推荐）
./safe-deploy.sh ic
```

### 手动快速部署

```bash
# 完整流程（复制粘贴执行）
cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat && \
dfx deploy --network ic --upgrade-unchanged icp_chat_backend && \
cd src/icp_chat_frontend && npm run build && cd ../.. && \
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend && \
echo "✅ 部署完成！前端 URL: https://$(dfx canister --network ic id icp_chat_frontend).ic0.app"
```

---

## 📚 相关文档

- `DEPLOY_COMMANDS.md` - 完整部署命令参考
- `DATA_PROTECTION_GUIDE.md` - 数据保护指南
- `CANISTER_NOT_FOUND_FIX.md` - Canister 错误修复
- `WALLET_TESTING.md` - 钱包功能测试

---

## 🔐 安全提示

1. **保护身份**：不要泄露身份文件
2. **保护 Cycles**：定期检查 cycles 余额
3. **备份数据**：部署前备份重要数据
4. **测试优先**：主网部署前先在本地测试

---

## ✅ 总结

主网部署的关键步骤：

1. ✅ **检查准备**：身份、cycles、代码
2. ✅ **部署后端**：`dfx deploy --network ic icp_chat_backend`
3. ✅ **构建前端**：`cd src/icp_chat_frontend && npm run build`
4. ✅ **部署前端**：`dfx deploy --network ic icp_chat_frontend`
5. ✅ **验证功能**：访问 URL 测试所有功能

**推荐使用 `./safe-deploy.sh ic` 进行一键部署！**

