# 数据备份和恢复指南

## 🚨 重要：防止数据丢失的多重保护措施

数据丢失是一个严重问题。本文档提供了**多重保护措施**，确保数据安全。

---

## 📦 方案 1：使用正确的部署命令（最重要）

### 本地环境

```bash
# ✅ 正确：升级部署（保留数据）
dfx deploy --upgrade-unchanged icp_chat_backend

# ❌ 错误：可能丢失数据
dfx deploy icp_chat_backend
```

### 主网环境

```bash
# ✅ 正确：升级部署（保留数据）
dfx deploy --network ic --upgrade-unchanged icp_chat_backend

# ❌ 错误：可能丢失数据
dfx deploy --network ic icp_chat_backend
```

---

## 💾 方案 2：部署前数据备份

### 自动备份脚本

创建备份脚本 `backup-before-deploy.sh`：

```bash
#!/bin/bash
# 部署前自动备份脚本

set -e  # 遇到错误立即退出

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "📦 开始备份数据..."

# 检查 canister 是否存在
if dfx canister id icp_chat_backend > /dev/null 2>&1; then
    echo "✅ Canister 存在，开始导出数据..."
    
    # 导出所有数据
    dfx canister call icp_chat_backend exportAllData > "$BACKUP_FILE"
    
    # 检查数据完整性
    dfx canister call icp_chat_backend checkDataIntegrity >> "$BACKUP_FILE"
    
    echo "✅ 备份完成: $BACKUP_FILE"
    
    # 显示备份信息
    echo "📊 备份信息:"
    cat "$BACKUP_FILE" | head -20
    
    # 询问是否继续部署
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "⚠️  Canister 不存在，这是首次部署"
fi

echo "🚀 开始部署..."
```

### 主网备份脚本

创建 `backup-before-deploy-mainnet.sh`：

```bash
#!/bin/bash
# 主网部署前自动备份脚本

set -e

BACKUP_DIR="./backups/mainnet"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

mkdir -p "$BACKUP_DIR"

echo "📦 开始备份主网数据..."

if dfx canister --network ic id icp_chat_backend > /dev/null 2>&1; then
    echo "✅ Canister 存在，开始导出数据..."
    
    dfx canister --network ic call icp_chat_backend exportAllData > "$BACKUP_FILE"
    dfx canister --network ic call icp_chat_backend checkDataIntegrity >> "$BACKUP_FILE"
    
    echo "✅ 备份完成: $BACKUP_FILE"
    
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "⚠️  Canister 不存在，这是首次部署"
fi

echo "🚀 开始部署..."
```

### 使用备份脚本

```bash
# 本地部署前备份
chmod +x backup-before-deploy.sh
./backup-before-deploy.sh
dfx deploy --upgrade-unchanged icp_chat_backend

# 主网部署前备份
chmod +x backup-before-deploy-mainnet.sh
./backup-before-deploy-mainnet.sh
dfx deploy --network ic --upgrade-unchanged icp_chat_backend
```

---

## 🔄 方案 3：部署后数据验证

### 验证脚本

创建 `verify-after-deploy.sh`：

```bash
#!/bin/bash
# 部署后数据验证脚本

set -e

echo "🔍 验证部署后的数据..."

# 检查消息数量
MESSAGE_COUNT=$(dfx canister call icp_chat_backend getMessageCount | grep -o '[0-9]*' | head -1)

if [ -z "$MESSAGE_COUNT" ]; then
    echo "❌ 无法获取消息数量"
    exit 1
fi

echo "📊 当前消息数量: $MESSAGE_COUNT"

# 检查数据完整性
INTEGRITY=$(dfx canister call icp_chat_backend checkDataIntegrity)

echo "📋 数据完整性检查:"
echo "$INTEGRITY"

# 检查是否有数据丢失
if [ "$MESSAGE_COUNT" -eq 0 ]; then
    echo "⚠️  警告：消息数量为 0，可能数据已丢失！"
    echo "💡 建议：检查备份文件并考虑恢复数据"
    exit 1
else
    echo "✅ 数据验证通过，消息数量: $MESSAGE_COUNT"
fi
```

### 主网验证脚本

创建 `verify-after-deploy-mainnet.sh`：

```bash
#!/bin/bash
# 主网部署后数据验证脚本

set -e

echo "🔍 验证主网部署后的数据..."

MESSAGE_COUNT=$(dfx canister --network ic call icp_chat_backend getMessageCount | grep -o '[0-9]*' | head -1)

if [ -z "$MESSAGE_COUNT" ]; then
    echo "❌ 无法获取消息数量"
    exit 1
fi

echo "📊 当前消息数量: $MESSAGE_COUNT"

INTEGRITY=$(dfx canister --network ic call icp_chat_backend checkDataIntegrity)
echo "📋 数据完整性检查:"
echo "$INTEGRITY"

if [ "$MESSAGE_COUNT" -eq 0 ]; then
    echo "⚠️  警告：消息数量为 0，可能数据已丢失！"
    exit 1
else
    echo "✅ 数据验证通过"
fi
```

---

## 🔧 方案 4：数据恢复

### 从备份恢复数据

如果数据丢失，可以从备份恢复：

```bash
# 1. 查看备份文件
ls -lh backups/

# 2. 选择要恢复的备份文件
BACKUP_FILE="backups/backup_20241202_120000.json"

# 3. 提取消息数据（需要手动处理 JSON）
# 注意：这是一个示例，实际需要根据备份文件格式调整

# 4. 导入数据（需要先清空现有数据）
dfx canister call icp_chat_backend clearAllMessages
# 然后使用 importMessages 导入（需要手动构造参数）
```

### 手动恢复步骤

1. **导出备份数据**：
   ```bash
   dfx canister call icp_chat_backend exportAllData > backup.json
   ```

2. **检查备份文件**：
   ```bash
   cat backup.json
   ```

3. **如果需要恢复**：
   - 先清空现有数据（谨慎操作）
   - 使用 `importMessages` 函数导入数据

---

## 🛡️ 方案 5：安全的部署脚本

### 完整的安全部署脚本

创建 `safe-deploy.sh`：

```bash
#!/bin/bash
# 安全部署脚本（包含备份、部署、验证）

set -e  # 遇到错误立即退出

NETWORK=${1:-local}  # 默认本地网络
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 开始安全部署流程..."
echo "📡 网络: $NETWORK"

# 步骤 1: 备份数据
echo ""
echo "📦 步骤 1: 备份数据"
mkdir -p "$BACKUP_DIR"

if [ "$NETWORK" = "ic" ]; then
    CANISTER_CMD="dfx canister --network ic"
    DEPLOY_CMD="dfx deploy --network ic --upgrade-unchanged"
else
    CANISTER_CMD="dfx canister"
    DEPLOY_CMD="dfx deploy --upgrade-unchanged"
fi

if $CANISTER_CMD id icp_chat_backend > /dev/null 2>&1; then
    BACKUP_FILE="$BACKUP_DIR/backup_${NETWORK}_${TIMESTAMP}.json"
    echo "✅ Canister 存在，导出数据到: $BACKUP_FILE"
    
    $CANISTER_CMD call icp_chat_backend exportAllData > "$BACKUP_FILE"
    $CANISTER_CMD call icp_chat_backend checkDataIntegrity >> "$BACKUP_FILE"
    
    echo "✅ 备份完成"
    
    # 显示备份摘要
    MESSAGE_COUNT=$(grep -o '"messageCount" : [0-9]*' "$BACKUP_FILE" | grep -o '[0-9]*' | head -1)
    echo "📊 备份的消息数量: ${MESSAGE_COUNT:-0}"
else
    echo "⚠️  Canister 不存在，这是首次部署"
fi

# 步骤 2: 部署
echo ""
echo "🚀 步骤 2: 部署后端"
$DEPLOY_CMD icp_chat_backend

# 步骤 3: 验证数据
echo ""
echo "🔍 步骤 3: 验证数据"

sleep 2  # 等待 canister 就绪

MESSAGE_COUNT=$($CANISTER_CMD call icp_chat_backend getMessageCount | grep -o '[0-9]*' | head -1)

if [ -z "$MESSAGE_COUNT" ]; then
    echo "❌ 无法获取消息数量"
    exit 1
fi

echo "📊 部署后消息数量: $MESSAGE_COUNT"

if [ "$MESSAGE_COUNT" -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_MSG_COUNT=$(grep -o '"messageCount" : [0-9]*' "$BACKUP_FILE" | grep -o '[0-9]*' | head -1)
    if [ ! -z "$BACKUP_MSG_COUNT" ] && [ "$BACKUP_MSG_COUNT" -gt 0 ]; then
        echo "⚠️  警告：数据可能丢失！"
        echo "📦 备份文件: $BACKUP_FILE"
        echo "💡 建议：检查部署日志并考虑恢复数据"
        exit 1
    fi
fi

echo "✅ 部署完成，数据验证通过"

# 步骤 4: 部署前端（如果需要）
read -p "是否部署前端？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 步骤 4: 部署前端"
    cd src/icp_chat_frontend
    npm run build
    cd ../..
    $DEPLOY_CMD icp_chat_frontend
    echo "✅ 前端部署完成"
fi

echo ""
echo "✅ 所有部署完成！"
```

### 使用安全部署脚本

```bash
# 本地部署
chmod +x safe-deploy.sh
./safe-deploy.sh local

# 主网部署
./safe-deploy.sh ic
```

---

## 📋 方案 6：定期自动备份

### 定时备份脚本

创建 `auto-backup.sh`：

```bash
#!/bin/bash
# 自动备份脚本（可添加到 crontab）

BACKUP_DIR="./backups/auto"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NETWORK=${1:-local}

mkdir -p "$BACKUP_DIR"

if [ "$NETWORK" = "ic" ]; then
    CANISTER_CMD="dfx canister --network ic"
    BACKUP_FILE="$BACKUP_DIR/mainnet_${TIMESTAMP}.json"
else
    CANISTER_CMD="dfx canister"
    BACKUP_FILE="$BACKUP_DIR/local_${TIMESTAMP}.json"
fi

if $CANISTER_CMD id icp_chat_backend > /dev/null 2>&1; then
    $CANISTER_CMD call icp_chat_backend exportAllData > "$BACKUP_FILE"
    echo "✅ 自动备份完成: $BACKUP_FILE"
    
    # 只保留最近 30 天的备份
    find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete
else
    echo "⚠️  Canister 不存在，跳过备份"
fi
```

### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点自动备份（本地）
0 2 * * * cd /path/to/icp_chat && ./auto-backup.sh local

# 添加每天凌晨 3 点自动备份（主网）
0 3 * * * cd /path/to/icp_chat && ./auto-backup.sh ic
```

---

## 🔐 方案 7：部署前检查清单

### 部署检查清单脚本

创建 `pre-deploy-checklist.sh`：

```bash
#!/bin/bash
# 部署前检查清单

NETWORK=${1:-local}
ERRORS=0

echo "📋 部署前检查清单"
echo "=================="

# 1. 检查网络连接
echo ""
echo "1. 检查网络连接..."
if [ "$NETWORK" = "ic" ]; then
    if dfx ping --network ic > /dev/null 2>&1; then
        echo "   ✅ 主网连接正常"
    else
        echo "   ❌ 主网连接失败"
        ERRORS=$((ERRORS + 1))
    fi
else
    if dfx ping > /dev/null 2>&1; then
        echo "   ✅ 本地网络连接正常"
    else
        echo "   ❌ 本地网络未运行，请运行: dfx start --background"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 2. 检查身份
echo ""
echo "2. 检查身份..."
if [ "$NETWORK" = "ic" ]; then
    IDENTITY=$(dfx identity whoami 2>/dev/null)
    if [ ! -z "$IDENTITY" ]; then
        echo "   ✅ 当前身份: $IDENTITY"
    else
        echo "   ❌ 未设置身份"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 3. 检查 cycles（主网）
if [ "$NETWORK" = "ic" ]; then
    echo ""
    echo "3. 检查 cycles 余额..."
    BALANCE=$(dfx wallet --network ic balance 2>/dev/null | grep -o '[0-9.]*' | head -1)
    if [ ! -z "$BALANCE" ]; then
        echo "   ✅ Cycles 余额: $BALANCE"
        # 检查是否足够（至少 1T）
        if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
            echo "   ⚠️  警告：Cycles 余额较低，建议充值"
        fi
    else
        echo "   ❌ 无法获取 cycles 余额"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 4. 检查 canister 状态
echo ""
echo "4. 检查 canister 状态..."
if [ "$NETWORK" = "ic" ]; then
    CANISTER_CMD="dfx canister --network ic"
else
    CANISTER_CMD="dfx canister"
fi

if $CANISTER_CMD id icp_chat_backend > /dev/null 2>&1; then
    echo "   ✅ Canister 存在"
    
    # 检查数据
    MESSAGE_COUNT=$($CANISTER_CMD call icp_chat_backend getMessageCount 2>/dev/null | grep -o '[0-9]*' | head -1)
    if [ ! -z "$MESSAGE_COUNT" ]; then
        echo "   📊 当前消息数量: $MESSAGE_COUNT"
        if [ "$MESSAGE_COUNT" -gt 0 ]; then
            echo "   ⚠️  注意：当前有 $MESSAGE_COUNT 条消息，确保使用 --upgrade-unchanged 部署"
        fi
    fi
else
    echo "   ℹ️  Canister 不存在，这是首次部署"
fi

# 5. 检查代码变更
echo ""
echo "5. 检查代码变更..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
        echo "   ⚠️  有未提交的代码变更"
    else
        echo "   ✅ 代码已提交"
    fi
else
    echo "   ℹ️  不是 git 仓库"
fi

# 总结
echo ""
echo "=================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ 检查通过，可以部署"
    exit 0
else
    echo "❌ 发现 $ERRORS 个问题，请先解决"
    exit 1
fi
```

---

## 📊 方案 8：监控和告警

### 数据监控脚本

创建 `monitor-data.sh`：

```bash
#!/bin/bash
# 数据监控脚本

NETWORK=${1:-local}

if [ "$NETWORK" = "ic" ]; then
    CANISTER_CMD="dfx canister --network ic"
else
    CANISTER_CMD="dfx canister"
fi

MESSAGE_COUNT=$($CANISTER_CMD call icp_chat_backend getMessageCount 2>/dev/null | grep -o '[0-9]*' | head -1)
INTEGRITY=$($CANISTER_CMD call icp_chat_backend checkDataIntegrity 2>/dev/null)

echo "📊 数据监控报告"
echo "=================="
echo "消息数量: $MESSAGE_COUNT"
echo "数据完整性:"
echo "$INTEGRITY"
```

---

## 🎯 最佳实践总结

### 部署流程（推荐）

1. **部署前**：
   ```bash
   ./pre-deploy-checklist.sh ic        # 检查清单
   ./backup-before-deploy-mainnet.sh   # 备份数据
   ```

2. **部署**：
   ```bash
   ./safe-deploy.sh ic                 # 安全部署（包含验证）
   ```

3. **部署后**：
   ```bash
   ./verify-after-deploy-mainnet.sh    # 验证数据
   ./monitor-data.sh ic                # 监控数据
   ```

### 关键原则

1. ✅ **始终使用 `--upgrade-unchanged`**
2. ✅ **部署前备份数据**
3. ✅ **部署后验证数据**
4. ✅ **定期自动备份**
5. ✅ **使用安全部署脚本**

---

## 🆘 紧急恢复

如果数据已经丢失：

1. **检查备份文件**：
   ```bash
   ls -lh backups/
   ```

2. **查看最新备份**：
   ```bash
   cat backups/backup_*.json | tail -50
   ```

3. **联系技术支持**：如果备份也无法恢复，可能需要从其他来源恢复

---

## 📚 相关文档

- `DATA_PERSISTENCE.md` - 数据持久化说明
- `DEPLOY_COMMANDS.md` - 完整部署命令
- `DEPLOYMENT.md` - 部署指南

---

**记住：预防胜于治疗！始终在部署前备份数据！**

