/// <reference lib="webworker" />

declare var self: WorkerGlobalScope & typeof globalThis;

import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  StoppingCriteriaList,
  type PreTrainedTokenizer,
  type PreTrainedModel,
  type Tensor,
} from "@huggingface/transformers";

// Types for messages
type WorkerMessageType = "check" | "load" | "generate" | "interrupt" | "reset";

interface WorkerMessage {
  type: WorkerMessageType;
  data?: unknown;
}

interface LoadingStatus {
  status: "loading" | "initiate" | "progress" | "done" | "error" | "ready";
  file?: string;
  progress?: number;
  total?: number;
  data?: string;
}

interface GenerationStatus {
  status: "update" | "start" | "complete" | "error";
  output?: string | string[];
  tps?: number;
  numTokens?: number;
  state?: "thinking" | "answering";
  error?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TokenizerOutput {
  input_ids: Tensor;
  attention_mask?: Tensor;
  token_type_ids?: Tensor;
}

interface ProgressCallback {
  (info: {
    status: string;
    name?: string;
    progress?: number;
    total?: number;
  }): void;
}

// Enhanced debug logging
const debugLog = (message: string, ...args: any[]): void => {
  const timestamp = new Date().toISOString();
  console.log(`[Worker Debug ${timestamp}] ${message}`, ...args);
};

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check(): Promise<void> {
  try {
    debugLog("Starting WebGPU check");

    if (!navigator.gpu) {
      debugLog("navigator.gpu not found");
      throw new Error("WebGPU is not supported (navigator.gpu not found)");
    }

    debugLog("navigator.gpu exists, requesting adapter");
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      debugLog("No WebGPU adapter found");
      throw new Error("WebGPU is not supported (no adapter found)");
    }

    debugLog("WebGPU adapter found:", adapter);

    self.postMessage({
      status: "ready",
      data: "WebGPU is supported",
    } as LoadingStatus);
    debugLog("Sent success message");
  } catch (error) {
    debugLog("Error in WebGPU check:", error);
    self.postMessage({
      status: "error",
      data: error instanceof Error ? error.message : String(error),
    } as LoadingStatus);
  }
}

// Progress callback for model loading
const reportProgress: ProgressCallback = (info) => {
  if ("name" in info) {
    debugLog("Progress update:", info);
    self.postMessage({
      status: info.status === "download" ? "progress" : info.status,
      file: info.name,
      progress: info.progress,
      total: info.total,
    } as LoadingStatus);
  }
};

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */
class TextGenerationPipeline {
  private static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
  private static tokenizer: Promise<PreTrainedTokenizer>;
  private static model: Promise<PreTrainedModel>;

  static async getInstance(): Promise<[PreTrainedTokenizer, PreTrainedModel]> {
    try {
      this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback: reportProgress,
      });

      this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
        dtype: "q4f16",
        device: "webgpu",
        progress_callback: reportProgress,
      });

      return Promise.all([this.tokenizer, this.model]);
    } catch (error) {
      debugLog("Error in getInstance:", error);
      throw error;
    }
  }
}

// Initialize stopping criteria
const stopping_criteria_list = new StoppingCriteriaList();
const interruptable_criteria = new InterruptableStoppingCriteria();
stopping_criteria_list.push(interruptable_criteria);

async function generate(messages: ChatMessage[]): Promise<void> {
  try {
    debugLog("Starting generation with messages:", messages);

    const [tokenizer, model] = await TextGenerationPipeline.getInstance();

    debugLog("Applying chat template to messages");
    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
    }) as TokenizerOutput;
    debugLog("Tokenizer inputs:", inputs);

    const [_, END_THINKING_TOKEN_ID] = tokenizer.encode("<think></think>", {
      add_special_tokens: false,
    });
    debugLog("END_THINKING_TOKEN_ID:", END_THINKING_TOKEN_ID);

    let state: "thinking" | "answering" = "thinking";
    let startTime: number | undefined;
    let numTokens = 0;
    let tps: number | undefined;

    const token_callback_function = (tokens: bigint[]): void => {
      debugLog(
        "Token callback received tokens:",
        tokens.map((t) => t.toString())
      );
      startTime ??= performance.now();

      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }
      if (tokens[0] === BigInt(END_THINKING_TOKEN_ID)) {
        debugLog("State changing to answering");
        state = "answering";
      }
    };

    const callback_function = (output: string): void => {
      debugLog("Output callback:", {
        output,
        tps,
        numTokens,
        state,
        elapsed: startTime ? (performance.now() - startTime) / 1000 : 0,
      });

      self.postMessage({
        status: "update",
        output,
        tps,
        numTokens,
        state,
      } as GenerationStatus);
    };

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function,
      token_callback_function,
    });

    debugLog("Starting text generation with inputs:", {
      inputs,
      streamer,
      stopping_criteria: stopping_criteria_list,
    });

    self.postMessage({ status: "start" } as GenerationStatus);

    const output = await model.generate({
      ...inputs,
      streamer,
      stopping_criteria: stopping_criteria_list,
      // @ts-ignore - Property 'max_new_tokens' does not exist on type 'GenerationFunctionParameters'
      max_new_tokens: 2048,
    });

    debugLog("Raw model output:", output);

    if (!output) {
      throw new Error("No output generated from model");
    }

    let sequences: number[][] = [];

    if ("ort_tensor" in output) {
      const tensor = output.ort_tensor;
      debugLog("ORT tensor details:", {
        dims: tensor.dims,
        dataLocation: tensor.location,
        size: tensor.size,
      });

      const data = Object.values(tensor.data).map((str) => parseInt(str, 10));
      debugLog("Parsed tensor data:", data);

      const [batchSize, seqLength] = tensor.dims;
      debugLog("Tensor dimensions:", { batchSize, seqLength });

      for (let i = 0; i < batchSize; i++) {
        const start = i * seqLength;
        const sequence = data.slice(start, start + seqLength);
        sequences.push(sequence);
        debugLog(`Sequence ${i}:`, sequence);
      }
    } else {
      debugLog("Output format:", Object.keys(output));
      throw new Error(`Invalid model output format: ${JSON.stringify(output)}`);
    }

    if (sequences.length > 0) {
      const decoded = tokenizer.batch_decode(sequences, {
        skip_special_tokens: true,
      });
      debugLog("Decoded sequences:", decoded);

      self.postMessage({
        status: "complete",
        output: decoded,
      } as GenerationStatus);
    } else {
      throw new Error("No sequences generated");
    }
  } catch (error) {
    debugLog("Error in generate:", error);
    self.postMessage({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    } as GenerationStatus);
  }
}

async function load(): Promise<void> {
  try {
    debugLog("Starting model load");
    self.postMessage({
      status: "loading",
      data: "Loading model...",
    } as LoadingStatus);

    await TextGenerationPipeline.getInstance();

    self.postMessage({
      status: "loading",
      data: "Compiling shaders and warming up model...",
    } as LoadingStatus);

    const [tokenizer, model] = await TextGenerationPipeline.getInstance();

    self.postMessage({
      status: "loading",
      data: "Warming up model...",
    } as LoadingStatus);

    debugLog("Running warmup inference");
    const inputs = (await tokenizer("a", {
      return_tensors: "pt",
      return_attention_mask: true,
      return_token_type_ids: false,
      padding: true,
      return_dict: true,
    })) as TokenizerOutput;

    await model.generate({
      ...inputs,
      stopping_criteria: undefined,
    });

    self.postMessage({ status: "ready" } as LoadingStatus);
    debugLog("Model load complete");
  } catch (error) {
    debugLog("Error in load:", error);
    self.postMessage({
      status: "error",
      data: error instanceof Error ? error.message : String(error),
    } as LoadingStatus);
  }
}

// Message handler
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  debugLog("Received message:", { type, data });

  try {
    switch (type) {
      case "check":
        await check();
        break;

      case "load":
        await load();
        break;

      case "generate":
        interruptable_criteria.reset();
        if (Array.isArray(data)) {
          await generate(data as ChatMessage[]);
        } else {
          throw new Error("Invalid message data for generate command");
        }
        break;

      case "interrupt":
        interruptable_criteria.interrupt();
        break;

      case "reset":
        interruptable_criteria.reset();
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    debugLog("Error in message handler:", error);
    self.postMessage({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    } as GenerationStatus);
  }
});

export {};
