# DeepSeek-R1 WebGPU TypeScript

A TypeScript port of [deepseek-r1-webgpu](https://github.com/huggingface/transformers.js-examples/tree/main/deepseek-r1-webgpu), implementing the DeepSeek-R1 model that runs directly in the browser using WebGPU.

## Features

- 🚀 Full TypeScript support with proper type definitions
- 💻 WebGPU acceleration for fast inference
- 🧠 Local in-browser DeepSeek-R1 model execution
- 🎨 Modern UI with Tailwind CSS
- ⚡ Built with Vite for optimal development experience
- 🔄 Web Worker support for non-blocking model operations

## Prerequisites

- Node.js (v18 or later recommended)
- A browser with WebGPU support (Chrome Canary or other compatible browser)
- GPU with WebGPU capabilities

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yonaka15/deepseek-r1-webgpu-ts.git
cd deepseek-r1-webgpu-ts
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
deepseek-r1-webgpu-ts/
├── src/
│   ├── components/    # React components
│   ├── lib/          # Utility functions and core logic
│   ├── assets/       # Static assets
│   ├── types.ts      # TypeScript type definitions
│   ├── worker.ts     # Web Worker implementation
│   └── App.tsx       # Main application component
├── public/           # Public static files
└── ...config files   # Various configuration files
```

## Key Dependencies

- React 18.3 with TypeScript
- @huggingface/transformers v3.3.2
- Tailwind CSS v4.0
- WebGPU Types
- DOMPurify and Marked for safe Markdown rendering
- MathJax for mathematical equation rendering

## Development

This project uses TypeScript for enhanced type safety and developer experience. Key development tools include:

- TypeScript for static type checking
- ESLint for code linting
- Vite for fast development and building
- Tailwind CSS for styling

## Browser Compatibility

This application requires WebGPU support. Currently, this means:

- Chrome Canary with WebGPU flags enabled
- Other browsers with experimental WebGPU support

Please check [caniuse.com](https://caniuse.com/webgpu) for up-to-date browser support information.

## Model Details

DeepSeek-R1-Distill-Qwen-1.5B is a distilled version of the larger DeepSeek-R1 model, specifically optimized for ONNX runtime. Key features:

- Size: 1.5 billion parameters
- Model Format: ONNX optimized
- Loading Size: 1.28GB
- Base Architecture: Derived from Qwen-2.5 series
- License: MIT License (allows commercial use and modifications)
- Capabilities:
  - Strong mathematical reasoning
  - Step-by-step problem solving
  - Support for chain-of-thought prompting
  - Specialized in educational and analytical tasks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Original Project

This is a TypeScript port of the original project:

- [Original Repository](https://github.com/huggingface/transformers.js-examples/tree/main/deepseek-r1-webgpu)
- [Live Demo](https://huggingface.co/spaces/webml-community/deepseek-r1-webgpu)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original [DeepSeek-R1 WebGPU](https://github.com/huggingface/transformers.js-examples/tree/main/deepseek-r1-webgpu) project by Hugging Face
- [DeepSeek AI](https://deepseek.ai/) for the base model
- The Hugging Face team for transformers.js

## Additional Resources

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
