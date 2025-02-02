export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface MessageState extends Message {
  timestamp: string;
  status: "complete" | "thinking" | "raw";
}

export interface ProcessedMessage {
  thinking: string;
  answer: string;
}

export type WorkerStatus = "initializing" | "ready" | "loading" | "error";

// Worker関連の型
type WorkerMessageType = "check" | "load" | "generate" | "interrupt" | "reset";

export interface WorkerMessage {
  type: WorkerMessageType;
  data?: unknown;
}

export interface LoadingStatus {
  status: "loading" | "initiate" | "progress" | "done" | "error" | "ready";
  file?: string;
  progress?: number;
  total?: number;
  data?: string;
  error?: string;
}

export interface GenerationStatus {
  status: "update" | "start" | "complete" | "error";
  output?: string | string[];
  tps?: number;
  numTokens?: number;
  state?: "thinking" | "answering";
  error?: string;
}
