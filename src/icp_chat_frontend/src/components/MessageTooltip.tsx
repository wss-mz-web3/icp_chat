import React, { useEffect, useRef, useState } from 'react';
import './MessageTooltip.css';

interface MessageTooltipProps {
  messageId: number;
  messageAuthor: string;
  messageText: string;
  position: { x: number; y: number };
  onReply: (messageId: number, author: string, text: string) => void;
  onClose: () => void;
}

const MessageTooltip: React.FC<MessageTooltipProps> = ({
  messageId,
  messageAuthor,
  messageText,
  position,
  onReply,
  onClose,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // 计算调整后的位置，确保不超出视口
  useEffect(() => {
    // 先直接使用初始位置，立即显示
    setAdjustedPosition(position);
    
    // 使用双重 requestAnimationFrame 确保 DOM 完全渲染后再调整位置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const rect = tooltipRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          let x = position.x;
          let y = position.y;

          // 如果超出左边界，向右调整（因为 tooltip 在按钮左边）
          if (x < 10) {
            x = 10;
          }

          // 如果超出右边界，向左调整
          if (x + rect.width > viewportWidth - 10) {
            x = viewportWidth - rect.width - 10;
          }

          // 如果超出下边界，向上调整
          if (y + rect.height > viewportHeight - 10) {
            y = viewportHeight - rect.height - 10;
          }

          // 确保不超出上边界
          y = Math.max(10, y);

          // 只有位置需要调整时才更新
          if (x !== position.x || y !== position.y) {
            setAdjustedPosition({ x, y });
          }
        }
      });
    });
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 如果点击的不是 tooltip 内部，也不是三个点按钮，则关闭
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        const moreButton = (target as HTMLElement).closest('.message-more-button');
        if (!moreButton) {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // 延迟添加事件监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleReply = () => {
    onReply(messageId, messageAuthor, messageText);
    onClose();
  };

  return (
    <div 
      ref={tooltipRef}
      className="message-tooltip"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <button className="tooltip-reply-button" onClick={handleReply}>
        <span className="tooltip-reply-icon">↩️</span>
        <span className="tooltip-reply-text">回复</span>
      </button>
      <button className="tooltip-close" onClick={onClose}>×</button>
    </div>
  );
};

export default MessageTooltip;

