import React, { useState } from "react";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import {
  MessageSquare,
  Bot,
  User,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const MarkdownContent = React.lazy(() => import("./MarkdownContent"));

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp = new Date().toLocaleTimeString(),
}) => {
  const [showProcess, setShowProcess] = useState(false);
  const isAssistant = role === "assistant";

  // Split content for assistant messages
  const match = isAssistant
    ? content.match(/<\|User\|>(.*?)<\|Assistant\|>(.*)/s)
    : null;
  const hasThinkingProcess = match !== null;
  const process = match ? match[1].trim() : "";
  const response = match ? match[2].trim() : content;

  return (
    <div
      className={`flex gap-4 px-4 py-6 transition-colors ${
        isAssistant
          ? "bg-gray-50 dark:bg-gray-800"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {isAssistant ? "Assistant" : "You"}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {timestamp}
          </span>
        </div>

        <div className="space-y-4">
          {hasThinkingProcess && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowProcess(!showProcess)}
                className="w-full px-4 py-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Brain className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Thinking Process
                </span>
                {showProcess ? (
                  <ChevronDown className="w-4 h-4 ml-auto text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                )}
              </button>

              {showProcess && (
                <div className="p-4 bg-white dark:bg-gray-900">
                  <MathJax>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <MarkdownContent content={process} />
                    </React.Suspense>
                  </MathJax>
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-lg p-4 ${
              isAssistant
                ? "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                : "bg-blue-500 text-white"
            }`}
          >
            <MathJax>
              <React.Suspense fallback={<div>Loading...</div>}>
                <MarkdownContent content={isAssistant ? response : content} />
              </React.Suspense>
            </MathJax>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
