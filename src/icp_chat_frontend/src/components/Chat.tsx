import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, Message } from '../services/chatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import KeyManagement from './KeyManagement';
import { encryptionService } from '../services/encryptionService';
import '../App.css';

const PAGE_SIZE = 10;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [encryptionAvailable, setEncryptionAvailable] = useState<boolean>(false);
  const [showKeyManagement, setShowKeyManagement] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 加载最新一页消息
  const loadLatestMessages = useCallback(async () => {
    try {
      const pageData = await chatService.getMessagesPage(1, PAGE_SIZE);
      setMessages(pageData.messages);
      setMessageCount(pageData.total);
      setCurrentPage(1);
      setHasMoreMessages(pageData.totalPages > 1);
    } catch (err) {
      console.error('加载消息失败:', err);
    }
  }, []);

  // 加载更多历史消息
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) {
      return;
    }
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const pageData = await chatService.getMessagesPage(nextPage, PAGE_SIZE);
      if (pageData.messages.length > 0) {
        setMessages((prev) => [...pageData.messages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(nextPage < pageData.totalPages);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('加载历史消息失败:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMoreMessages, isLoadingMore]);

  // 初始化服务（只在组件首次挂载时执行）
  useEffect(() => {
    const init = async () => {
      try {
        await chatService.initialize();
        await loadLatestMessages();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        let userMessage = '初始化失败，请检查网络连接';
        
        if (errorMessage.includes('Canister ID')) {
          userMessage = 'Canister ID 未配置。请先运行: dfx deploy';
        } else if (errorMessage.includes('fetchRootKey') || errorMessage.includes('network')) {
          userMessage = '无法连接到 ICP 网络。请确保已启动本地网络: dfx start --background';
        }
        
        setError(userMessage);
        console.error('初始化失败:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadLatestMessages]);

  // 检查加密功能可用性
  useEffect(() => {
    const cryptoAvailable = encryptionService.canUseCrypto?.() || false;
    const encryptionEnabled = encryptionService.isEncryptionEnabled();
    setEncryptionAvailable(cryptoAvailable && encryptionEnabled);
    
    const reason = encryptionService.getUnavailableReason();
    if (!cryptoAvailable && reason) {
      console.warn('[App] Web Crypto API 不可用:', reason);
    } else if (!encryptionEnabled) {
      console.log('[App] 端到端加密未开启（默认关闭）');
    } else {
      console.log('[App] 端到端加密已开启');
    }
  }, []);

  // 多窗口/多标签页之间的消息同步（使用 BroadcastChannel）
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 有些环境（老浏览器）不支持 BroadcastChannel
    const BC: typeof BroadcastChannel | undefined = (window as any).BroadcastChannel;
    if (!BC) {
      return;
    }

    const channel = new BC('icp-chat-message-sync');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'NEW_MESSAGE') {
        // 收到其他窗口的新消息通知时，强制刷新最新一页消息
        loadLatestMessages();
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [loadLatestMessages]);

  // 自动刷新逻辑（仅在查看最新消息时触发）
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh && !loading && currentPage === 1) {
      // 为了多设备之间尽量“准实时”同步，这里使用较短的轮询间隔
      refreshIntervalRef.current = setInterval(() => {
        loadLatestMessages();
      }, 3000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, currentPage, loadLatestMessages, loading]);

  // 窗口获得焦点 / 页面从后台切回前台时，主动拉一次最新消息（兼容不同设备之间的同步）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadLatestMessages();
      }
    };

    const handleFocus = () => {
      loadLatestMessages();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadLatestMessages]);

  // 发送消息
  const handleSendMessage = async (text: string, imageId?: number | null) => {
    setSending(true);
    setError(null);

    try {
      const result = await chatService.sendMessage(text, imageId);
      if (result.success && result.message) {
        setMessages((prev) => [...prev, result.message!]);
        setMessageCount((prev) => prev + 1);
        if (!currentUser && result.message.author !== '匿名') {
          setCurrentUser(result.message.author);
        }

        // 当前窗口发送成功后，通知其他窗口刷新
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({ type: 'NEW_MESSAGE' });
        }
      } else {
        setError(result.error || '发送失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息时发生错误');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>正在连接 ICP 网络...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <h3>💬 美国要完蛋了-web3新时代</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="encryption-controls">
                <label className="encryption-toggle" title="开启/关闭端到端加密">
                  <input
                    type="checkbox"
                    checked={encryptionAvailable && encryptionService.isEncryptionEnabled()}
                    onChange={(e) => {
                      if (e.target.checked) {
                        encryptionService.enableEncryption();
                        setEncryptionAvailable(encryptionService.isAvailable());
                      } else {
                        encryptionService.disableEncryption();
                        setEncryptionAvailable(false);
                      }
                    }}
                    disabled={!encryptionService.canUseCrypto?.()}
                  />
                  <span className="encryption-label">
                    {encryptionAvailable && encryptionService.isEncryptionEnabled() ? '🔒 端到端加密' : '🔓 未加密'}
                  </span>
                </label>
                {encryptionAvailable && encryptionService.isEncryptionEnabled() && (
                  <button
                    className="key-management-btn"
                    onClick={() => setShowKeyManagement(true)}
                    title="密钥管理"
                  >
                    🔑 密钥管理
                  </button>
                )}
              </div>
              <span className="message-count">共 {messageCount} 条消息</span>
            </div>
          </div>
          <div className="header-right">
            <label className="auto-refresh-toggle" title="自动刷新">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>自动刷新</span>
            </label>
            <button className="refresh-button" onClick={() => loadLatestMessages()} title="手动刷新消息（回到最新）">
              🔄
            </button>
          </div>
        </div>

        {!encryptionAvailable && encryptionService.getUnavailableReason() && (
          <div className="warning-message">
            <span>⚠️ {encryptionService.getUnavailableReason()}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <MessageList
          messages={messages}
          currentUser={currentUser || undefined}
          onLoadMore={loadOlderMessages}
          hasMore={hasMoreMessages}
          isLoadingMore={isLoadingMore}
        />

        <MessageInput onSend={handleSendMessage} disabled={sending} />
      </div>
      {showKeyManagement && (
        <KeyManagement onClose={() => setShowKeyManagement(false)} />
      )}
    </div>
  );
};

export default Chat;

