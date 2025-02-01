import React from "react";
import { Bot, Loader2 } from "lucide-react";

interface ThinkingMessageProps {
  content: string;
}

const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ content }) => {
  return (
    <div className="flex gap-4 px-4 py-6 bg-gray-50 dark:bg-gray-800 animate-in fade-in duration-300">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Assistant
          </span>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-500">Thinking...</span>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 p-4">
          <div className="prose dark:prose-invert max-w-none opacity-80">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingMessage;
