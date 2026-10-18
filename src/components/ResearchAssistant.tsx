import React, { useState } from 'react';
import {
  Compass,
  FileSpreadsheet,
  Globe,
  Quote,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { SavedCitation } from '../types';
import { FormattedText } from './FormattedText';

interface ResearchAssistantProps {
  citations: SavedCitation[];
  onSaveCitation: (citation: SavedCitation) => void;
  onDeleteCitation: (id: string) => void;
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  citations,
  onSaveCitation,
  onDeleteCitation,
}) => {
  const [activeTab, setActiveTab] = useState<'topic' | 'structure' | 'discover' | 'citations'>(
    'topic'
  );

  // Topic & Structure state
  const [queryInput, setQueryInput] = useState('');
  const [discipline, setDiscipline] = useState('General Academic');
  const [topicResult, setTopicResult] = useState('');
  const [structureResult, setStructureResult] = useState('');
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);

  // Live Discovery state
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverySynthesis, setDiscoverySynthesis] = useState('');
  const [discoveredSources, setDiscoveredSources] = useState<{ title: string; url: string }[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  // Citation Builder state
  const [citTitle, setCitTitle] = useState('');
  const [citAuthors, setCitAuthors] = useState('');
  const [citYear, setCitYear] = useState('');
  const [citJournal, setCitJournal] = useState('');
  const [citUrl, setCitUrl] = useState('');
  const [citFormat, setCitFormat] = useState<'APA' | 'MLA' | 'IEEE' | 'Chicago'>('APA');
  const [isFormattingCitation, setIsFormattingCitation] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTopicOrStructure = async (action: 'topic' | 'structure', e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setIsLoadingResearch(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          query: queryInput,
          discipline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research request failed');
      if (action === 'topic') {
        setTopicResult(data.result);
      } else {
        setStructureResult(data.result);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoadingResearch(false);
    }
  };

  const handleWebDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingWeb(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'discover',
          query: searchQuery,
          discipline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research discovery failed');
      setDiscoverySynthesis(data.synthesis || '');
      setDiscoveredSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const handleGenerateCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citTitle.trim() && !citUrl.trim()) return;
    setIsFormattingCitation(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'citation',
          format: citFormat,
          sourceMetadata: {
            title: citTitle.trim(),
            authors: citAuthors.trim(),
            publicationDateOrYear: citYear.trim(),
            journalOrPublisher: citJournal.trim(),
            urlOrDoi: citUrl.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Citation formatting failed');

      const newCit: SavedCitation = {
        id: `cit-${Date.now()}`,
        title: citTitle.trim() || 'Untitled Source',
        authors: citAuthors.trim(),
        year: citYear.trim(),
        sourceOrJournal: citJournal.trim(),
        urlOrDoi: citUrl.trim(),
        format: citFormat,
        formattedReference: data.formattedReference || '',
        inTextCitation: data.inTextCitation || '',
        missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
        createdAt: new Date().toISOString(),
      };

      onSaveCitation(newCit);
      setCitTitle('');
      setCitAuthors('');
      setCitYear('');
      setCitJournal('');
      setCitUrl('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsFormattingCitation(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Research Assistant & Citation Integrity
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Develop feasible thesis topics, structure chapters by discipline, discover verified web sources, and format honest citations (APA, MLA, IEEE, Chicago).
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg w-fit border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('topic')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'topic'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Topic & Problem Statement</span>
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'structure'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Paper Structure Blueprint</span>
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'discover'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live Source Discovery</span>
        </button>
        <button
          onClick={() => setActiveTab('citations')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'citations'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Citation & Reference Manager</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* TAB 1 & 2: TOPIC DEVELOPMENT OR PAPER STRUCTURE */}
      {(activeTab === 'topic' || activeTab === 'structure') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => handleTopicOrStructure(activeTab, e)}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {activeTab === 'topic'
                ? 'Brainstorm & Narrow Your Research Topic'
                : 'Adaptive Research Paper Structure'}
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Academic Discipline / Format
              </label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="e.g., BS Information Technology Capstone / IMRaD / Thesis"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {activeTab === 'topic'
                  ? 'Broad Interest or Initial Idea'
                  : 'Working Research Title & Special Instructions'}
              </label>
              <textarea
                rows={4}
                required
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={
                  activeTab === 'topic'
                    ? 'e.g., Using mobile apps to help college students manage study habits and reduce academic burnout...'
                    : 'e.g., Design and Evaluation of an Offline-First Study Companion for University Students (Chapters 1 to 3)...'
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingResearch}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {isLoadingResearch
                ? 'Developing Research Guidance...'
                : activeTab === 'topic'
                ? 'Develop Research Questions & Gaps'
                : 'Generate Section-by-Section Structure'}
            </button>
          </form>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            {(activeTab === 'topic' ? topicResult : structureResult) ? (
              <FormattedText text={activeTab === 'topic' ? topicResult : structureResult} />
            ) : (
              <div className="h-full min-h-[280px] flex items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500 max-w-md">
                  {activeTab === 'topic'
                    ? 'Enter your general research area to receive narrowed, feasible topics, problem statements, specific research questions, objectives, and methodology options.'
                    : 'Enter your research title and institutional format to organize chapters (Background of the Study, Statement of the Problem, Scope & Limitations, RRL, Methodology, etc.).'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE WEB SEARCH GROUNDING DISCOVERY */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          <form
            onSubmit={handleWebDiscovery}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Live Grounded Research Discovery
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uses Google Search grounding to retrieve real web sources and distinguishes verified findings from AI synthesis.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for empirical studies, frameworks, or literature on your research question..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isSearchingWeb}
                className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                {isSearchingWeb ? 'Searching Verified Sources...' : 'Search Literature & Web'}
              </button>
            </div>
          </form>

          {(discoverySynthesis || discoveredSources.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Research Synthesis & Relevance
                </h3>
                <FormattedText text={discoverySynthesis} />
              </div>

              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Verified Grounding Sources ({discoveredSources.length})
                </h3>
                {discoveredSources.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No direct web links returned for this query. Always verify bibliographic details before citing.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {discoveredSources.map((src, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-start justify-between gap-2"
                        >
                          <span>{src.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        </a>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {src.url}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCitTitle(src.title);
                            setCitUrl(src.url);
                            setActiveTab('citations');
                          }}
                          className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600"
                        >
                          Send to Citation Formatter →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CITATION ASSISTANCE & REFERENCE LIST */}
      {activeTab === 'citations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleGenerateCitation}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Format Honest Citations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ELARA formats your actual metadata and flags any missing bibliographic fields instead of fabricating DOIs or authors.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Citation Style
              </label>
              <select
                value={citFormat}
                onChange={(e) =>
                  setCitFormat(e.target.value as 'APA' | 'MLA' | 'IEEE' | 'Chicago')
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="APA">APA (7th Edition)</option>
                <option value="MLA">MLA (9th Edition)</option>
                <option value="IEEE">IEEE</option>
                <option value="Chicago">Chicago</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Source / Article Title *
              </label>
              <input
                type="text"
                required
                value={citTitle}
                onChange={(e) => setCitTitle(e.target.value)}
                placeholder="e.g., Adaptive Scaffolding in University STEM Courses"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Author(s) / Organization
                </label>
                <input
                  type="text"
                  value={citAuthors}
                  onChange={(e) => setCitAuthors(e.target.value)}
                  placeholder="e.g., Santos, M. R."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Publication Year
                </label>
                <input
                  type="text"
                  value={citYear}
                  onChange={(e) => setCitYear(e.target.value)}
                  placeholder="e.g., 2025"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Journal, Publisher, or Website Name
              </label>
              <input
                type="text"
                value={citJournal}
                onChange={(e) => setCitJournal(e.target.value)}
                placeholder="e.g., Journal of Educational Computing"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL or DOI
              </label>
              <input
                type="text"
                value={citUrl}
                onChange={(e) => setCitUrl(e.target.value)}
                placeholder="https://doi.org/..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isFormattingCitation}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {isFormattingCitation ? 'Formatting & Auditing Metadata...' : 'Format & Save Citation'}
            </button>
          </form>

          {/* Saved Reference List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Organized Reference List ({citations.length})
              </h2>
            </div>

            {citations.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
                No citations saved yet. Enter source metadata on the left to build your bibliography.
              </div>
            ) : (
              citations.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {c.format} Format · In-text: {c.inTextCitation}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(c.formattedReference, c.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                      >
                        {copiedId === c.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteCitation(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                        title="Remove Reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 font-serif pl-6 -indent-6 leading-relaxed">
                    {c.formattedReference}
                  </p>

                  {c.missingFields && c.missingFields.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Missing metadata to verify: {c.missingFields.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
