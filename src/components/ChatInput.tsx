import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => Promise<void> | void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  disabled = false,
  loading = false,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを自動調整
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "2.5rem";
      const scrollHeight = Math.min(textarea.scrollHeight, 160);
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // メッセージ送信処理を同期的に実行
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 最初にpreventDefaultを呼び出し
    e.stopPropagation(); // イベントの伝播も停止

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || loading) {
      return;
    }

    // メッセージを送信
    onSend(trimmedMessage);

    // 入力をクリア
    setMessage("");

    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = "2.5rem";
    }

    return false; // フォームのデフォルト動作を確実に防止
  };

  // キーボードイベントのハンドラ
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="p-4">
      {" "}
      {/* formをdivに変更 */}
      <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className={`w-full resize-none rounded-lg py-3 pl-4 pr-12 ${
              disabled
                ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                : "bg-white dark:bg-gray-900 dark:text-white"
            } border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20`}
            rows={1}
            style={{
              minHeight: "2.5rem",
              maxHeight: "10rem",
            }}
          />

          {loading && onStop && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onStop();
              }}
              className="absolute right-3 bottom-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !message.trim() || loading}
          className={`flex-shrink-0 rounded-lg p-3 ${
            disabled || !message.trim() || loading
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } transition-colors`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Press Shift + Enter for new line
      </div>
    </div>
  );
};

export default ChatInput;
