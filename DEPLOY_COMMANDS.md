# 完整部署命令指南

## 📋 目录

1. [本地开发环境部署](#本地开发环境部署)
2. [主网生产环境部署](#主网生产环境部署)
3. [升级部署（保留数据）](#升级部署保留数据)
4. [常见部署场景](#常见部署场景)

---

## 🏠 本地开发环境部署

### 首次部署（完整流程）

```bash
# 1. 进入项目根目录
cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat

# 2. 启动本地 ICP 网络（如果未运行）
dfx start --background

# 3. 检查网络状态
dfx ping

# 4. 安装前端依赖（如果未安装）
cd src/icp_chat_frontend
npm install
cd ../..

# 5. 部署后端 canister（首次）
dfx deploy icp_chat_backend

# 6. 构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 7. 部署前端 canister
dfx deploy icp_chat_frontend

# 8. 查看部署结果
dfx canister id icp_chat_backend
dfx canister id icp_chat_frontend
```

### 访问应用

- **前端开发服务器**（推荐，支持热重载）：
  ```bash
  cd src/icp_chat_frontend
  npm run dev
  ```
  访问：`http://localhost:8080`

- **部署后的应用**：
  访问：`http://localhost:4943?canisterId={frontend_canister_id}`

---

## 🌐 主网生产环境部署

### 首次部署（完整流程）

```bash
# 1. 进入项目根目录
cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat

# 2. 检查身份和钱包
dfx identity whoami
dfx wallet balance

# 3. 确保有足够的 cycles（至少 2T cycles）
# 如果 cycles 不足，需要充值
dfx wallet --network ic balance

# 4. 安装前端依赖（如果未安装）
cd src/icp_chat_frontend
npm install
cd ../..

# 5. 部署后端 canister 到主网（首次）
dfx deploy --network ic icp_chat_backend

# 6. 等待部署完成，检查后端状态
dfx canister --network ic status icp_chat_backend

# 7. 构建前端（重要：必须在部署后端之后）
cd src/icp_chat_frontend
npm run build
cd ../..

# 8. 部署前端 canister 到主网
dfx deploy --network ic icp_chat_frontend

# 9. 查看部署结果
dfx canister --network ic id icp_chat_backend
dfx canister --network ic id icp_chat_frontend

# 10. 访问应用
# 前端 canister URL: https://{frontend-canister-id}.ic0.app
```

### 访问应用

部署完成后，可以通过以下方式访问：
- **前端 canister URL**：`https://{frontend-canister-id}.ic0.app`
- 或者通过 DFX 提供的 URL

---

## 🔄 升级部署（保留数据）

### 本地环境升级

```bash
# 1. 确保本地网络运行
dfx start --background

# 2. 升级后端（保留所有历史数据）
dfx deploy --upgrade-unchanged icp_chat_backend

# 3. 如果前端代码有更新，重新构建
cd src/icp_chat_frontend
npm run build
cd ../..

# 4. 升级前端
dfx deploy --upgrade-unchanged icp_chat_frontend
```

### 主网环境升级

```bash
# 1. 检查身份和 cycles
dfx identity whoami
dfx wallet --network ic balance

# 2. 升级后端（保留所有历史数据）
dfx deploy --network ic --upgrade-unchanged icp_chat_backend

# 3. 如果前端代码有更新，重新构建
cd src/icp_chat_frontend
npm run build
cd ../..

# 4. 升级前端
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend
```

**⚠️ 重要提示**：
- 使用 `--upgrade-unchanged` 可以保留所有历史消息和数据
- 如果不加这个标志，可能会重新创建 canister，导致数据丢失
- 更多信息请参考 `DATA_PERSISTENCE.md`

---

## 📝 常见部署场景

### 场景 1：只更新后端代码

```bash
# 本地
dfx deploy --upgrade-unchanged icp_chat_backend

# 主网
dfx deploy --network ic --upgrade-unchanged icp_chat_backend
```

### 场景 2：只更新前端代码

```bash
# 1. 构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 2. 部署前端
# 本地
dfx deploy --upgrade-unchanged icp_chat_frontend

# 主网
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend
```

### 场景 3：同时更新前后端

```bash
# 本地
dfx deploy --upgrade-unchanged icp_chat_backend
cd src/icp_chat_frontend && npm run build && cd ../..
dfx deploy --upgrade-unchanged icp_chat_frontend

# 主网
dfx deploy --network ic --upgrade-unchanged icp_chat_backend
cd src/icp_chat_frontend && npm run build && cd ../..
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend
```

### 场景 4：重新部署（会丢失数据）

**⚠️ 警告：这会删除所有数据！**

```bash
# 本地
dfx canister uninstall-code icp_chat_backend
dfx deploy icp_chat_backend

# 主网（谨慎操作！）
dfx canister --network ic uninstall-code icp_chat_backend
dfx deploy --network ic icp_chat_backend
```

### 场景 5：检查部署状态

```bash
# 本地
dfx canister status icp_chat_backend
dfx canister status icp_chat_frontend

# 主网
dfx canister --network ic status icp_chat_backend
dfx canister --network ic status icp_chat_frontend
```

### 场景 6：查看 Canister ID

```bash
# 本地
dfx canister id icp_chat_backend
dfx canister id icp_chat_frontend

# 主网
dfx canister --network ic id icp_chat_backend
dfx canister --network ic id icp_chat_frontend
```

### 场景 7：查看日志

```bash
# 本地
dfx canister call icp_chat_backend getMessages '(0, 10)'

# 主网
dfx canister --network ic call icp_chat_backend getMessages '(0, 10)'
```

---

## 🔧 故障排查命令

### 检查网络连接

```bash
# 本地网络
dfx ping

# 主网
dfx ping --network ic
```

### 检查 Cycles 余额

```bash
# 本地（通常不需要）
dfx wallet balance

# 主网（重要！）
dfx wallet --network ic balance
```

### 检查环境变量

```bash
# 查看 .env 文件
cat .env

# 查看 canister_ids.json
cat canister_ids.json
```

### 重新生成类型声明

```bash
dfx generate
```

### 清理并重新部署（本地）

```bash
# 停止网络
dfx stop

# 清理（会删除所有数据！）
dfx start --clean --background

# 重新部署
dfx deploy
```

---

## 📊 部署检查清单

### 本地部署前检查

- [ ] 本地网络正在运行：`dfx ping`
- [ ] 前端依赖已安装：`cd src/icp_chat_frontend && npm install`
- [ ] 后端代码已保存
- [ ] 前端代码已保存

### 主网部署前检查

- [ ] 已登录身份：`dfx identity whoami`
- [ ] 有足够的 cycles：`dfx wallet --network ic balance`（至少 2T）
- [ ] 后端代码已保存
- [ ] 前端代码已保存
- [ ] 已测试本地功能正常

### 部署后验证

- [ ] Canister 状态正常：`dfx canister status`
- [ ] 可以访问前端页面
- [ ] 可以发送消息
- [ ] 历史消息保留（升级部署时）

---

## 🚀 快速部署脚本

### 本地快速部署

```bash
#!/bin/bash
# 本地快速部署脚本

cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat

# 启动网络
dfx start --background

# 部署后端
dfx deploy --upgrade-unchanged icp_chat_backend

# 构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 部署前端
dfx deploy --upgrade-unchanged icp_chat_frontend

echo "✅ 部署完成！"
echo "前端开发服务器: cd src/icp_chat_frontend && npm run dev"
```

### 主网快速部署

```bash
#!/bin/bash
# 主网快速部署脚本

cd /Users/bilibili/Desktop/work/ICP/icp-chat/icp_chat

# 检查身份
dfx identity whoami

# 部署后端
dfx deploy --network ic --upgrade-unchanged icp_chat_backend

# 构建前端
cd src/icp_chat_frontend
npm run build
cd ../..

# 部署前端
dfx deploy --network ic --upgrade-unchanged icp_chat_frontend

echo "✅ 主网部署完成！"
dfx canister --network ic id icp_chat_frontend
```

---

## 📚 相关文档

- `DEPLOYMENT.md` - 详细部署指南
- `DATA_PERSISTENCE.md` - 数据持久化说明
- `README.md` - 项目说明
- `WALLET_TESTING.md` - 钱包功能测试指南

---

## ⚠️ 重要提示

1. **数据持久化**：始终使用 `--upgrade-unchanged` 进行升级部署，以保留历史数据
2. **Cycles 管理**：主网部署需要足够的 cycles，定期检查余额
3. **构建顺序**：必须先部署后端，再构建和部署前端（前端需要后端的 canister ID）
4. **测试优先**：主网部署前，先在本地测试功能正常
5. **备份重要**：重要数据建议定期备份

---

## 🆘 遇到问题？

1. 查看 `DATA_PERSISTENCE.md` 了解数据持久化问题
2. 查看 `DEPLOYMENT.md` 了解详细部署步骤
3. 检查浏览器控制台和 DFX 日志
4. 使用 `dfx canister status` 检查 canister 状态

