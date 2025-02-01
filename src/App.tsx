import React, { useEffect, useState, useCallback, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import ThinkingMessage from "./components/ThinkingMessage";
import type { ChatMessageProps } from "./components/ChatMessage";
import { Alert, AlertDescription } from "@/components/ui/alert";

type WorkerStatus = "initializing" | "ready" | "loading" | "error";

interface MessageState {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status: "complete" | "thinking" | "raw";
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<MessageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] =
    useState<WorkerStatus>("initializing");
  const [thinkingContent, setThinkingContent] = useState<string>("");
  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Worker初期化
  useEffect(() => {
    let mounted = true;
    console.log("Initializing worker...");

    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;

    const handleWorkerMessage = (e: MessageEvent) => {
      if (!mounted) return;

      const { status, data, error: workerError, output } = e.data;
      console.log("Worker message:", e.data);

      if (status === "error") {
        setError(workerError || data || "An error occurred");
        setWorkerStatus("error");
        setIsLoading(false);
        return;
      }

      setError(null);

      switch (status) {
        case "ready":
          setWorkerStatus("ready");
          setIsLoading(false);
          break;

        case "loading":
          setWorkerStatus("loading");
          setIsLoading(true);
          break;

        case "start":
          setIsLoading(true);
          setThinkingContent("");
          break;

        case "update":
          if (output) {
            setThinkingContent((prev) => prev + output);
          }
          break;

        case "complete":
          setIsLoading(false);
          if (output) {
            const finalOutput = Array.isArray(output) ? output[0] : output;
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: finalOutput,
                timestamp: new Date().toLocaleTimeString(),
                status: "complete",
              },
            ]);
            setThinkingContent("");
          }
          break;
      }
    };

    // エラーハンドラ
    const handleWorkerError = (error: ErrorEvent) => {
      console.error("Worker error:", error);
      if (mounted) {
        setError(error.message);
        setWorkerStatus("error");
        setIsLoading(false);
      }
    };

    // イベントリスナーを設定
    worker.addEventListener("message", handleWorkerMessage);
    worker.addEventListener("error", handleWorkerError);

    // WebGPUサポートチェック
    worker.postMessage({ type: "check" });

    // クリーンアップ
    return () => {
      mounted = false;
      worker.removeEventListener("message", handleWorkerMessage);
      worker.removeEventListener("error", handleWorkerError);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // メッセージ送信
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!workerRef.current || isLoading) {
        console.warn("Cannot send message: worker not ready or still loading");
        return;
      }

      const newMessage: MessageState = {
        role: "user",
        content: content,
        timestamp: new Date().toLocaleTimeString(),
        status: "raw",
      };

      setMessages((prev) => [...prev, newMessage]);

      const messageHistory = [...messages, { role: "user", content }].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      try {
        workerRef.current.postMessage({
          type: "generate",
          data: messageHistory,
        });
      } catch (err) {
        console.error("Failed to send message to worker:", err);
        setError("Failed to send message to worker");
      }
    },
    [messages, isLoading]
  );

  // 生成停止
  const handleStop = useCallback(() => {
    if (!workerRef.current || !isLoading) return;
    workerRef.current.postMessage({ type: "interrupt" });
  }, [isLoading]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            DeepSeek Chat
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Powered by WebGPU
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              workerStatus === "ready"
                ? "bg-green-500"
                : workerStatus === "error"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {workerStatus.charAt(0).toUpperCase() + workerStatus.slice(1)}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={`${idx}-${msg.timestamp}`}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}

          {isLoading && thinkingContent && (
            <ThinkingMessage content={thinkingContent} />
          )}

          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            disabled={workerStatus !== "ready"}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
