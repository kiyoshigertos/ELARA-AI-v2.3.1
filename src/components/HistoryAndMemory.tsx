import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  Trash2,
  Plus,
  Brain,
  Edit3,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ConversationThread, MemoryItem } from '../types';

interface HistoryAndMemoryProps {
  conversations: ConversationThread[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  memories: MemoryItem[];
  memoryEnabled: boolean;
  onToggleMemoryEnabled: () => void;
  onAddMemory: (category: MemoryItem['category'], content: string) => void;
  onUpdateMemory: (id: string, content: string) => void;
  onDeleteMemory: (id: string) => void;
}

const MEMORY_CATEGORIES: MemoryItem['category'][] = [
  'Learning Preferences',
  'Preferred Language',
  'Ongoing Academic Projects',
  'Student-Selected Goals',
  'Important Study Context',
  'User-Approved Preferences',
];

export const HistoryAndMemory: React.FC<HistoryAndMemoryProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllConversations,
  memories,
  memoryEnabled,
  onToggleMemoryEnabled,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newMemCategory, setNewMemCategory] = useState<MemoryItem['category']>(
    'Learning Preferences'
  );
  const [newMemContent, setNewMemContent] = useState('');
  const [editingMemId, setEditingMemId] = useState<string | null>(null);
  const [editMemValue, setEditMemValue] = useState('');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const filteredConversations = conversations.filter((c) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemContent.trim()) return;
    onAddMemory(newMemCategory, newMemContent.trim());
    setNewMemContent('');
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Conversation History & Student-Controlled Memory
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Search past chats or review and edit what ELARA remembers about your learning preferences. Sensitive wellness journals are never automatically saved as long-term memories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Searchable Conversation History (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Saved Conversations ({conversations.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onNewConversation}
                className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
              {!confirmClearHistory ? (
                <button
                  onClick={() => setConfirmClearHistory(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  Clear All
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClearAllConversations();
                    setConfirmClearHistory(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium"
                >
                  Confirm Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations by title or message content..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No conversations match your search.
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const isCurrent = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {conv.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                          <span>{conv.messages.length} messages</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {new Date(conv.updatedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Controlled Memory System (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-sky-500" />
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Controlled Learning Memory
                </h2>
                <p className="text-xs text-slate-500">
                  Explicit facts ELARA uses to personalize explanations
                </p>
              </div>
            </div>

            <button
              onClick={onToggleMemoryEnabled}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {memoryEnabled ? (
                <>
                  <ToggleRight className="w-6 h-6 text-sky-500" />
                  <span>Memory Enabled</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                  <span>Memory Disabled</span>
                </>
              )}
            </button>
          </div>

          {/* Add Memory Form */}
          <form onSubmit={handleAddMemorySubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newMemCategory}
                onChange={(e) =>
                  setNewMemCategory(e.target.value as MemoryItem['category'])
                }
                className="sm:col-span-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              >
                {MEMORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newMemContent}
                onChange={(e) => setNewMemContent(e.target.value)}
                placeholder="Add a learning preference or academic project..."
                className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors"
            >
              Add Approved Memory
            </button>
          </form>

          {/* Saved Memories List */}
          <div className="space-y-2.5">
            {memories.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No long-term memories stored.
              </p>
            ) : (
              memories.map((mem) => {
                const isEditing = editingMemId === mem.id;
                return (
                  <div
                    key={mem.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {mem.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <button
                            onClick={() => {
                              if (editMemValue.trim()) {
                                onUpdateMemory(mem.id, editMemValue.trim());
                              }
                              setEditingMemId(null);
                            }}
                            className="p-1 text-emerald-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMemId(mem.id);
                              setEditMemValue(mem.content);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editMemValue}
                        onChange={(e) => setEditMemValue(e.target.value)}
                        className="w-full rounded border border-sky-500 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        {mem.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
