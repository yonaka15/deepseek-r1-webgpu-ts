import type { Message } from "@/types";

/**
 * システムタグと思考プロセスを除去して実際の応答部分を抽出する
 */
export const extractAnswer = (content: string): string => {
  // <｜Assistant｜>タグで分割し、最後の部分を取得
  const assistantParts = content.split(/<｜Assistant｜>/);
  const lastPart = assistantParts[assistantParts.length - 1];

  // 思考プロセスを除去して整形
  let processed = lastPart.trim();
  processed = processed.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  return processed;
};

/**
 * 思考プロセスを抽出する
 */
export const extractThinking = (content: string): string => {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  return thinkMatch ? thinkMatch[1].trim() : "";
};

/**
 * メッセージ履歴からシステムタグと思考プロセスを除去する
 */
export const cleanMessageHistory = (messages: Message[]): Message[] => {
  return messages.map((msg) => ({
    role: msg.role,
    content:
      msg.role === "assistant" ? extractAnswer(msg.content) : msg.content,
  }));
};

/**
 * 特定のメッセージを処理して必要な部分を抽出する
 */
export const processMessage = (content: string) => {
  return {
    thinking: extractThinking(content),
    answer: extractAnswer(content),
  };
};

/**
 * メッセージ出力を検証する
 * 不正な形式の場合はエラーを投げる
 */
export const validateMessageOutput = (output: string): void => {
  const hasUserTag = /<｜User｜>/.test(output);
  const hasAssistantTag = /<｜Assistant｜>/.test(output);
  const hasUnclosedThinkTag =
    (output.match(/<think>/g)?.length ?? 0) !==
    (output.match(/<\/think>/g)?.length ?? 0);

  if (hasUserTag || hasAssistantTag || hasUnclosedThinkTag) {
    throw new Error("Invalid message format detected");
  }
};
