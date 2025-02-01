import React, { useRef, useEffect } from "react";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";

export interface ChatContainerProps {
  messages: ChatMessageProps[];
  loading?: boolean;
  error?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  loading,
  error,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} {...msg} />
      ))}

      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
