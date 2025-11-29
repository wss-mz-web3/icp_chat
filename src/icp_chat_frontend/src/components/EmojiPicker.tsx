import React, { useState, useRef, useEffect } from 'react';
import './EmojiPicker.css';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

// 常用表情分类
const EMOJI_CATEGORIES = {
  '常用': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  '手势': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'],
  '爱心': ['💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
  '物品': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡'],
  '符号': ['✅', '❌', '❓', '❔', '❕', '❗', '💯', '🔅', '🔆', '🔱', '🔰', '♻️', '⚛️', '🉑', '☢️', '☣️', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '✖️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '💱', '💲', '⚕️', '♻️', '🔱', '📶', '🔰', '⭕', '🆔', '🆓', '🆕', '🆖', '🆗', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵'],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('常用');
  const pickerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    // 选择表情后不关闭，方便连续选择多个表情
  };

  return (
    <div className="emoji-picker" ref={pickerRef}>
      <div className="emoji-picker-header">
        <div className="emoji-categories">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              className={`emoji-category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              title={category}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="emoji-picker-body">
        <div className="emoji-grid">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.map((emoji, index) => (
            <button
              key={`${activeCategory}-${index}`}
              className="emoji-item"
              onClick={() => handleEmojiClick(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="emoji-picker-footer">
        <button className="emoji-picker-close" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
};

export default EmojiPicker;

