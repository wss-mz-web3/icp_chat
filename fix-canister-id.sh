#!/bin/bash

# 修复 canister_not_found 错误的脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NETWORK="${1:-local}"  # local 或 ic

echo -e "${GREEN}=== 修复 Canister Not Found 错误 ===${NC}"
echo ""

# 检查网络参数
if [ "$NETWORK" != "local" ] && [ "$NETWORK" != "ic" ]; then
    echo -e "${RED}错误：网络参数必须是 'local' 或 'ic'${NC}"
    echo "用法: $0 [local|ic]"
    exit 1
fi

# 设置网络参数
if [ "$NETWORK" == "ic" ]; then
    NETWORK_FLAG="--network ic"
    echo -e "${YELLOW}修复主网配置...${NC}"
else
    NETWORK_FLAG=""
    echo -e "${YELLOW}修复本地配置...${NC}"
fi

# 步骤 1: 检查 canister 状态
echo -e "${BLUE}[1/5] 检查 canister 状态...${NC}"
if ! dfx canister $NETWORK_FLAG status icp_chat_backend > /dev/null 2>&1; then
    echo -e "${RED}错误：canister icp_chat_backend 不存在或无法访问${NC}"
    echo "请先部署 canister: dfx deploy $NETWORK_FLAG icp_chat_backend"
    exit 1
fi

BACKEND_ID=$(dfx canister $NETWORK_FLAG id icp_chat_backend)
FRONTEND_ID=$(dfx canister $NETWORK_FLAG id icp_chat_frontend 2>/dev/null || echo "")

echo "后端 Canister ID: $BACKEND_ID"
if [ -n "$FRONTEND_ID" ]; then
    echo "前端 Canister ID: $FRONTEND_ID"
fi
echo ""

# 步骤 2: 检查 .env 文件
echo -e "${BLUE}[2/5] 检查 .env 文件...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，将重新生成...${NC}"
    dfx deploy $NETWORK_FLAG icp_chat_backend --no-wallet
else
    CURRENT_BACKEND_ID=$(grep -E "^CANISTER_ID_ICP_CHAT_BACKEND=" .env | cut -d'=' -f2 | tr -d "'\"")
    if [ "$CURRENT_BACKEND_ID" != "$BACKEND_ID" ]; then
        echo -e "${YELLOW}⚠️  .env 中的 canister ID 不匹配，将更新...${NC}"
        echo "当前: $CURRENT_BACKEND_ID"
        echo "正确: $BACKEND_ID"
    else
        echo -e "${GREEN}✅ .env 文件中的 canister ID 正确${NC}"
    fi
fi
echo ""

# 步骤 3: 更新 .env 文件
echo -e "${BLUE}[3/5] 更新 .env 文件...${NC}"
# 重新部署以更新 .env
dfx deploy $NETWORK_FLAG icp_chat_backend --no-wallet > /dev/null 2>&1 || true
echo -e "${GREEN}✅ .env 文件已更新${NC}"
echo ""

# 步骤 4: 检查前端构建
echo -e "${BLUE}[4/5] 检查前端构建配置...${NC}"
cd src/icp_chat_frontend

# 检查是否需要重新构建
NEED_REBUILD=false
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  前端未构建，需要构建...${NC}"
    NEED_REBUILD=true
else
    # 检查构建时间
    BUILD_TIME=$(stat -f "%m" dist 2>/dev/null || stat -c "%Y" dist 2>/dev/null || echo "0")
    ENV_TIME=$(stat -f "%m" ../../.env 2>/dev/null || stat -c "%Y" ../../.env 2>/dev/null || echo "0")
    
    if [ "$ENV_TIME" -gt "$BUILD_TIME" ]; then
        echo -e "${YELLOW}⚠️  .env 文件比构建文件新，需要重新构建...${NC}"
        NEED_REBUILD=true
    else
        echo -e "${GREEN}✅ 前端构建文件是最新的${NC}"
    fi
fi

cd ../..
echo ""

# 步骤 5: 重新构建前端（如果需要）
if [ "$NEED_REBUILD" == "true" ]; then
    echo -e "${BLUE}[5/5] 重新构建前端...${NC}"
    cd src/icp_chat_frontend
    npm run build
    cd ../..
    echo -e "${GREEN}✅ 前端构建完成${NC}"
else
    echo -e "${BLUE}[5/5] 跳过前端构建（已是最新）${NC}"
fi
echo ""

# 完成
echo -e "${GREEN}=== 修复完成 ===${NC}"
echo ""
echo "下一步："
echo "1. 如果使用开发服务器，重启: cd src/icp_chat_frontend && npm run dev"
echo "2. 如果使用部署版本，重新部署前端: dfx deploy $NETWORK_FLAG icp_chat_frontend"
echo ""
echo "验证："
echo "- 打开浏览器控制台，查看 '[Config]' 日志"
echo "- 确认显示的 canister ID 是: $BACKEND_ID"
echo "- 确认网络类型是: $NETWORK"

