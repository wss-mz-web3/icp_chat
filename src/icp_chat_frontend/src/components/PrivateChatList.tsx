import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { privateChatService, PrivateChatSession } from '../services/privateChatService';
import { authService } from '../services/authService';
import UserSearchDialog from './UserSearchDialog';
import './PrivateChatList.css';

interface PrivateChatListProps {
  onSessionSelect?: (principal: string) => void;
  selectedPrincipal?: string | null;
  searchQuery?: string;
}

const PrivateChatList: React.FC<PrivateChatListProps> = ({ 
  onSessionSelect,
  selectedPrincipal,
  searchQuery = ''
}) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PrivateChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showUserSearchDialog, setShowUserSearchDialog] = useState(false);
  const [showMenuPanel, setShowMenuPanel] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
      // 每30秒刷新一次会话列表
      const interval = setInterval(loadSessions, 30000);
      
      // 监听私聊消息发送事件，自动刷新列表
      const handlePrivateMessageSent = () => {
        loadSessions();
      };
      
      // 使用 BroadcastChannel 监听私聊消息发送
      if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
        const channel = new (window as any).BroadcastChannel('icp-chat-message-sync');
        channel.addEventListener('message', (event: MessageEvent) => {
          if (event.data && event.data.type === 'PRIVATE_MESSAGE_SENT') {
            handlePrivateMessageSent();
          }
        });
        
        return () => {
          clearInterval(interval);
          channel.close();
        };
      }
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const authed = await authService.isAuthenticated();
      setIsAuthenticated(authed);
      if (!authed) {
        setError('请先登录以使用私聊功能');
      }
    } catch (e) {
      console.error('[PrivateChatList] 检查登录状态失败:', e);
      setError('检查登录状态失败');
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PrivateChatList] 开始加载会话列表...');
      const sessionList = await privateChatService.getPrivateChatSessions();
      console.log('[PrivateChatList] 加载会话列表成功，会话数:', sessionList.length);
      console.log('[PrivateChatList] 会话列表详情:', sessionList.map(s => ({
        principal: s.otherPrincipal,
        nickname: s.otherNickname
      })));
      setSessions(sessionList);
    } catch (e) {
      console.error('[PrivateChatList] 加载会话列表失败:', e);
      setError('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用传入的 searchQuery 或本地搜索
  const activeSearchQuery = searchQuery || localSearchQuery;

  // 过滤会话列表
  const filteredSessions = useMemo(() => {
    if (!activeSearchQuery.trim()) {
      return sessions;
    }
    const query = activeSearchQuery.toLowerCase();
    return sessions.filter(session => {
      const nickname = (session.otherNickname || '').toLowerCase();
      const principal = session.otherPrincipal.toLowerCase();
      const lastMessage = session.lastMessage?.text?.toLowerCase() || '';
      return nickname.includes(query) || principal.includes(query) || lastMessage.includes(query);
    });
  }, [sessions, activeSearchQuery]);

  const handleSessionClick = (otherPrincipal: string) => {
    if (onSessionSelect) {
      onSessionSelect(otherPrincipal);
    } else {
      navigate(`/private-chat/${encodeURIComponent(otherPrincipal)}`);
    }
  };

  const handleUserSearch = async (principal: string) => {
    // 关闭对话框
    setShowUserSearchDialog(false);
    setShowMenuPanel(false);
    
    // 检查该用户是否已经在会话列表中（精确匹配）
    const trimmedPrincipal = principal.trim();
    console.log('[PrivateChatList] 开始处理用户搜索，Principal:', trimmedPrincipal);
    console.log('[PrivateChatList] 当前会话列表:', sessions);
    
    const existingSession = sessions.find(
      session => {
        const sessionPrincipal = String(session.otherPrincipal).trim();
        const isMatch = sessionPrincipal === trimmedPrincipal || 
               sessionPrincipal.toLowerCase() === trimmedPrincipal.toLowerCase();
        console.log('[PrivateChatList] 比较会话Principal:', sessionPrincipal, '与搜索Principal:', trimmedPrincipal, '匹配:', isMatch);
        return isMatch;
      }
    );
    
    // 如果用户不在会话列表中，尝试发送一条欢迎消息来创建会话
    if (!existingSession) {
      console.log('[PrivateChatList] 用户不在会话列表中，创建新会话，Principal:', trimmedPrincipal);
      try {
        // 确保 privateChatService 已初始化
        await privateChatService.initialize(true);
        
        // 发送一条欢迎消息来创建会话
        console.log('[PrivateChatList] 准备发送欢迎消息到Principal:', trimmedPrincipal);
        const result = await privateChatService.sendPrivateMessage(
          trimmedPrincipal, 
          '👋', 
          null, 
          null
        );
        
        console.log('[PrivateChatList] 发送消息结果:', result);
        
        if (result.success) {
          console.log('[PrivateChatList] 欢迎消息发送成功，开始刷新会话列表');
          // 消息发送成功后，立即刷新会话列表
          await loadSessions();
          console.log('[PrivateChatList] 首次刷新完成，当前会话数:', sessions.length);
          
          // 延迟刷新，确保后端数据已更新
          setTimeout(async () => {
            console.log('[PrivateChatList] 延迟刷新会话列表 (500ms)');
            await loadSessions();
          }, 500);
          
          setTimeout(async () => {
            console.log('[PrivateChatList] 延迟刷新会话列表 (1500ms)');
            await loadSessions();
          }, 1500);
        } else {
          console.warn('[PrivateChatList] 发送欢迎消息失败:', result.error);
        }
      } catch (error) {
        // 如果发送失败（比如用户不存在或网络问题），记录错误但继续
        console.error('[PrivateChatList] 创建会话失败:', error);
      }
    } else {
      console.log('[PrivateChatList] 用户已在会话列表中:', existingSession);
      // 如果用户已在列表中，也刷新一次确保数据最新
      await loadSessions();
    }
    
    // 无论是否创建成功，都导航到该用户的私聊页面
    console.log('[PrivateChatList] 导航到私聊页面，Principal:', trimmedPrincipal);
    if (onSessionSelect) {
      onSessionSelect(trimmedPrincipal);
    } else {
      navigate(`/private-chat/${encodeURIComponent(trimmedPrincipal)}`);
    }
    
    // 最终刷新会话列表，确保新创建的会话能及时显示
    setTimeout(async () => {
      console.log('[PrivateChatList] 最终刷新会话列表 (2000ms)');
      await loadSessions();
    }, 2000);
  };

  // 点击外部关闭菜单面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuPanel = document.querySelector('.header-menu-panel');
      
      if (showMenuPanel && menuPanel) {
        if (!menuPanel.contains(target) && 
            menuButtonRef.current && 
            !menuButtonRef.current.contains(target)) {
          setShowMenuPanel(false);
        }
      }
    };

    if (showMenuPanel) {
      // 使用 setTimeout 确保在点击事件处理完成后再添加监听器
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenuPanel]);

  const formatTime = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000); // 纳秒转毫秒
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // 如果是今天，显示时间
    if (days === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // 如果是昨天
    if (days === 1) {
      return '昨天';
    }

    // 其他情况显示完整日期，格式：2025/12/5
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const getLastMessagePreview = (session: PrivateChatSession): string => {
    if (!session.lastMessage) {
      return '暂无消息';
    }
    const text = session.lastMessage.text;
    // 根据设计图，消息预览应该更长一些
    if (text.length > 40) {
      return text.substring(0, 40) + '...';
    }
    return text;
  };

  if (!isAuthenticated) {
    return (
      <div className="private-chat-list-container">
        <div className="private-chat-list-header">
          <h2>💬 私聊</h2>
        </div>
        <div className="private-chat-list-empty">
          <p>{error || '请先登录以使用私聊功能'}</p>
          <button
            className="login-button"
            onClick={() => authService.login()}
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="private-chat-list-container">
      <div className="private-chat-list-header">
        <div className="header-title">
          <span className="header-icon">💬</span>
          <h2>Chats</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            ref={menuButtonRef}
            className="header-menu-button"
            title="更多选项"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenuPanel(!showMenuPanel);
            }}
          >
            ⋮
          </button>
          {showMenuPanel && (
            <div className="header-menu-panel">
              <button
                className="header-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenuPanel(false);
                  setShowUserSearchDialog(true);
                }}
              >
                <span>🔍</span>
                <span>查找</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="private-chat-list-search">
        <input
          type="text"
          placeholder="Search..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="private-chat-list-empty">
          <p>{activeSearchQuery ? '未找到匹配的会话' : '暂无私聊会话'}</p>
          {!activeSearchQuery && <p className="hint">开始与好友私聊吧！</p>}
        </div>
      ) : (
        <div className="private-chat-list">
          {filteredSessions.map((session) => {
            const isSelected = selectedPrincipal === session.otherPrincipal;
            return (
              <div
                key={session.sessionId}
                className={`private-chat-session-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSessionClick(session.otherPrincipal)}
              >
                <div className="session-avatar">
                  {session.otherAvatar ? (
                    <img src={session.otherAvatar} alt={session.otherNickname || '用户'} />
                  ) : (
                    <div className="avatar-placeholder">
                      {session.otherNickname
                        ? session.otherNickname.charAt(0).toUpperCase()
                        : session.otherPrincipal.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {session.unreadCount > 0 && (
                    <span className="unread-badge">{session.unreadCount}</span>
                  )}
                </div>
                <div className="session-info">
                  <div className="session-header">
                    <span className="session-name">
                      {session.otherNickname || session.otherPrincipal.slice(0, 10) + '...'}
                    </span>
                    <span className="session-time">
                      {session.lastMessage ? formatTime(session.lastMessageTime) : ''}
                    </span>
                  </div>
                  <div className="session-preview">
                    {getLastMessagePreview(session)}
                  </div>
                </div>
                {isSelected && (
                  <button
                    className="session-menu-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 显示会话菜单
                    }}
                    title="更多选项"
                  >
                    ⋮
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <UserSearchDialog
        isOpen={showUserSearchDialog}
        onClose={() => setShowUserSearchDialog(false)}
        onSearch={handleUserSearch}
        existingSessions={sessions}
      />
    </div>
  );
};

export default PrivateChatList;


