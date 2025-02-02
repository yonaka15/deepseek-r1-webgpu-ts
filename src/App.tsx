import React, { useEffect, useState, useCallback, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProgressBar from "@/components/ProgressBar";
import { cleanMessageHistory, processMessage } from "@/lib/response";
import type { MessageState, WorkerStatus, Message } from "@/types";

const App: React.FC = () => {
  const [messages, setMessages] = useState<MessageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] =
    useState<WorkerStatus>("initializing");
  const [thinkingContent, setThinkingContent] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<{
    progress: number;
    fileName: string;
    fileSize: number;
  } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Worker initialization
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
          setLoadingProgress(null);
          break;

        case "loading":
          setWorkerStatus("loading");
          setIsLoading(true);
          break;

        case "progress":
          if (e.data.file && e.data.progress) {
            // 1%単位で丸めて、変化が大きい時だけ更新
            const roundedProgress = Math.round(e.data.progress);
            setLoadingProgress((prev) => {
              if (!prev || Math.abs(prev.progress - roundedProgress) >= 1) {
                return {
                  progress: roundedProgress,
                  fileName: e.data.file,
                  fileSize: 1.28, // 1.28 GB
                };
              }
              return prev;
            });
          }
          break;

        case "start":
          setIsLoading(true);
          setThinkingContent("");
          break;

        case "update":
          if (output) {
            // Accumulate output
            setThinkingContent((prev) => prev + output);
          }
          break;

        case "complete":
          setIsLoading(false);
          if (output) {
            const finalOutput = Array.isArray(output) ? output[0] : output;
            const { thinking, answer } = processMessage(finalOutput);
            const completedContent = `<think>${thinking}</think>\n${answer}`;
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: completedContent,
                timestamp: new Date().toLocaleTimeString(),
                status: "complete",
              },
            ]);
            setThinkingContent("");
          }
          break;
      }
    };

    // Error handler
    const handleWorkerError = (error: ErrorEvent) => {
      console.error("Worker error:", error);
      if (mounted) {
        setError(error.message);
        setWorkerStatus("error");
        setIsLoading(false);
      }
    };

    worker.addEventListener("message", handleWorkerMessage);
    worker.addEventListener("error", handleWorkerError);
    worker.postMessage({ type: "check" });

    return () => {
      mounted = false;
      worker.removeEventListener("message", handleWorkerMessage);
      worker.removeEventListener("error", handleWorkerError);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send message
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!workerRef.current || isLoading) {
        console.warn("Cannot send message: worker not ready or still loading");
        return;
      }

      const newMessage: MessageState = {
        role: "user",
        content,
        timestamp: new Date().toLocaleTimeString(),
        status: "raw",
      };

      setMessages((prev) => [...prev, newMessage]);

      // Clean message history before sending
      const messageHistory: Message[] = [...messages, newMessage].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );
      const cleanHistory = cleanMessageHistory(messageHistory);

      try {
        workerRef.current.postMessage({
          type: "generate",
          data: cleanHistory,
        });
      } catch (err) {
        console.error("Failed to send message to worker:", err);
        setError("Failed to send message to worker");
      }
    },
    [messages, isLoading]
  );

  // Stop generation
  const handleStop = useCallback(() => {
    if (!workerRef.current || !isLoading) return;
    workerRef.current.postMessage({ type: "interrupt" });
  }, [isLoading]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            DeepSeek-R1
            <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              1.5B parameters
            </span>
          </h1>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-mono flex items-center gap-2">
            <a
              href="https://huggingface.co/onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX</span> 🤗
            </a>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Powered by WebGPU • ONNX optimized • Qwen2.5 architecture
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

      {/* Progress bar */}
      {loadingProgress && (
        <div className="border-b border-gray-200 dark:border-gray-800">
          <ProgressBar
            progress={loadingProgress.progress}
            fileName={loadingProgress.fileName}
            fileSize={loadingProgress.fileSize}
          />
        </div>
      )}

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
            <ChatMessage
              role="assistant"
              content={thinkingContent}
              timestamp={new Date().toLocaleTimeString()}
              isStreaming={true}
            />
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
