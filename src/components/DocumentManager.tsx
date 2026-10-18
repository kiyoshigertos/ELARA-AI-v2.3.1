import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Edit3,
  Sparkles,
  GitCompare,
  HelpCircle,
  CalendarClock,
  BookOpen,
  ListChecks,
  AlertCircle,
  Check,
} from 'lucide-react';
import { StudentDocument } from '../types';
import { FormattedText } from './FormattedText';

interface DocumentManagerProps {
  documents: StudentDocument[];
  onAddDocument: (doc: StudentDocument) => void;
  onRenameDocument: (id: string, newName: string) => void;
  onDeleteDocument: (id: string) => void;
  initialSelectedDocId?: string;
}

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB limit

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onAddDocument,
  onRenameDocument,
  onDeleteDocument,
  initialSelectedDocId,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialSelectedDocId || documents[0]?.id || ''
  );

  React.useEffect(() => {
    if (initialSelectedDocId) {
      setSelectedDocId(initialSelectedDocId);
    }
  }, [initialSelectedDocId]);
  const [compareDocId, setCompareDocId] = useState<string>('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analysis state
  const [questionInput, setQuestionInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisLabel, setAnalysisLabel] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File exceeds the 12 MB maximum size limit.');
      e.target.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['txt', 'md', 'csv', 'json', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx'];
    if (!allowedExts.includes(ext)) {
      setUploadError(
        `Unsupported file format (.${ext}). Supported formats: PDF, TXT, CSV, MD, DOCX, PNG, JPG.`
      );
      e.target.value = '';
      return;
    }

    // Text-based files
    if (['txt', 'md', 'csv', 'json'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = (reader.result as string) || '';
        const newDoc: StudentDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: ext,
          mimeType: file.type || 'text/plain',
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          textContent,
          isSample: false,
        };
        onAddDocument(newDoc);
        setSelectedDocId(newDoc.id);
      };
      reader.readAsText(file);
    } else {
      // Binary / Multimodal files (PDF, Images, DOCX)
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.split(',')[1] || '';
        const mimeType =
          ext === 'pdf'
            ? 'application/pdf'
            : file.type || 'application/octet-stream';

        const newDoc: StudentDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: ext,
          mimeType,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          textContent:
            ext === 'docx'
              ? `[Uploaded DOCX File: ${file.name}. For deepest section-by-section accuracy, you can also paste specific text passages or upload PDF/TXT.]`
              : `[Multimodal ${ext.toUpperCase()} Document attached for Gemini analysis: ${file.name}]`,
          inlineData:
            ext === 'pdf' || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
              ? { mimeType, data: base64Data }
              : undefined,
          isSample: false,
        };
        onAddDocument(newDoc);
        setSelectedDocId(newDoc.id);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const runDocumentAction = async (
    action: 'summarize' | 'keypoints' | 'notes' | 'dates' | 'qa' | 'compare',
    label: string
  ) => {
    if (!selectedDoc) return;
    if (action === 'qa' && !questionInput.trim()) return;

    const secondDoc = documents.find((d) => d.id === compareDocId);
    if (action === 'compare' && !secondDoc) {
      setUploadError('Please select a second document from the dropdown to compare.');
      return;
    }

    setIsAnalyzing(true);
    setUploadError(null);
    setAnalysisLabel(label);

    try {
      const res = await fetch('/api/gemini/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          documentName: selectedDoc.name,
          textContent: selectedDoc.textContent,
          inlineData: selectedDoc.inlineData,
          secondDocument: secondDoc
            ? { name: secondDoc.name, textContent: secondDoc.textContent }
            : null,
          question: questionInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document analysis failed');
      setAnalysisResult(data.result);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error analyzing document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Document Management & Grounded Analysis
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload lecture notes, syllabi, PDFs, or images. Files stay in your browser and are sent to Gemini only when you trigger an analysis action.
          </p>
        </div>

        <label className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto">
          <Upload className="w-4 h-4" />
          <span>Upload Document (PDF, TXT, CSV, Image)</span>
          <input
            type="file"
            accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.webp,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {uploadError && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Library List */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Your Study Documents ({documents.length})
            </h2>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No documents uploaded yet. Upload a file above to get started.
              </p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isRenaming = renamingId === doc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          {isRenaming ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="w-full px-2 py-0.5 text-xs rounded border border-sky-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  if (renameValue.trim()) {
                                    onRenameDocument(doc.id, renameValue.trim());
                                  }
                                  setRenamingId(null);
                                }}
                                className="p-1 text-emerald-500"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {doc.name}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                            <span>{doc.type.toUpperCase()}</span>
                            <span aria-hidden="true">·</span>
                            <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setRenamingId(doc.id);
                            setRenameValue(doc.name);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Rename Document"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Document Viewer & AI Grounded Analysis Tools */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedDoc ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
              Select or upload a document to inspect its content and run grounded AI analysis.
            </div>
          ) : (
            <>
              {/* Document Content Preview & Action Toolbar */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedDoc.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Grounded Analysis Mode — ELARA distinguishes document facts from general knowledge.
                    </p>
                  </div>
                </div>

                {/* Quick Analysis Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => runDocumentAction('summarize', 'Executive Summary')}
                    disabled={isAnalyzing}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Summarize Document</span>
                  </button>
                  <button
                    onClick={() => runDocumentAction('keypoints', 'Key Points & Definitions')}
                    disabled={isAnalyzing}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Extract Key Points</span>
                  </button>
                  <button
                    onClick={() => runDocumentAction('notes', 'Structured Study Notes')}
                    disabled={isAnalyzing}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Generate Study Notes</span>
                  </button>
                  <button
                    onClick={() => runDocumentAction('dates', 'Important Dates & Requirements')}
                    disabled={isAnalyzing}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Find Dates & Rubrics</span>
                  </button>
                </div>

                {/* Ask a Specific Question About This Document */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask a specific question about this document (e.g., What is required for Part B?)..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => runDocumentAction('qa', `Document Q&A: ${questionInput}`)}
                    disabled={isAnalyzing || !questionInput.trim()}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Ask Document</span>
                  </button>
                </div>

                {/* Multi-Document Comparison Control */}
                {documents.length > 1 && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 shrink-0">Compare with:</span>
                    <select
                      value={compareDocId}
                      onChange={(e) => setCompareDocId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select second document...</option>
                      {documents
                        .filter((d) => d.id !== selectedDoc.id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => runDocumentAction('compare', 'Multi-Document Comparison')}
                      disabled={isAnalyzing || !compareDocId}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-sky-500 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Compare Documents</span>
                    </button>
                  </div>
                )}

                {/* Collapsible Source Text Preview */}
                <details className="group pt-2">
                  <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                    Inspect Raw Document Content Preview
                  </summary>
                  <pre className="mt-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap">
                    {selectedDoc.textContent}
                  </pre>
                </details>
              </div>

              {/* Analysis Output Area */}
              {(isAnalyzing || analysisResult) && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {analysisLabel || 'Grounded Analysis Output'}
                    </span>
                  </div>
                  {isAnalyzing ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      ELARA is reading and analyzing &ldquo;{selectedDoc.name}&rdquo;...
                    </div>
                  ) : (
                    <FormattedText text={analysisResult} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
