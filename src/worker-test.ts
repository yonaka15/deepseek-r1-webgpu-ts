type WorkerStatus = "ready" | "loading" | "generating" | "error";

class WorkerTester {
  private worker: Worker;
  private outputDiv!: HTMLElement; // '!' で初期化を保証
  private statusDiv!: HTMLElement; // '!' で初期化を保証
  private generateBtn!: HTMLButtonElement; // '!' で初期化を保証
  private interruptBtn!: HTMLButtonElement; // '!' で初期化を保証

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.setupElements();
    this.setupWorkerHandlers();
    this.setupEventListeners();
  }

  private setupElements(): void {
    const outputDiv = document.getElementById("output");
    const statusDiv = document.getElementById("status");
    const generateBtn = document.getElementById("generateBtn");
    const interruptBtn = document.getElementById("interruptBtn");

    if (!outputDiv || !statusDiv || !generateBtn || !interruptBtn) {
      throw new Error("Required elements not found");
    }

    this.outputDiv = outputDiv;
    this.statusDiv = statusDiv;
    this.generateBtn = generateBtn as HTMLButtonElement;
    this.interruptBtn = interruptBtn as HTMLButtonElement;
  }

  private setupWorkerHandlers(): void {
    this.worker.onmessage = (e: MessageEvent) => {
      const { status, data } = e.data;
      this.log("Worker response:", e.data);

      switch (status) {
        case "ready":
          this.updateStatus("ready");
          this.generateBtn.disabled = false;
          break;
        case "error":
          this.updateStatus("error");
          this.log("Error:", data);
          break;
        case "loading":
          this.updateStatus("loading");
          break;
        case "start":
          this.updateStatus("generating");
          this.interruptBtn.disabled = false;
          break;
        case "complete":
          this.updateStatus("ready");
          this.interruptBtn.disabled = true;
          break;
      }
    };

    this.worker.onerror = (error: ErrorEvent) => {
      this.log("Worker error:", error.message);
      this.updateStatus("error");
    };
  }

  private setupEventListeners(): void {
    const checkBtn = document.getElementById("checkBtn");
    const loadBtn = document.getElementById("loadBtn");
    const resetBtn = document.getElementById("resetBtn");

    checkBtn?.addEventListener("click", () => {
      this.log("Checking WebGPU support...");
      this.worker.postMessage({ type: "check" });
    });

    loadBtn?.addEventListener("click", () => {
      this.log("Starting model load...");
      this.worker.postMessage({ type: "load" });
    });

    this.generateBtn.addEventListener("click", () => {
      const messages = [
        {
          role: "user" as const,
          content: "Solve the equation x^2 - 3x + 2 = 0",
        },
      ];
      this.log("Generating text with message:", messages);
      this.worker.postMessage({ type: "generate", data: messages });
    });

    this.interruptBtn.addEventListener("click", () => {
      this.log("Interrupting generation...");
      this.worker.postMessage({ type: "interrupt" });
    });

    resetBtn?.addEventListener("click", () => {
      this.log("Resetting state...");
      this.worker.postMessage({ type: "reset" });
      this.outputDiv.textContent = "";
      this.updateStatus("ready");
    });
  }

  private updateStatus(status: WorkerStatus): void {
    this.statusDiv.textContent = `Status: ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`;
    this.statusDiv.style.background = this.getStatusColor(status);
  }

  private getStatusColor(status: WorkerStatus): string {
    switch (status) {
      case "ready":
        return "#e8f5e9";
      case "loading":
        return "#fff3e0";
      case "generating":
        return "#e3f2fd";
      case "error":
        return "#ffebee";
      default:
        return "#f5f5f5";
    }
  }

  private log(...args: any[]): void {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

    // Console出力
    console.log(`[${timestamp}]`, ...args);

    // DOM出力用のメッセージを整形
    const message = args
      .map((arg) => {
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return "[Object]";
          }
        }
        return String(arg);
      })
      .join(" ");

    // 出力を追加（最新のメッセージが上に来るように）
    this.outputDiv.textContent = `[${timestamp}] ${message}\n${this.outputDiv.textContent}`;
  }
}

// Initialize the tester when the page loads
window.addEventListener("load", () => {
  try {
    new WorkerTester();
    console.log("Worker tester initialized");
  } catch (error) {
    console.error("Failed to initialize worker tester:", error);
  }
});
