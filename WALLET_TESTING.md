# 钱包功能本地测试指南

## 前置条件

1. **确保 DFX 已安装并运行**
   ```bash
   dfx --version
   dfx start --background
   ```

2. **确保后端已部署**
   ```bash
   dfx deploy
   ```

## 本地测试步骤

### 1. 启动本地 ICP 网络

```bash
# 如果 DFX 未运行，启动它
dfx start --background
```

### 2. 部署后端 Canister

```bash
# 在项目根目录运行
dfx deploy
```

这会：
- 部署后端 canister 到本地网络
- 生成 `.env` 文件（包含 canister ID）
- 生成类型声明文件

### 3. 启动前端开发服务器

```bash
cd src/icp_chat_frontend
npm run dev
```

前端开发服务器会在 `http://localhost:8080` 启动。

### 4. 访问钱包功能

1. 打开浏览器访问 `http://localhost:8080`
2. 点击导航栏的 **💰 钱包** 按钮
3. 如果未登录，点击 **登录** 按钮使用 Internet Identity 登录

**注意**：本地测试时，Internet Identity 需要：
- 使用支持 Web Crypto 的浏览器（Chrome、Firefox、Edge 等）
- 通过 `localhost` 或 `127.0.0.1` 访问（不是 IP 地址）
- 如果使用 `local.bilibili.co:3001` 等域名，需要配置 HTTPS 或使用 localhost

### 5. 测试钱包功能

#### 查看余额
- 登录后，钱包页面会自动加载并显示当前账户的 ICP 余额
- 点击 **🔄** 按钮可以刷新余额

#### 转账测试
1. 点击 **转账** 区域的 **展开** 按钮
2. 输入收款地址（Principal 格式，例如：`abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc`）
3. 输入转账金额（ICP）
4. 可选：输入备注
5. 点击 **确认转账**

**注意**：
- 本地测试时，转账会通过本地网络代理访问主网 Ledger
- 需要确保账户有足够的 ICP 余额
- 转账手续费为 0.0001 ICP

## 本地测试注意事项

### Internet Identity 登录问题

如果遇到 "当前浏览器或访问方式不支持 Internet Identity 登录" 的错误：

1. **确保使用 localhost 访问**
   - ✅ 正确：`http://localhost:8080`
   - ✅ 正确：`http://127.0.0.1:8080`
   - ❌ 错误：`http://local.bilibili.co:3001`（除非配置了 HTTPS）

2. **检查浏览器支持**
   - 使用 Chrome、Firefox、Edge 等现代浏览器
   - 确保浏览器支持 Web Crypto API

3. **检查网络配置**
   - 确保 DFX 网络正在运行：`dfx ping`
   - 确保后端已部署：`dfx canister id icp_chat_backend`

### 余额查询问题

如果无法查询余额或遇到 "403 Forbidden" 或 "证书验证失败" 错误：

1. **确保已登录**
   - 钱包功能需要 Internet Identity 登录
   - 如果未登录，点击导航栏的"登录"按钮
   - 登录后刷新页面

2. **检查网络连接**
   ```bash
   # 检查 DFX 是否运行
   dfx ping
   
   # 如果未运行，启动它
   dfx start --background
   ```

3. **检查 Ledger Canister**
   - 本地测试时，使用主网 Ledger canister ID：`ryjl3-tyaaa-aaaaa-aaaba-cai`
   - 通过本地网络代理访问：`http://localhost:4943`
   - 注意：本地测试时，Ledger 查询会通过本地网络代理到主网

4. **解决证书验证失败问题**
   
   如果遇到 "certificate verification failed" 错误：
   
   a. **确保使用 localhost 访问**
      - ✅ 正确：`http://localhost:8080`
      - ❌ 错误：`http://local.bilibili.co:3001`（除非配置了 HTTPS）
   
   b. **重新登录**
      - 退出登录
      - 刷新页面
      - 重新使用 Internet Identity 登录
   
   c. **检查 DFX 网络状态**
      ```bash
      # 重启 DFX 网络
      dfx stop
      dfx start --background
      dfx deploy
      ```
   
   d. **清除浏览器缓存**
      - 清除浏览器缓存和 Cookie
      - 重新访问应用并登录

5. **检查浏览器控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页的网络请求
   - 检查是否有 CORS 或证书相关错误

### 转账问题

如果转账失败：

1. **检查余额**
   - 确保账户有足够的 ICP 余额
   - 转账金额 + 手续费（0.0001 ICP）不能超过余额

2. **检查 Principal 格式**
   - 收款地址必须是有效的 Principal 格式
   - Principal 格式：`xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxx`

3. **检查网络状态**
   - 确保本地网络正常运行
   - 如果通过代理访问主网，确保网络连接正常

## 调试技巧

### 1. 查看浏览器控制台

打开浏览器开发者工具（F12），查看：
- **Console**：错误信息和日志
- **Network**：网络请求和响应

### 2. 检查 DFX 状态

```bash
# 检查 DFX 是否运行
dfx ping

# 查看 canister 状态
dfx canister status icp_chat_backend

# 查看日志
dfx canister call icp_chat_backend --query
```

### 3. 检查环境变量

在浏览器控制台输入：
```javascript
// 查看当前配置
window.__ICP_ENV__

// 查看 canister ID
window.__CANISTER_IDS__
```

### 4. 测试 Ledger 连接

在浏览器控制台输入：
```javascript
// 测试 Ledger canister
fetch('http://localhost:4943/api/v2/canister/ryjl3-tyaaa-aaaaa-aaaba-cai/query')
  .then(r => r.json())
  .then(console.log)
```

## 常见问题

### Q: 本地测试时余额显示为 0？

A: 本地测试时，如果账户在主网有余额，应该能正常显示。如果显示为 0，可能是：
1. 账户确实没有余额
2. 网络连接问题
3. Ledger canister 访问问题

### Q: 遇到 "403 Forbidden" 或 "证书验证失败" 错误？

A: 这通常是身份验证问题，解决方法：
1. **确保已登录**：点击导航栏的"登录"按钮使用 Internet Identity 登录
2. **使用 localhost 访问**：确保通过 `http://localhost:8080` 访问，而不是其他域名
3. **重新登录**：退出并重新登录
4. **检查 DFX 状态**：确保 `dfx start --background` 正在运行
5. **清除缓存**：清除浏览器缓存后重试

### Q: 转账时提示"余额不足"？

A: 确保：
1. 账户有足够的 ICP 余额
2. 转账金额 + 手续费（0.0001 ICP）不超过余额
3. 网络连接正常

### Q: 如何获取测试用的 ICP？

A: 本地测试时，可以使用：
1. 主网账户的真实 ICP（通过本地网络代理访问）
2. 或者部署一个本地的测试 Ledger canister（需要额外配置）

## 下一步

测试通过后，可以：
1. 部署到主网进行真实环境测试
2. 添加更多功能（如交易历史、批量转账等）
3. 优化用户体验和错误处理

