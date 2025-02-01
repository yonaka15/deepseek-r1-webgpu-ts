import React, { useState } from "react";
import { Bot, User, Brain, ChevronDown, ChevronRight } from "lucide-react";

const MarkdownContent = React.lazy(() => import("./MarkdownContent"));

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// メッセージを前処理する関数
const processContent = (
  content: string
): {
  thinking: string;
  response: string;
} => {
  // タグとユーザーメッセージを削除
  content = content
    .replace(/<｜User｜>.*?<｜Assistant｜>/s, "") // ユーザーメッセージを含むタグを削除
    .replace(/<｜Assistant｜>/g, "") // 残りのAssistantタグを削除
    .trim();

  // 思考プロセスの抽出
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : "";

  // レスポンスから<think>タグを除去
  let response = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();

  return {
    thinking: thinking || "",
    response: response || content.trim(),
  };
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp = new Date().toLocaleTimeString(),
}) => {
  const [showProcess, setShowProcess] = useState(false);
  const isAssistant = role === "assistant";

  // コンテンツを処理
  const { thinking, response } = processContent(content);
  const hasThinkingProcess = isAssistant && thinking.length > 0;

  return (
    <div
      className={`flex gap-4 px-4 py-6 transition-colors ${
        isAssistant ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <User className="w-5 h-5 text-green-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900">
            {isAssistant ? "Assistant" : "You"}
          </span>
          <span className="text-sm text-gray-500">{timestamp}</span>
        </div>

        <div className="space-y-4">
          {hasThinkingProcess && (
            <div className="rounded-lg border border-gray-200">
              <button
                onClick={() => setShowProcess(!showProcess)}
                className="w-full px-4 py-2 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Brain className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Thinking Process
                </span>
                {showProcess ? (
                  <ChevronDown className="w-4 h-4 ml-auto text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                )}
              </button>

              {showProcess && (
                <div className="p-4 bg-white">
                  <div className="prose max-w-none">
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <MarkdownContent content={thinking} />
                    </React.Suspense>
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className={`p-4 rounded-lg ${
              isAssistant
                ? "bg-white border border-gray-200"
                : "bg-blue-500 text-white"
            }`}
          >
            <div className="prose max-w-none">
              <React.Suspense fallback={<div>Loading...</div>}>
                <MarkdownContent content={response} />
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
