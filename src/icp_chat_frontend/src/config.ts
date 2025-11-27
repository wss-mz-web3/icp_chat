// 环境配置
// 优先使用 import.meta.env（Vite），如果没有则使用全局变量（DFX 注入）

// 从 .env 文件加载配置（DFX 会自动生成）
// 在浏览器环境中，DFX 会将环境变量注入到 window 对象
declare global {
  interface Window {
    __CANISTER_IDS__?: {
      icp_chat_backend?: string;
    };
    __ICP_ENV__?: {
      DFX_NETWORK?: string;
      CANISTER_ID_ICP_CHAT_BACKEND?: string;
    };
    process?: {
      env?: {
        DFX_NETWORK?: string;
        CANISTER_ID_ICP_CHAT_BACKEND?: string;
      };
    };
  }
}

export const config = {
  get canisterId(): string {
    // 尝试多种方式获取 canister ID
    // 1. Vite 环境变量（开发/构建时）- 由 vite.config.ts 注入
    if (typeof import.meta !== 'undefined') {
      const env = import.meta.env as Record<string, string>;
      const id = env.VITE_CANISTER_ID_ICP_CHAT_BACKEND;
      if (id) {
        return id;
      }
    }
    // 2. Node.js 环境变量（构建时）
    if (typeof process !== 'undefined' && process.env?.CANISTER_ID_ICP_CHAT_BACKEND) {
      const id = process.env.CANISTER_ID_ICP_CHAT_BACKEND;
      if (id) {
        return id;
      }
    }
    // 3. 从 window.__ICP_ENV__ 获取（HTML 中注入）
    if (typeof window !== 'undefined' && window.__ICP_ENV__?.CANISTER_ID_ICP_CHAT_BACKEND) {
      const id = window.__ICP_ENV__.CANISTER_ID_ICP_CHAT_BACKEND;
      if (id) {
        return id;
      }
    }
    // 4. 从 window.__CANISTER_IDS__ 获取（DFX 可能注入）
    if (typeof window !== 'undefined' && window.__CANISTER_IDS__?.icp_chat_backend) {
      const id = window.__CANISTER_IDS__.icp_chat_backend;
      if (id) {
        return id;
      }
    }
    // 5. 从全局变量获取（DFX 可能注入）
    if (typeof window !== 'undefined' && (window as any).CANISTER_ID_ICP_CHAT_BACKEND) {
      const id = (window as any).CANISTER_ID_ICP_CHAT_BACKEND;
      if (id) {
        return id;
      }
    }
    return '';
  },
  get network(): string {
    // 尝试多种方式获取网络类型
    if (typeof import.meta !== 'undefined') {
      const env = import.meta.env as Record<string, string>;
      const network = env.VITE_DFX_NETWORK;
      if (network) {
        return network;
      }
    }
    if (typeof process !== 'undefined' && process.env?.DFX_NETWORK) {
      return process.env.DFX_NETWORK;
    }
    if (typeof window !== 'undefined' && window.__ICP_ENV__?.DFX_NETWORK) {
      return window.__ICP_ENV__.DFX_NETWORK;
    }
    if (typeof window !== 'undefined' && window.process?.env?.DFX_NETWORK) {
      return window.process.env.DFX_NETWORK;
    }
    // 默认本地网络
    return 'local';
  },
  get host(): string {
    return this.network === 'ic' ? 'https://icp-api.io' : 'http://localhost:4943';
  },
};
