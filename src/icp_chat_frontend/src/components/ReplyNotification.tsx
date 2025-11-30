import React, { useEffect } from 'react';
import './ReplyNotification.css';

interface ReplyNotificationProps {
  messageId: number;
  author: string;
  text: string;
  replyToId: number;
  onJumpToMessage: (messageId: number) => void;
  onDismiss: () => void;
}

const ReplyNotification: React.FC<ReplyNotificationProps> = ({
  messageId,
  author,
  text,
  replyToId: _replyToId,
  onJumpToMessage,
  onDismiss,
}) => {
  // 截取文本预览（最多50个字符）
  const previewText = text.length > 50 ? text.substring(0, 50) + '...' : text;

  // 显示浏览器通知（如果支持）
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('有人回复了你的消息', {
        body: `${author}: ${previewText}`,
        icon: '/favicon.ico',
        tag: `reply-${messageId}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        onJumpToMessage(messageId);
        notification.close();
      };

      // 5秒后自动关闭浏览器通知
      setTimeout(() => {
        notification.close();
      }, 5000);

      return () => {
        notification.close();
      };
    } else if ('Notification' in window && Notification.permission === 'default') {
      // 首次请求通知权限
      Notification.requestPermission();
    }
  }, [messageId, author, previewText, onJumpToMessage]);

  return (
    <div 
      className="reply-notification"
      onClick={() => onJumpToMessage(messageId)}
    >
      <div className="reply-notification-content">
        <div className="reply-notification-icon">💬</div>
        <div className="reply-notification-info">
          <div className="reply-notification-author">
            <span>{author}</span>
            <span style={{ color: '#667eea', fontWeight: 700 }}>回复了你</span>
          </div>
          <div className="reply-notification-text">{previewText}</div>
        </div>
        <div className="reply-notification-actions">
          <button
            className="reply-notification-jump"
            onClick={(e) => {
              e.stopPropagation();
              onJumpToMessage(messageId);
            }}
            title="跳转到消息"
          >
            查看
          </button>
          <button
            className="reply-notification-close"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyNotification;

