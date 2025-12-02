# 数据保护完整指南

## 🚨 问题严重性

数据丢失是**非常严重**的问题！本指南提供了多层保护机制，确保数据安全。

## 🛡️ 多层保护机制

### 第 1 层：正确的部署方式（基础保护）

**必须使用升级模式部署**：

```bash
# 本地
dfx deploy --upgrade-unchanged icp_chat_backend

# 主网
dfx deploy --network ic --upgrade-unchanged icp_chat_backend
```

### 第 2 层：自动备份（推荐）

**使用安全部署脚本**，自动备份数据：

```bash
# 本地部署（自动备份）
./safe-deploy.sh local

# 主网部署（自动备份）
./safe-deploy.sh ic
```

### 第 3 层：手动备份（额外保障）

**部署前手动备份**：

```bash
# 备份本地数据
./backup-data.sh local

# 备份主网数据
./backup-data.sh ic
```

### 第 4 层：数据恢复（紧急恢复）

**如果数据丢失，从备份恢复**：

```bash
# 恢复本地数据
./restore-data.sh local [backup_file.json]

# 恢复主网数据
./restore-data.sh ic [backup_file.json]
```

---

## 📋 完整工作流程

### 日常部署流程（推荐）

```bash
# 1. 使用安全部署脚本（自动备份 + 部署 + 验证）
./safe-deploy.sh local        # 本地
./safe-deploy.sh ic           # 主网
```

### 手动部署流程（更谨慎）

```bash
# 1. 手动备份数据
./backup-data.sh local

# 2. 检查备份文件
ls -lh ./backups/

# 3. 部署后端（升级模式）
dfx deploy --upgrade-unchanged icp_chat_backend

# 4. 验证数据
dfx canister call icp_chat_backend getDataStats

# 5. 构建和部署前端
cd src/icp_chat_frontend && npm run build && cd ../..
dfx deploy --upgrade-unchanged icp_chat_frontend
```

### 紧急恢复流程

```bash
# 1. 检查备份文件
ls -lh ./backups/

# 2. 恢复数据
./restore-data.sh local ./backups/backup_local_20241202_120000.json

# 3. 验证恢复结果
dfx canister call icp_chat_backend getDataStats
```

---

## 🔧 新增功能说明

### 1. 数据导出功能

后端新增了 `exportAllData` 查询接口：

```motoko
public query func exportAllData() : async {
  messages : [Message];
  nextId : Nat;
  nextImageId : Nat;
  userProfiles : [(Principal, UserProfile)];
  messageCount : Nat;
  profileCount : Nat;
}
```

**用途**：
- 导出所有数据用于备份
- 数据迁移
- 数据分析

### 2. 数据导入功能

后端新增了 `importMessages` 接口：

```motoko
public shared ({ caller }) func importMessages(
  importedMessages : [Message], 
  importedNextId : Nat
) : async Result.Result<Bool, Text>
```

**特点**：
- **合并模式**：不会覆盖现有数据，只添加新消息
- **去重处理**：自动跳过已存在的消息（基于 ID）
- **数据验证**：检查消息数量限制

### 3. 数据统计功能

后端新增了 `getDataStats` 查询接口：

```motoko
public query func getDataStats() : async {
  messageCount : Nat;
  nextId : Nat;
  nextImageId : Nat;
  profileCount : Nat;
  imageCount : Nat;
}
```

**用途**：
- 部署前后数据对比
- 监控数据变化
- 验证数据完整性

---

## 📁 备份文件管理

### 备份文件位置

```
./backups/
├── backup_local_20241202_120000.json
├── backup_local_20241202_150000.json
├── backup_ic_20241202_120000.json
├── latest_local.json -> backup_local_20241202_150000.json
└── latest_ic.json -> backup_ic_20241202_120000.json
```

### 备份文件格式

```json
{
  "messages": [...],
  "nextId": 1234,
  "nextImageId": 56,
  "userProfiles": [...],
  "messageCount": 1234,
  "profileCount": 10
}
```

### 备份策略建议

1. **自动备份**：每次部署前自动备份
2. **定期备份**：每天或每周手动备份一次
3. **重要操作前备份**：重大更新前必须备份
4. **保留多个版本**：保留最近 7-30 天的备份

---

## 🚀 使用示例

### 示例 1：日常部署

```bash
# 使用安全部署脚本（推荐）
./safe-deploy.sh local
```

输出：
```
=== ICP Chat 安全部署工具 ===

[1/6] 检查 canister 状态...
✅ canister 已存在，将使用升级模式
当前数据：{"messageCount": 1234, "profileCount": 10}

[2/6] 备份数据...
✅ 备份完成！备份文件: ./backups/backup_local_20241202_120000.json

[3/6] 部署后端...
使用升级模式部署（保留数据）...
✅ 后端部署完成

[4/6] 构建前端...
✅ 前端构建完成

[5/6] 部署前端...
✅ 前端部署完成

[6/6] 验证数据...
✅ 数据完整保留（消息数量: 1234）

=== 部署完成 ===
```

### 示例 2：数据恢复

```bash
# 查看可用备份
ls -lh ./backups/

# 恢复数据
./restore-data.sh local ./backups/backup_local_20241202_120000.json
```

### 示例 3：只部署后端

```bash
./safe-deploy.sh local true false
# 参数：网络 部署后端 部署前端
```

---

## ⚠️ 重要注意事项

### 1. 备份时机

- ✅ **部署前**：必须备份
- ✅ **重大更新前**：必须备份
- ✅ **定期备份**：建议每天或每周

### 2. 备份验证

每次备份后，检查：
- 备份文件是否存在
- 备份文件大小是否合理
- 备份内容是否完整

### 3. 恢复前确认

恢复数据前：
- 确认备份文件正确
- 确认 canister 状态正常
- 确认有足够的 cycles（主网）

### 4. 主网特殊注意

主网部署时：
- 确保有足够的 cycles（至少 2T）
- 备份文件建议保存到本地
- 可以考虑多个备份位置

---

## 🔍 故障排查

### 问题 1：备份失败

**原因**：
- Canister 不存在或无法访问
- 网络连接问题
- 权限问题

**解决**：
```bash
# 检查 canister 状态
dfx canister status icp_chat_backend

# 检查网络
dfx ping
```

### 问题 2：恢复失败

**原因**：
- 备份文件格式错误
- Canister 状态异常
- 数据量过大

**解决**：
```bash
# 验证备份文件
cat ./backups/backup_*.json | jq '.'

# 检查 canister 状态
dfx canister status icp_chat_backend

# 尝试手动导入（小批量）
```

### 问题 3：数据不匹配

**原因**：
- 部署时未使用升级模式
- Canister 被重新创建

**解决**：
```bash
# 立即从备份恢复
./restore-data.sh local ./backups/latest_local.json

# 验证数据
dfx canister call icp_chat_backend getDataStats
```

---

## 📊 最佳实践总结

### ✅ 必须做的

1. **始终使用升级模式**：`--upgrade-unchanged`
2. **部署前备份**：使用 `safe-deploy.sh` 或手动备份
3. **验证数据**：部署后检查数据是否保留
4. **定期备份**：重要数据定期备份

### ❌ 禁止做的

1. **不要使用 `dfx deploy` 不加 `--upgrade-unchanged`**
2. **不要使用 `dfx start --clean`**（会删除所有数据）
3. **不要删除备份文件**
4. **不要在主网随意重新创建 canister**

### 🎯 推荐做的

1. **使用安全部署脚本**：`./safe-deploy.sh`
2. **保留多个备份版本**：至少保留 7 天
3. **定期测试恢复流程**：确保备份可用
4. **监控数据变化**：使用 `getDataStats` 监控

---

## 🔐 额外安全措施

### 1. 外部存储备份

可以将备份文件保存到：
- 云存储（GitHub、GitLab、Dropbox 等）
- 本地多个位置
- 版本控制系统（Git）

### 2. 自动化备份

可以设置定时任务（cron）：

```bash
# 每天凌晨 2 点自动备份主网数据
0 2 * * * cd /path/to/icp_chat && ./backup-data.sh ic
```

### 3. 监控和告警

可以添加监控脚本，检测：
- 数据量异常变化
- Canister 状态异常
- Cycles 余额不足

---

## 📞 紧急情况处理

如果数据已经丢失：

1. **立即停止操作**：避免进一步数据丢失
2. **检查备份文件**：`ls -lh ./backups/`
3. **恢复数据**：`./restore-data.sh`
4. **验证恢复**：检查数据是否完整
5. **分析原因**：找出数据丢失的原因，避免再次发生

---

## 📚 相关文档

- `DEPLOY_COMMANDS.md` - 完整部署命令
- `DATA_PERSISTENCE.md` - 数据持久化说明
- `DEPLOYMENT.md` - 部署指南

---

## ✅ 总结

通过多层保护机制：
1. ✅ **正确的部署方式**（基础）
2. ✅ **自动备份功能**（推荐）
3. ✅ **手动备份工具**（额外保障）
4. ✅ **数据恢复功能**（紧急恢复）
5. ✅ **数据验证功能**（监控）

**现在你的数据有多层保护，大大降低了丢失风险！**

