'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  autoFocus?: boolean;
}

type EditorMode = 'edit' | 'preview' | 'split';

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter markdown text...",
  className = "",
  rows = 3,
  autoFocus = false
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>('edit');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-switch from split to edit on mobile
  useEffect(() => {
    if (isMobile && mode === 'split') {
      setMode('edit');
    }
  }, [isMobile, mode]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const baseClassName = "w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] resize-y touch-manipulation";
  const fullClassName = `${baseClassName} ${className}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Toggle Buttons */}
      <div className="flex gap-1 bg-[#f5f7fa] rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] touch-manipulation ${
            mode === 'edit'
              ? 'bg-white text-[#111418] shadow-sm'
              : 'text-[#5e7387] hover:text-[#111418]'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] touch-manipulation ${
            mode === 'preview'
              ? 'bg-white text-[#111418] shadow-sm'
              : 'text-[#5e7387] hover:text-[#111418]'
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setMode('split')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] touch-manipulation md:block hidden ${
            mode === 'split'
              ? 'bg-white text-[#111418] shadow-sm'
              : 'text-[#5e7387] hover:text-[#111418]'
          }`}
        >
          Split
        </button>
      </div>

      {/* Editor Content */}
      <div className={`flex gap-2 ${mode === 'split' ? 'md:flex-row flex-col' : ''}`}>
        {/* Edit Mode */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={mode === 'split' ? 'flex-1' : 'w-full'}>
            <textarea
              value={value}
              onChange={handleTextareaChange}
              placeholder={placeholder}
              className={fullClassName}
              rows={rows}
              autoFocus={autoFocus}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              style={{ minHeight: `${rows * 1.5}rem` }}
            />
          </div>
        )}

        {/* Preview Mode */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={mode === 'split' ? 'flex-1' : 'w-full'}>
            <div 
              className={`${fullClassName} bg-gray-50 overflow-y-auto`}
              style={{ minHeight: `${rows * 1.5}rem` }}
            >
              {value.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom components for better styling
                    h1: ({children}) => <h1 className="text-xl font-bold mb-2 text-[#111418]">{children}</h1>,
                    h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-[#111418]">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-medium mb-2 text-[#111418]">{children}</h3>,
                    p: ({children}) => <p className="text-[#111418] mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-5 mb-2 text-[#111418]">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 mb-2 text-[#111418]">{children}</ol>,
                    li: ({children}) => <li className="mb-1">{children}</li>,
                    code: ({className, children}) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-[#111418]">
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-200 p-3 rounded text-sm font-mono text-[#111418] overflow-x-auto">
                          {children}
                        </code>
                      );
                    },
                    pre: ({children}) => <pre className="bg-gray-200 p-3 rounded mb-2 overflow-x-auto">{children}</pre>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-[#b8cee4] pl-4 mb-2 text-[#5e7387]">
                        {children}
                      </blockquote>
                    ),
                    a: ({href, children}) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#b8cee4] hover:text-[#a5c1db] underline"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({children}) => <strong className="font-semibold text-[#111418]">{children}</strong>,
                    em: ({children}) => <em className="italic text-[#111418]">{children}</em>,
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-[#5e7387] italic">{placeholder}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Markdown Syntax Help */}
      {mode === 'edit' && (
        <div className="text-xs text-[#5e7387] space-y-1">
          <p className="font-medium">Markdown supported:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span><code>**bold**</code> → <strong>bold</strong></span>
            <span><code>*italic*</code> → <em>italic</em></span>
            <span><code>`code`</code> → <code className="bg-gray-200 px-1 rounded">code</code></span>
            <span><code>[link](url)</code> → <a href="#" className="text-[#b8cee4] underline">link</a></span>
            <span><code># Header</code> → Header</span>
            <span><code>- List item</code> → • List item</span>
          </div>
        </div>
      )}
    </div>
  );
}