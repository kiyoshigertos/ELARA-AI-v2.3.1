import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { ConversationThread, StudentDocument, StudyTask } from '../types';

export interface SearchResultItem {
  id: string;
  kind: 'document' | 'task' | 'conversation';
  title: string;
  subtitle: string;
  meta: string;
  completed?: boolean;
}

interface GlobalSearchProps {
  documents: StudentDocument[];
  tasks: StudyTask[];
  conversations: ConversationThread[];
  onSelectDocument: (docId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectConversation: (convId: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  documents,
  tasks,
  conversations,
  onSelectDocument,
  onSelectTask,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'document' | 'task' | 'conversation'>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut (Ctrl+K or Cmd+K) and Escape handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 20);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMatchSnippet = (text: string, q: string): string => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!q) return clean.slice(0, 90);
    const idx = clean.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return clean.slice(0, 90);
    const start = Math.max(0, idx - 28);
    const end = Math.min(clean.length, idx + q.length + 52);
    return `${start > 0 ? '...' : ''}${clean.slice(start, end)}${end < clean.length ? '...' : ''}`;
  };

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Search Documents
    if (categoryFilter === 'all' || categoryFilter === 'document') {
      documents.forEach((doc) => {
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesBody = doc.textContent.toLowerCase().includes(q);
        if (!q || matchesName || matchesBody) {
          items.push({
            id: doc.id,
            kind: 'document',
            title: doc.name,
            subtitle: getMatchSnippet(doc.textContent, q),
            meta: `${doc.type.toUpperCase()} · ${(doc.sizeBytes / 1024).toFixed(1)} KB`,
          });
        }
      });
    }

    // 2. Search Study Tasks
    if (categoryFilter === 'all' || categoryFilter === 'task') {
      tasks.forEach((task) => {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSubject = task.subject.toLowerCase().includes(q);
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesNotes = (task.notes || '').toLowerCase().includes(q);
        if (!q || matchesTitle || matchesSubject || matchesCategory || matchesNotes) {
          items.push({
            id: task.id,
            kind: 'task',
            title: task.title,
            subtitle: task.notes ? getMatchSnippet(task.notes, q) : `${task.subject} · ${task.category}`,
            meta: `${task.dueDate} · ${task.priority} Priority`,
            completed: task.completed,
          });
        }
      });
    }

    // 3. Search Past Conversations
    if (categoryFilter === 'all' || categoryFilter === 'conversation') {
      conversations.forEach((conv) => {
        const matchesTitle = conv.title.toLowerCase().includes(q);
        const matchingMsg = conv.messages.find((m) => m.content.toLowerCase().includes(q));
        if (!q || matchesTitle || matchingMsg) {
          const snippetSource = matchingMsg
            ? matchingMsg.content
            : conv.messages[conv.messages.length - 1]?.content || '';
          items.push({
            id: conv.id,
            kind: 'conversation',
            title: conv.title,
            subtitle: getMatchSnippet(snippetSource, q),
            meta: `${conv.messages.length} msgs · ${new Date(conv.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}`,
          });
        }
      });
    }

    return items.slice(0, 18);
  }, [query, categoryFilter, documents, tasks, conversations]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, categoryFilter]);

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.kind === 'document') {
      onSelectDocument(item.id);
    } else if (item.kind === 'task') {
      onSelectTask(item.id);
    } else {
      onSelectConversation(item.id);
    }
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelectItem(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Compact Header Search Input (Desktop & Tablet) */}
      <div className="hidden sm:flex items-center relative w-48 md:w-56 lg:w-64">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search docs, tasks, chats..."
          aria-label="Global search across documents, tasks, and conversations"
          className="w-full pl-8 pr-12 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden lg:inline-block absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Mobile Search Trigger Button (< sm screens) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 20);
        }}
        className="sm:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
        aria-label="Open Global Search"
        title="Search documents, tasks, and conversations"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Search Results Popover / Command Palette */}
      {isOpen && (
        <>
          {/* Subtle backdrop on mobile so tapping outside is effortless */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[440px] md:w-[480px] z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            {/* Mobile Input Bar inside Popover */}
            <div className="sm:hidden p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search documents, tasks, or chats..."
                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'document', label: 'Documents' },
                    { id: 'task', label: 'Tasks' },
                    { id: 'conversation', label: 'Conversations' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === tab.id
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                {results.length} {results.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
              {results.length === 0 ? (
                <div className="p-8 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    No matching results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Try searching by subject name, assignment keyword, document title, or chat topic.
                  </p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full p-3 text-left flex items-start justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-sky-500/10 dark:bg-sky-500/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shrink-0">
                          {item.kind === 'document' && <FileText className="w-3.5 h-3.5" />}
                          {item.kind === 'task' && <Calendar className="w-3.5 h-3.5" />}
                          {item.kind === 'conversation' && (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {item.kind === 'task' &&
                              (item.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ))}
                            <span
                              className={`text-xs font-semibold truncate ${
                                item.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
                            <span className="capitalize text-sky-600 dark:text-sky-400 font-sans font-medium">
                              {item.kind}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.meta}</span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${
                          isSelected
                            ? 'text-sky-600 dark:text-sky-400 translate-x-0.5'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Keyboard Hint */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Use ↑↓ arrows and Enter to jump directly</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
