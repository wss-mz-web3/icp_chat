import { AuthClient } from '@dfinity/auth-client';

class AuthService {
  private clientPromise: Promise<AuthClient> | null = null;

  private async getClient(): Promise<AuthClient> {
    // 检查浏览器是否支持 Web Crypto（II 依赖）
    if (
      typeof window === 'undefined' ||
      typeof (window as any).crypto === 'undefined' ||
      !(window as any).crypto.subtle
    ) {
      throw new Error(
        '当前环境不支持 Internet Identity（缺少 Web Crypto）。请使用支持 crypto.subtle 的浏览器，并通过 HTTPS 或 localhost 访问。',
      );
    }

    if (!this.clientPromise) {
      this.clientPromise = AuthClient.create();
    }
    return this.clientPromise;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const client = await this.getClient();
      return client.isAuthenticated();
    } catch (e) {
      console.warn('[AuthService] 当前环境不支持 II，视为未登录:', e);
      return false;
    }
  }

  async getIdentity() {
    try {
      const client = await this.getClient();
      return client.getIdentity();
    } catch (e) {
      console.warn('[AuthService] 获取身份失败，使用匿名身份:', e);
      // 返回匿名身份由 @dfinity/agent 自己处理，这里直接抛给上层去创建匿名 actor
      throw e;
    }
  }

  async getPrincipalText(): Promise<string | null> {
    try {
      const client = await this.getClient();
      const identity = client.getIdentity();
      // 匿名身份没有 principal 文本，这里简单返回 null
      // 真实 II 登录后会返回形如 abcde-... 的 Principal 字符串
      // @ts-ignore
      return typeof (identity as any).getPrincipal === 'function'
        ? // @ts-ignore
          ((identity as any).getPrincipal() as { toText: () => string }).toText()
        : null;
    } catch (e) {
      console.warn('[AuthService] 获取 Principal 失败:', e);
      return null;
    }
  }

  async login(): Promise<void> {
    try {
      const client = await this.getClient();
      return new Promise((resolve, reject) => {
        client.login({
          // 可以通过环境变量自定义 II 地址，这里先用官方主网入口
          identityProvider: 'https://identity.ic0.app',
          onSuccess: () => {
            // 登录成功后刷新页面，让后续请求都带上新身份
            window.location.reload();
            resolve();
          },
          onError: (err) => {
            console.error('[AuthService] 登录失败:', err);
            reject(err);
          },
        });
      });
    } catch (e) {
      console.error('[AuthService] 当前环境不支持 II 登录:', e);
      alert('当前浏览器或访问方式不支持 Internet Identity 登录，请使用支持 Web Crypto 的浏览器并通过 HTTPS 或 localhost 访问。');
    }
  }

  async logout(): Promise<void> {
    try {
      const client = await this.getClient();
      await client.logout();
      // 退出登录后也刷新页面，回到匿名状态
      window.location.reload();
    } catch (e) {
      console.warn('[AuthService] 退出登录失败（可能当前环境本身不支持 II）:', e);
      window.location.reload();
    }
  }
}

export const authService = new AuthService();


