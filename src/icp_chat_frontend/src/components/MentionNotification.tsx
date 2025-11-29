import React, { useEffect } from 'react';
import './MentionNotification.css';

interface MentionNotificationProps {
  messageId: number;
  author: string;
  text: string;
  onJumpToMessage: (messageId: number) => void;
  onDismiss: () => void;
}

const MentionNotification: React.FC<MentionNotificationProps> = ({
  messageId,
  author,
  text,
  onJumpToMessage,
  onDismiss,
}) => {
  // 截取文本预览（最多50个字符）
  const previewText = text.length > 50 ? text.substring(0, 50) + '...' : text;

  // 显示浏览器通知（如果支持）
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('有人@了你', {
        body: `${author}: ${previewText}`,
        icon: '/favicon.ico',
        tag: `mention-${messageId}`,
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
      className="mention-notification"
      onClick={() => onJumpToMessage(messageId)}
    >
      <div className="mention-notification-content">
        <div className="mention-notification-icon">@</div>
        <div className="mention-notification-info">
          <div className="mention-notification-author">
            <span>{author}</span>
            <span style={{ color: '#ff6b6b', fontWeight: 700 }}>@了你</span>
          </div>
          <div className="mention-notification-text">{previewText}</div>
        </div>
        <div className="mention-notification-actions">
          <button
            className="mention-notification-jump"
            onClick={() => onJumpToMessage(messageId)}
            title="跳转到消息"
          >
            查看
          </button>
          <button
            className="mention-notification-close"
            onClick={onDismiss}
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentionNotification;

