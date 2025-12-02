#!/bin/bash

# 数据备份脚本
# 用于在部署前备份所有数据，防止数据丢失

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
NETWORK="${1:-local}"  # local 或 ic
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${NETWORK}_${TIMESTAMP}.json"

echo -e "${GREEN}=== ICP Chat 数据备份工具 ===${NC}"
echo ""

# 检查网络参数
if [ "$NETWORK" != "local" ] && [ "$NETWORK" != "ic" ]; then
    echo -e "${RED}错误：网络参数必须是 'local' 或 'ic'${NC}"
    echo "用法: $0 [local|ic]"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 设置网络参数
if [ "$NETWORK" == "ic" ]; then
    NETWORK_FLAG="--network ic"
    echo -e "${YELLOW}备份主网数据...${NC}"
else
    NETWORK_FLAG=""
    echo -e "${YELLOW}备份本地数据...${NC}"
fi

# 检查 canister 是否存在
echo "检查 canister 状态..."
if ! dfx canister $NETWORK_FLAG status icp_chat_backend > /dev/null 2>&1; then
    echo -e "${RED}错误：canister icp_chat_backend 不存在或无法访问${NC}"
    exit 1
fi

# 获取数据统计
echo "获取数据统计..."
STATS=$(dfx canister $NETWORK_FLAG call icp_chat_backend getDataStats 2>/dev/null || echo "null")

if [ "$STATS" == "null" ]; then
    echo -e "${RED}错误：无法获取数据统计，请检查 canister 状态${NC}"
    exit 1
fi

echo "数据统计："
echo "$STATS" | jq '.' 2>/dev/null || echo "$STATS"

# 导出数据
echo ""
echo "导出数据..."
EXPORT_RESULT=$(dfx canister $NETWORK_FLAG call icp_chat_backend exportAllData 2>/dev/null)

if [ -z "$EXPORT_RESULT" ]; then
    echo -e "${RED}错误：数据导出失败${NC}"
    exit 1
fi

# 保存到文件
echo "$EXPORT_RESULT" > "$BACKUP_FILE"

# 验证备份文件
if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}错误：备份文件创建失败${NC}"
    exit 1
fi

# 获取文件大小
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}✅ 备份完成！${NC}"
echo "备份文件: $BACKUP_FILE"
echo "文件大小: $FILE_SIZE"
echo ""
echo "备份内容："
echo "$EXPORT_RESULT" | jq '{messageCount, profileCount, nextId, nextImageId}' 2>/dev/null || echo "（无法解析 JSON）"

# 创建最新备份的符号链接
LATEST_LINK="${BACKUP_DIR}/latest_${NETWORK}.json"
ln -sf "$(basename "$BACKUP_FILE")" "$LATEST_LINK"
echo ""
echo "最新备份链接: $LATEST_LINK"

