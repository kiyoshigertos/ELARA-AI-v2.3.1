import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Clock,
} from 'lucide-react';
import { StudyTask } from '../types';

interface StudyPlannerProps {
  tasks: StudyTask[];
  onSaveTask: (task: StudyTask) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  highlightedTaskId?: string;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  tasks,
  onSaveTask,
  onToggleTask,
  onDeleteTask,
  highlightedTaskId,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (highlightedTaskId) {
      setFilterStatus('all');
      const found = tasks.find((t) => t.id === highlightedTaskId);
      if (found) {
        setEditingId(found.id);
        setTitle(found.title);
        setCategory(found.category);
        setSubject(found.subject);
        setDueDate(found.dueDate);
        setDueTime(found.dueTime || '17:00');
        setPriority(found.priority);
        setNotes(found.notes || '');
      }
    }
  }, [highlightedTaskId, tasks]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StudyTask['category']>('Assignment Deadline');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<StudyTask['priority']>('Medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const existing = tasks.find((t) => t.id === editingId);
    const task: StudyTask = {
      id: existing ? existing.id : `task-${Date.now()}`,
      title: title.trim(),
      category,
      subject: subject.trim() || 'General',
      dueDate,
      dueTime,
      priority,
      completed: existing ? existing.completed : false,
      notes: notes.trim(),
    };

    onSaveTask(task);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Assignment Deadline');
    setSubject('Database Management');
    setDueDate('2026-10-12');
    setDueTime('17:00');
    setPriority('Medium');
    setNotes('');
  };

  const startEdit = (task: StudyTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setSubject(task.subject);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '17:00');
    setPriority(task.priority);
    setNotes(task.notes || '');
  };

  const filteredTasks = tasks
    .filter((t) => {
      if (filterStatus === 'pending') return !t.completed;
      if (filterStatus === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Study Planner & Academic Schedule
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Organize study sessions, exam preparation, assignment deadlines, and project milestones using your local calendar time.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
          <span>
            Completed: <strong>{completedCount}</strong> / {tasks.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add / Edit Task Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Edit Academic Task' : 'Add Study Task or Deadline'}
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Submit Lab 4 ER Diagram"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StudyTask['category'])}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Assignment Deadline">Assignment Deadline</option>
                <option value="Exam Prep">Exam Prep</option>
                <option value="Study Session">Study Session</option>
                <option value="Project Milestone">Project Milestone</option>
                <option value="Review Schedule">Review Schedule</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as StudyTask['priority'])}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject / Course
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Database Management"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Study Notes / Checklist
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific chapters, requirements, or milestones..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Changes' : 'Add to Schedule'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Right: Schedule & Tasks View */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Scheduled Tasks & Milestones
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['all', 'pending', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center">
                No tasks match the current filter. Add a study session or deadline on the left.
              </p>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    editingId === task.id
                      ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                      : task.completed
                      ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-sky-500 transition-colors shrink-0"
                      title={task.completed ? 'Mark as Pending' : 'Mark as Completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3
                        className={`text-sm font-semibold ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {task.subject}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            task.priority === 'High'
                              ? 'text-rose-600 dark:text-rose-400 font-medium'
                              : task.priority === 'Medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }
                        >
                          {task.priority} Priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate} {task.dueTime || ''}
                        </span>
                      </div>

                      {task.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Edit Task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
