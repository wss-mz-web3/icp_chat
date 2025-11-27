# ICP Chat 部署指南

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd src/icp_chat_frontend
npm install
cd ../..
```

### 2. 启动本地 ICP 网络

```bash
dfx start --background
```

### 3. 部署后端并生成类型声明

```bash
dfx deploy
```

这会自动：
- 部署后端 canister
- 生成前端需要的类型声明文件
- 创建 `.env` 文件（包含 canister ID）

### 4. 构建前端

```bash
cd src/icp_chat_frontend
npm run build
cd ../..
```

### 5. 部署前端

```bash
dfx deploy
```

### 6. 访问应用

本地开发：
- 前端开发服务器：`http://localhost:8080`（运行 `npm run dev`）
- 部署后的应用：`http://localhost:4943?canisterId={frontend_canister_id}`

## 开发模式

### 启动开发服务器

```bash
# 终端 1: 启动 ICP 本地网络
dfx start --background

# 终端 2: 部署后端（首次或修改后端后）
dfx deploy

# 终端 3: 启动前端开发服务器
cd src/icp_chat_frontend
npm run dev
```

前端开发服务器会在 `http://localhost:8080` 启动，支持热重载。

## 生产部署

### 部署到 ICP 主网

1. **确保已登录 ICP 钱包**

```bash
dfx identity whoami
```

2. **部署后端到主网**

```bash
dfx deploy --network ic icp_chat_backend
```

这会自动：
- 部署后端 canister 到主网
- 生成类型声明文件
- 更新 `.env` 文件（包含主网的 canister ID）

3. **构建前端（重要：必须在部署后端之后）**

```bash
cd src/icp_chat_frontend
npm run build
cd ../..
```

**注意**：构建前端时，Vite 会读取 `.env` 文件中的主网 canister ID 和网络配置，并将其编译到前端代码中。

4. **部署前端到主网**

```bash
dfx deploy --network ic icp_chat_frontend
```

5. **访问应用**

部署完成后，可以通过以下方式访问：
- 前端 canister URL：`https://{frontend-canister-id}.ic0.app`
- 或者通过 DFX 提供的 URL

### 主网部署后的配置说明

前端应用现在支持**自动检测网络类型**：

1. **运行时网络检测**：
   - 如果访问的域名包含 `.ic0.app` 或 `.icp0.io`，会自动识别为主网
   - 如果访问 `localhost` 或 `127.0.0.1`，会自动识别为本地网络

2. **Canister ID 获取优先级**：
   - 首先从 URL 参数 `?canisterId=xxx` 获取（DFX 部署时自动注入）
   - 其次从构建时注入的环境变量获取
   - 最后从 `window.__ICP_ENV__` 等全局变量获取

3. **调试信息**：
   - 打开浏览器控制台，可以看到详细的配置加载日志
   - 日志会显示检测到的网络类型、canister ID 和使用的 host

### 主网部署常见问题

#### 问题 1: 404 错误，请求仍然指向 localhost:4943

**原因**：前端构建时没有正确读取到主网的 `.env` 文件，或者构建时网络配置仍然是 `local`。

**解决方案**：
1. 确保先部署后端：`dfx deploy --network ic icp_chat_backend`
2. 检查 `.env` 文件，确认 `DFX_NETWORK=ic` 和 `CANISTER_ID_ICP_CHAT_BACKEND` 已正确设置
3. 重新构建前端：`cd src/icp_chat_frontend && npm run build`
4. 重新部署前端：`dfx deploy --network ic icp_chat_frontend`

#### 问题 2: Canister ID 不匹配

**原因**：前端使用的 canister ID 与后端不匹配。

**解决方案**：
1. 检查 `canister_ids.json` 文件，确认后端 canister ID
2. 检查 `.env` 文件，确认 `CANISTER_ID_ICP_CHAT_BACKEND` 是否正确
3. 如果 `.env` 文件不正确，删除后重新运行 `dfx deploy --network ic icp_chat_backend`
4. 重新构建和部署前端

#### 问题 3: 网络类型检测失败

**原因**：前端无法正确检测网络类型。

**解决方案**：
- 前端现在会自动通过 hostname 检测网络类型
- 如果仍然有问题，检查浏览器控制台的日志，查看检测到的网络类型
- 确保访问的 URL 是正确的 ICP 主网域名（`.ic0.app` 或 `.icp0.io`）

## 环境变量说明

`.env` 文件（由 `dfx deploy` 自动生成）包含：

- `DFX_NETWORK` - 网络类型（`local` 或 `ic`）
- `CANISTER_ID_ICP_CHAT_BACKEND` - 后端 canister ID
- `CANISTER_ID_ICP_CHAT_FRONTEND` - 前端 canister ID

前端代码会自动读取这些变量。

## 常见问题

### 1. 类型声明文件缺失

如果看到类型错误，运行：

```bash
dfx generate
```

### 2. Canister ID 未找到

确保已运行 `dfx deploy`，这会生成 `.env` 文件。

**主网部署后**：
- 检查 `.env` 文件是否存在且包含正确的 canister ID
- 检查浏览器控制台日志，查看配置加载情况
- 确保前端是在部署后端之后构建的（这样才能读取到正确的 canister ID）

### 3. 本地网络连接失败

确保本地 ICP 网络正在运行：

```bash
dfx start --background
```

### 4. 前端构建失败

确保已安装所有依赖：

```bash
cd src/icp_chat_frontend
npm install
```

## 项目结构

```
icp_chat/
├── dfx.json                    # DFX 配置文件
├── canister_ids.json          # Canister ID 配置
├── src/
│   ├── icp_chat_backend/      # 后端 Motoko 代码
│   │   └── main.mo
│   └── icp_chat_frontend/     # 前端 React 代码
│       ├── src/
│       │   ├── components/    # React 组件
│       │   ├── services/       # API 服务
│       │   └── App.tsx        # 主应用
│       ├── package.json
│       └── vite.config.ts
└── .env                        # 环境变量（自动生成）
```

