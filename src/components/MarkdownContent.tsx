import React, { useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const [renderedContent, setRenderedContent] = useState("");

  useEffect(() => {
    let mounted = true;

    async function renderContent() {
      // バックスラッシュのエスケープ処理
      const escapedContent = content.replace(/\\([\[\]\(\)])/g, "\\\\$1");

      try {
        const parsed = await marked.parse(escapedContent, {
          breaks: true,
          gfm: true,
        });
        if (mounted) {
          setRenderedContent(DOMPurify.sanitize(parsed));
        }
      } catch (error) {
        console.error("Error rendering markdown:", error);
        if (mounted) {
          setRenderedContent(escapedContent);
        }
      }
    }

    renderContent();
    return () => {
      mounted = false;
    };
  }, [content]);

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MarkdownContent;
