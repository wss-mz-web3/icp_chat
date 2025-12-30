import React, { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { userProfileService } from '../services/userProfileService';
import './UserSearchDialog.css';

interface UserSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (principal: string) => void;
  existingSessions?: Array<{
    otherPrincipal: string;
    otherNickname?: string | null;
    otherAvatar?: string | null;
  }>;
}

interface SearchResult {
  principal: string;
  nickname?: string | null;
  avatar?: string | null;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  isOpen,
  onClose,
  onSearch,
  existingSessions = [],
}) => {
  const [uid, setUid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  if (!isOpen) return null;

  const handleValidateAndSearch = async () => {
    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      setError('请输入用户UID或昵称');
      return;
    }

    setIsValidating(true);
    setError(null);
    setSearchResult(null);

    try {
      // 首先尝试作为Principal验证
      let principal: string | null = null;
      try {
        Principal.fromText(trimmedUid);
        principal = trimmedUid;
      } catch (e) {
        // 不是有效的Principal，尝试作为昵称搜索
        const searchResult = await userProfileService.searchUserByNickname(trimmedUid);
        if (searchResult) {
          principal = searchResult.principal;
          setSearchResult({
            principal: searchResult.principal,
            nickname: searchResult.profile.nickname,
            avatar: searchResult.profile.avatar || null,
          });
          setError(null);
          setIsValidating(false);
          return;
        } else {
          setError('未找到该昵称的用户，请检查昵称是否正确');
          setIsValidating(false);
          return;
        }
      }

      // 如果是有效的Principal，继续原有逻辑
      if (principal) {
        // 尝试从现有会话中查找用户信息（精确匹配）
        const existingSession = existingSessions.find(
          session => {
            // 精确匹配 Principal（不区分大小写）
            const sessionPrincipal = String(session.otherPrincipal).trim();
            const searchPrincipal = principal!.trim();
            return sessionPrincipal === searchPrincipal || 
                   sessionPrincipal.toLowerCase() === searchPrincipal.toLowerCase();
          }
        );
        
        // 如果验证成功，显示搜索结果
        // 如果用户在会话中，使用会话中的昵称；否则尝试通过后端获取用户信息
        let displayNickname = null;
        let displayAvatar = null;
        
        if (existingSession?.otherNickname) {
          displayNickname = existingSession.otherNickname;
          displayAvatar = existingSession.otherAvatar || null;
        } else {
          // 尝试通过Principal获取用户资料
          const userData = await userProfileService.getUserProfileByPrincipal(principal);
          if (userData) {
            displayNickname = userData.profile.nickname;
            displayAvatar = userData.profile.avatar || null;
          }
        }
        
        setSearchResult({
          principal: principal,
          nickname: displayNickname,
          avatar: displayAvatar,
        });
        setError(null);
      }
    } catch (e) {
      setError('搜索失败，请检查输入是否正确');
      console.error('[UserSearchDialog] 搜索失败:', e);
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartChat = () => {
    if (searchResult) {
      onSearch(searchResult.principal);
      // 重置状态
      setUid('');
      setSearchResult(null);
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleValidateAndSearch();
    }
  };

  const handleClose = () => {
    setUid('');
    setError(null);
    setSearchResult(null);
    onClose();
  };

  return (
    <div className="user-search-dialog-overlay" onClick={handleClose}>
      <div className="user-search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="user-search-dialog-header">
          <h3>查找用户</h3>
          <button className="user-search-dialog-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="user-search-dialog-content">
          {!searchResult ? (
            <div className="user-search-dialog-form">
              <label>
                <span>用户UID或昵称</span>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => {
                    setUid(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="输入用户昵称或Principal (UID)"
                  className={error ? 'error' : ''}
                  autoFocus
                />
                {error && <div className="user-search-dialog-error">{error}</div>}
              </label>
              <div className="user-search-dialog-hint">
                <p>支持通过昵称或Principal字符串（UID）来查找用户并开始私聊</p>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  提示：昵称不区分大小写，每个用户只能使用唯一的昵称
                </p>
              </div>
            </div>
          ) : (
            <div className="user-search-result">
              <div className="user-search-result-header">
                <h4>找到用户</h4>
              </div>
              <div className="user-search-result-card" onClick={handleStartChat}>
                <div className="user-search-result-avatar">
                  {searchResult.avatar ? (
                    <img src={searchResult.avatar} alt={searchResult.nickname || '用户'} />
                  ) : (
                    <div className="user-search-result-avatar-placeholder">
                      {searchResult.nickname
                        ? searchResult.nickname.charAt(0).toUpperCase()
                        : searchResult.principal.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-search-result-info">
                  <div className="user-search-result-name">
                    {searchResult.nickname || searchResult.principal.slice(0, 20) + (searchResult.principal.length > 20 ? '...' : '')}
                  </div>
                  <div className="user-search-result-uid">
                    {searchResult.principal}
                  </div>
                </div>
                <div className="user-search-result-action">
                  <button className="user-search-result-chat-button">
                    开始聊天 →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="user-search-dialog-actions">
          {!searchResult ? (
            <>
              <button
                className="user-search-dialog-button secondary"
                onClick={handleClose}
              >
                取消
              </button>
              <button
                className="user-search-dialog-button primary"
                onClick={handleValidateAndSearch}
                disabled={isValidating || !uid.trim()}
              >
                {isValidating ? '验证中...' : '查找'}
              </button>
            </>
          ) : (
            <>
              <button
                className="user-search-dialog-button secondary"
                onClick={() => {
                  setSearchResult(null);
                  setUid('');
                }}
              >
                重新搜索
              </button>
              <button
                className="user-search-dialog-button primary"
                onClick={handleStartChat}
              >
                开始聊天
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchDialog;
