type WorkerStatus = "ready" | "loading" | "generating" | "error";

interface TestCase {
  name: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

class WorkerTester {
  private worker: Worker;
  private outputDiv!: HTMLElement;
  private statusDiv!: HTMLElement;
  private generateBtn!: HTMLButtonElement;
  private interruptBtn!: HTMLButtonElement;
  private testSimpleBtn!: HTMLButtonElement;
  private testFollowUpBtn!: HTMLButtonElement;

  private readonly TEST_CASES: TestCase[] = [
    {
      name: "Simple Test",
      messages: [
        {
          role: "user",
          content: "Solve the equation x^2 - 3x + 2 = 0",
        },
      ],
    },
    {
      name: "Follow-up Test",
      messages: [
        {
          role: "user",
          content: "Solve the equation x^2 - 3x + 2 = 0",
        },
        {
          role: "assistant",
          content:
            // 下記のようにOutputをそのままContentにすると、正しい形式のOuputが得られない
            //"<｜User｜>Solve the equation x^2 - 3x + 2 = 0<｜Assistant｜><think>\nTo solve the quadratic equation \\( x^2 - 3x + 2 = 0 \\), I'll start by factoring the left-hand side. I need two numbers that multiply to 2 and add up to -3. These numbers are -1 and -2.\n\nNext, I'll rewrite the equation as \\( (x - 1)(x - 2) = 0 \\). \n\nUsing the zero product property, I'll set each factor equal to zero:\n1. \\( x - 1 = 0 \\) leads to \\( x = 1 \\).\n2. \\( x - 2 = 0 \\) leads to \\( x = 2 \\).\n\nTherefore, the solutions to the equation are \\( x = 1 \\) and \\( x = 2 \\).\n</think>\n\nTo solve the quadratic equation:\n\n\\[\nx^2 - 3x + 2 = 0\n\\]\n\n**Step 1: Factor the Quadratic**\n\nWe look for two numbers that multiply to \\( +2 \\) and add up to \\( -3 \\). These numbers are \\( -1 \\) and \\( -2 \\).\n\n\\[\nx^2 - 3x + 2 = (x - 1)(x - 2) = 0\n\\]\n\n**Step 2: Apply the Zero Product Property**\n\nIf the product of two factors is zero, at least one of the factors must be zero.\n\n\\[\nx - 1 = 0 \\quad \\text{or} \\quad x - 2 = 0\n\\]\n\n**Step 3: Solve for \\( x \\)**\n\n\\[\nx = 1 \\quad \\text{or} \\quad x = 2\n\\]\n\n**Final Answer:**\n\n\\[\n\\boxed{1 \\text{ and } 2}\n\\]",

            // 以下のように前のメッセージのAnswerのみをContentにすると、正しい形式のOuputが得られる
            "To solve the quadratic equation:\n\n\\[\nx^2 - 3x + 2 = 0\n\\]\n\n**Step 1: Factor the Quadratic**\n\nWe look for two numbers that multiply to \\( +2 \\) and add up to \\( -3 \\). These numbers are \\( -1 \\) and \\( -2 \\).\n\n\\[\nx^2 - 3x + 2 = (x - 1)(x - 2) = 0\n\\]\n\n**Step 2: Apply the Zero Product Property**\n\nIf the product of two factors is zero, at least one of the factors must be zero.\n\n\\[\nx - 1 = 0 \\quad \\text{or} \\quad x - 2 = 0\n\\]\n\n**Step 3: Solve for \\( x \\)**\n\n\\[\nx = 1 \\quad \\text{or} \\quad x = 2\n\\]\n\n**Final Answer:**\n\n\\[\n\\boxed{1 \\text{ and } 2}\n\\]",
        },
        {
          role: "user",
          content:
            "Can you verify these solutions by substituting them back into the original equation?",
        },
      ],
    },
  ];

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
    const testSimpleBtn = document.getElementById("testSimpleBtn");
    const testFollowUpBtn = document.getElementById("testFollowUpBtn");

    if (
      !outputDiv ||
      !statusDiv ||
      !generateBtn ||
      !interruptBtn ||
      !testSimpleBtn ||
      !testFollowUpBtn
    ) {
      throw new Error("Required elements not found");
    }

    this.outputDiv = outputDiv;
    this.statusDiv = statusDiv;
    this.generateBtn = generateBtn as HTMLButtonElement;
    this.interruptBtn = interruptBtn as HTMLButtonElement;
    this.testSimpleBtn = testSimpleBtn as HTMLButtonElement;
    this.testFollowUpBtn = testFollowUpBtn as HTMLButtonElement;
  }

  private setupWorkerHandlers(): void {
    this.worker.onmessage = (e: MessageEvent) => {
      const { status, data } = e.data;
      this.log("Worker response:", e.data);

      switch (status) {
        case "ready":
          this.updateStatus("ready");
          this.generateBtn.disabled = false;
          this.testSimpleBtn.disabled = false;
          this.testFollowUpBtn.disabled = false;
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
          content: "Hello! Can you help me with a math problem?",
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

    this.testSimpleBtn.addEventListener("click", () => {
      const testCase = this.TEST_CASES[0];
      this.log(`Running test: ${testCase.name}`);
      this.worker.postMessage({ type: "generate", data: testCase.messages });
    });

    this.testFollowUpBtn.addEventListener("click", () => {
      const testCase = this.TEST_CASES[1];
      this.log(`Running test: ${testCase.name}`);
      this.worker.postMessage({ type: "generate", data: testCase.messages });
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
