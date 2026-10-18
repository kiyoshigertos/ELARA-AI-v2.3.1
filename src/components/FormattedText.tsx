import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by code blocks first
  const segments = text.split(/(```[\s\S]*?```)/g);

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-sky-700 dark:text-sky-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`space-y-2.5 leading-relaxed text-[15px] ${className}`}>
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const lines = segment.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={segIdx}
              className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100"
            >
              {hasLang && (
                <div className="px-3 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <span>{firstLine}</span>
                </div>
              )}
              <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        const paragraphs = segment.split('\n');
        return (
          <div key={segIdx} className="space-y-1.5">
            {paragraphs.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-1" />;
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={lineIdx}
                    className="text-base font-semibold text-slate-900 dark:text-white pt-2"
                  >
                    {renderInline(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={lineIdx}
                    className="text-lg font-semibold text-slate-900 dark:text-white pt-2.5"
                  >
                    {renderInline(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2
                    key={lineIdx}
                    className="text-xl font-bold text-slate-900 dark:text-white pt-3"
                  >
                    {renderInline(trimmed.slice(2))}
                  </h2>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2.5 pl-1">
                    <span className="text-sky-500 select-none mt-1.5 text-xs">•</span>
                    <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
                  </div>
                );
              }
              if (/^\d+\.\s/.test(trimmed)) {
                const match = trimmed.match(/^(\d+\.)\s(.*)$/);
                if (match) {
                  return (
                    <div key={lineIdx} className="flex items-start gap-2.5 pl-1">
                      <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1 shrink-0 tabular-nums">
                        {match[1]}
                      </span>
                      <span className="flex-1">{renderInline(match[2])}</span>
                    </div>
                  );
                }
              }
              return <p key={lineIdx}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};
