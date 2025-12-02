#!/bin/bash

# 安全部署脚本
# 自动备份数据 -> 部署 -> 验证数据

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
NETWORK="${1:-local}"  # local 或 ic
DEPLOY_BACKEND="${2:-true}"  # 是否部署后端
DEPLOY_FRONTEND="${3:-true}"  # 是否部署前端

echo -e "${GREEN}=== ICP Chat 安全部署工具 ===${NC}"
echo ""

# 检查网络参数
if [ "$NETWORK" != "local" ] && [ "$NETWORK" != "ic" ]; then
    echo -e "${RED}错误：网络参数必须是 'local' 或 'ic'${NC}"
    echo "用法: $0 [local|ic] [deploy_backend] [deploy_frontend]"
    exit 1
fi

# 设置网络参数
if [ "$NETWORK" == "ic" ]; then
    NETWORK_FLAG="--network ic"
    echo -e "${YELLOW}部署到主网...${NC}"
else
    NETWORK_FLAG=""
    echo -e "${YELLOW}部署到本地网络...${NC}"
fi

# 步骤 1: 检查 canister 状态
echo -e "${BLUE}[1/6] 检查 canister 状态...${NC}"
if dfx canister $NETWORK_FLAG status icp_chat_backend > /dev/null 2>&1; then
    echo "✅ canister 已存在，将使用升级模式"
    UPGRADE_MODE="--upgrade-unchanged"
    
    # 获取当前数据统计
    echo "获取当前数据统计..."
    CURRENT_STATS=$(dfx canister $NETWORK_FLAG call icp_chat_backend getDataStats 2>/dev/null || echo "null")
    if [ "$CURRENT_STATS" != "null" ]; then
        echo "当前数据："
        echo "$CURRENT_STATS" | jq '{messageCount, profileCount}' 2>/dev/null || echo "$CURRENT_STATS"
    fi
else
    echo "ℹ️  canister 不存在，将创建新的 canister"
    UPGRADE_MODE=""
fi
echo ""

# 步骤 2: 备份数据（如果 canister 存在）
if [ -n "$UPGRADE_MODE" ]; then
    echo -e "${BLUE}[2/6] 备份数据...${NC}"
    if [ -f "./backup-data.sh" ]; then
        chmod +x ./backup-data.sh
        ./backup-data.sh "$NETWORK" || {
            echo -e "${YELLOW}⚠️  备份失败，但继续部署...${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  备份脚本不存在，跳过备份${NC}"
    fi
    echo ""
else
    echo -e "${BLUE}[2/6] 跳过备份（首次部署）...${NC}"
    echo ""
fi

# 步骤 3: 部署后端
if [ "$DEPLOY_BACKEND" == "true" ]; then
    echo -e "${BLUE}[3/6] 部署后端...${NC}"
    if [ -n "$UPGRADE_MODE" ]; then
        echo "使用升级模式部署（保留数据）..."
        dfx deploy $NETWORK_FLAG $UPGRADE_MODE icp_chat_backend
    else
        echo "首次部署..."
        dfx deploy $NETWORK_FLAG icp_chat_backend
    fi
    echo -e "${GREEN}✅ 后端部署完成${NC}"
    echo ""
else
    echo -e "${BLUE}[3/6] 跳过后端部署...${NC}"
    echo ""
fi

# 步骤 4: 构建前端
if [ "$DEPLOY_FRONTEND" == "true" ]; then
    echo -e "${BLUE}[4/6] 构建前端...${NC}"
    cd src/icp_chat_frontend
    npm run build
    cd ../..
    echo -e "${GREEN}✅ 前端构建完成${NC}"
    echo ""
else
    echo -e "${BLUE}[4/6] 跳过前端构建...${NC}"
    echo ""
fi

# 步骤 5: 部署前端
if [ "$DEPLOY_FRONTEND" == "true" ]; then
    echo -e "${BLUE}[5/6] 部署前端...${NC}"
    if [ -n "$UPGRADE_MODE" ]; then
        dfx deploy $NETWORK_FLAG $UPGRADE_MODE icp_chat_frontend
    else
        dfx deploy $NETWORK_FLAG icp_chat_frontend
    fi
    echo -e "${GREEN}✅ 前端部署完成${NC}"
    echo ""
else
    echo -e "${BLUE}[5/6] 跳过前端部署...${NC}"
    echo ""
fi

# 步骤 6: 验证数据
echo -e "${BLUE}[6/6] 验证数据...${NC}"
if [ -n "$UPGRADE_MODE" ]; then
    echo "检查数据是否保留..."
    NEW_STATS=$(dfx canister $NETWORK_FLAG call icp_chat_backend getDataStats 2>/dev/null || echo "null")
    if [ "$NEW_STATS" != "null" ]; then
        echo "部署后数据："
        echo "$NEW_STATS" | jq '{messageCount, profileCount}' 2>/dev/null || echo "$NEW_STATS"
        
        # 比较数据
        if [ "$CURRENT_STATS" != "null" ]; then
            CURRENT_COUNT=$(echo "$CURRENT_STATS" | jq -r '.messageCount' 2>/dev/null || echo "0")
            NEW_COUNT=$(echo "$NEW_STATS" | jq -r '.messageCount' 2>/dev/null || echo "0")
            
            if [ "$CURRENT_COUNT" == "$NEW_COUNT" ]; then
                echo -e "${GREEN}✅ 数据完整保留（消息数量: $NEW_COUNT）${NC}"
            else
                echo -e "${YELLOW}⚠️  消息数量变化：$CURRENT_COUNT -> $NEW_COUNT${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  无法获取数据统计${NC}"
    fi
else
    echo "首次部署，无需验证数据"
fi
echo ""

# 完成
echo -e "${GREEN}=== 部署完成 ===${NC}"
if [ "$NETWORK" == "ic" ]; then
    FRONTEND_ID=$(dfx canister --network ic id icp_chat_frontend 2>/dev/null || echo "")
    if [ -n "$FRONTEND_ID" ]; then
        echo "前端 URL: https://${FRONTEND_ID}.ic0.app"
    fi
else
    echo "本地开发服务器: cd src/icp_chat_frontend && npm run dev"
fi
