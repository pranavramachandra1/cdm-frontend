'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for consistent styling with your app
          h1: ({children}) => <h1 className="text-sm font-semibold mb-1 text-[#111418]">{children}</h1>,
          h2: ({children}) => <h2 className="text-sm font-medium mb-1 text-[#111418]">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-medium mb-1 text-[#111418]">{children}</h3>,
          p: ({children}) => <p className="text-sm text-[#5e7387] mb-1 last:mb-0 leading-normal">{children}</p>,
          ul: ({children}) => <ul className="list-disc pl-4 mb-1 text-sm text-[#5e7387]">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 mb-1 text-sm text-[#5e7387]">{children}</ol>,
          li: ({children}) => <li className="mb-0.5">{children}</li>,
          code: ({className, children}) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-[#111418]">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-200 p-2 rounded text-xs font-mono text-[#111418] overflow-x-auto mb-1">
                {children}
              </code>
            );
          },
          pre: ({children}) => <pre className="bg-gray-200 p-2 rounded mb-1 overflow-x-auto">{children}</pre>,
          blockquote: ({children}) => (
            <blockquote className="border-l-2 border-[#b8cee4] pl-2 mb-1 text-[#5e7387]">
              {children}
            </blockquote>
          ),
          a: ({href, children}) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#b8cee4] hover:text-[#a5c1db] underline text-sm"
            >
              {children}
            </a>
          ),
          strong: ({children}) => <strong className="font-semibold text-[#111418]">{children}</strong>,
          em: ({children}) => <em className="italic text-[#5e7387]">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}