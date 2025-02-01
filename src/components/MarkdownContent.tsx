import React, { useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { Config } from "dompurify";
import { MathJaxContext, MathJax } from "better-react-mathjax";

// MathJaxの設定
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
  },
};

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const [renderedContent, setRenderedContent] = useState("");

  useEffect(() => {
    let mounted = true;

    const renderContent = async () => {
      try {
        // 数式を一時的なプレースホルダーで置換
        const mathExpressions: string[] = [];
        let protectedContent = content;

        // インライン数式とディスプレイ数式を保護
        [
          /\$\$([\s\S]*?)\$\$/g, // $$...$$
          /\\\[([\s\S]*?)\\\]/g, // \[...\]
          /\$([^\n$]*?)\$/g, // $...$
          /\\\((.*?)\\\)/g, // \(...\)
        ].forEach((pattern) => {
          protectedContent = protectedContent.replace(pattern, (match) => {
            mathExpressions.push(match);
            return `MATH_EXPRESSION_${mathExpressions.length - 1}`;
          });
        });

        // マークダウンをパース
        marked.setOptions({
          breaks: true,
          gfm: true,
          pedantic: false,
          silent: true,
        });

        const parsed = await marked.parse(protectedContent);

        // 数式を復元
        const restoredContent = parsed.replace(
          /MATH_EXPRESSION_(\d+)/g,
          (_, index) => {
            const math = mathExpressions[parseInt(index)];
            if (math) {
              if (math.startsWith("$$") || math.startsWith("\\[")) {
                return `<div class="math-block">${math}</div>`;
              }
              return `<span class="math-inline">${math}</span>`;
            }
            return "";
          }
        );

        if (mounted) {
          // DOMPurifyの設定
          const purifyConfig: Config = {
            ALLOWED_TAGS: [
              // ブロック要素
              "p",
              "div",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "blockquote",
              "pre",
              "ul",
              "ol",
              "li",
              // インライン要素
              "span",
              "strong",
              "em",
              "code",
              "a",
              "br",
              // テーブル要素
              "table",
              "thead",
              "tbody",
              "tr",
              "th",
              "td",
              // その他
              "hr",
            ],
            ALLOWED_ATTR: ["href", "class", "id"],
            ADD_TAGS: ["math", "mrow", "mi", "mo", "mn"], // MathJax用のタグを許可
            ALLOW_DATA_ATTR: false,
            USE_PROFILES: {
              html: true,
              svg: false,
              svgFilters: false,
              mathMl: true,
            },
          };

          const sanitized = DOMPurify.sanitize(restoredContent, purifyConfig);
          setRenderedContent(sanitized);
        }
      } catch (error) {
        console.error("Error rendering markdown:", error);
        if (mounted) {
          setRenderedContent(`<p>${content}</p>`);
        }
      }
    };

    renderContent();
    return () => {
      mounted = false;
    };
  }, [content]);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <MathJax>
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </MathJax>
    </MathJaxContext>
  );
};

export default MarkdownContent;
