#!/bin/bash

# 数据恢复脚本
# 用于从备份文件恢复数据

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
NETWORK="${1:-local}"  # local 或 ic
BACKUP_FILE="${2:-}"

echo -e "${GREEN}=== ICP Chat 数据恢复工具 ===${NC}"
echo ""

# 检查网络参数
if [ "$NETWORK" != "local" ] && [ "$NETWORK" != "ic" ]; then
    echo -e "${RED}错误：网络参数必须是 'local' 或 'ic'${NC}"
    echo "用法: $0 [local|ic] [backup_file.json]"
    exit 1
fi

# 设置网络参数
if [ "$NETWORK" == "ic" ]; then
    NETWORK_FLAG="--network ic"
    echo -e "${YELLOW}恢复主网数据...${NC}"
else
    NETWORK_FLAG=""
    echo -e "${YELLOW}恢复本地数据...${NC}"
fi

# 如果没有指定备份文件，使用最新的备份
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE="./backups/latest_${NETWORK}.json"
    echo "未指定备份文件，使用最新备份: $BACKUP_FILE"
fi

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}错误：备份文件不存在: $BACKUP_FILE${NC}"
    echo ""
    echo "可用的备份文件："
    ls -lh ./backups/*.json 2>/dev/null || echo "（无备份文件）"
    exit 1
fi

# 显示备份文件信息
echo "备份文件: $BACKUP_FILE"
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "文件大小: $FILE_SIZE"
echo ""

# 读取备份文件
BACKUP_DATA=$(cat "$BACKUP_FILE")

# 显示备份内容摘要
echo -e "${BLUE}备份内容摘要：${NC}"
echo "$BACKUP_DATA" | jq '{messageCount, profileCount, nextId, nextImageId}' 2>/dev/null || echo "（无法解析 JSON）"
echo ""

# 确认恢复
echo -e "${YELLOW}⚠️  警告：这将恢复数据到 canister${NC}"
echo -e "${YELLOW}   如果 canister 中已有数据，将会合并或替换${NC}"
read -p "确认继续？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "已取消恢复操作"
    exit 0
fi

# 检查 canister 状态
echo ""
echo "检查 canister 状态..."
if ! dfx canister $NETWORK_FLAG status icp_chat_backend > /dev/null 2>&1; then
    echo -e "${RED}错误：canister icp_chat_backend 不存在或无法访问${NC}"
    echo "请先部署 canister: dfx deploy $NETWORK_FLAG icp_chat_backend"
    exit 1
fi

# 提取消息数据
echo "准备恢复数据..."
MESSAGES=$(echo "$BACKUP_DATA" | jq -c '.messages' 2>/dev/null)
NEXT_ID=$(echo "$BACKUP_DATA" | jq -r '.nextId' 2>/dev/null)

if [ -z "$MESSAGES" ] || [ "$MESSAGES" == "null" ]; then
    echo -e "${RED}错误：备份文件中没有消息数据${NC}"
    exit 1
fi

# 恢复消息
echo "恢复消息数据..."
echo -e "${YELLOW}正在导入消息（这可能需要一些时间）...${NC}"

# 使用 importMessages 导入（合并模式）
IMPORT_RESULT=$(dfx canister $NETWORK_FLAG call icp_chat_backend importMessages "($MESSAGES, $NEXT_ID)" 2>/dev/null)

if [ -z "$IMPORT_RESULT" ]; then
    echo -e "${RED}错误：数据恢复失败${NC}"
    exit 1
fi

# 检查结果
if echo "$IMPORT_RESULT" | grep -q "ok"; then
    echo -e "${GREEN}✅ 数据恢复成功！${NC}"
else
    echo -e "${RED}❌ 数据恢复失败${NC}"
    echo "错误信息: $IMPORT_RESULT"
    exit 1
fi

# 验证恢复结果
echo ""
echo "验证恢复结果..."
STATS=$(dfx canister $NETWORK_FLAG call icp_chat_backend getDataStats 2>/dev/null)
echo "当前数据统计："
echo "$STATS" | jq '.' 2>/dev/null || echo "$STATS"

echo ""
echo -e "${GREEN}恢复完成！${NC}"

