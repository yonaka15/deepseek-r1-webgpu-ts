import React from "react";
import { ChatMessage } from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// タグを除去してメッセージを抽出する関数
const cleanMessage = (rawMessage: string): Message[] => {
  // タグでメッセージを分割
  const pattern = /<\|User\|>(.*?)<\|Assistant\|>(.*)/s;
  const match = rawMessage.match(pattern);

  if (!match) return [];

  const [_, userContent, assistantContent] = match;
  return [
    // ユーザーメッセージ
    { role: "user", content: userContent.trim() },
    // アシスタントメッセージ
    { role: "assistant", content: assistantContent.trim() },
  ];
};

interface ChatContainerProps {
  output: string[];
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ output }) => {
  // outputの各要素からメッセージを抽出し、タグを除去
  const messages = output.flatMap(cleanMessage);

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          role={message.role}
          content={message.content}
        />
      ))}
    </div>
  );
};

export default ChatContainer;
