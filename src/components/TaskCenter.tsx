import React, { useState } from "react";
import { ListTodo, Plus, Trash2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { TaskItem } from "../types";

interface TaskCenterProps {
  tasks: TaskItem[];
  onAddTask: (text: string, priority: "high" | "medium" | "low") => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
}

export default function TaskCenter({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}: TaskCenterProps) {
  const [newText, setNewText] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddTask(newText.trim(), priority);
    setNewText("");
  };

  const priorityColor = (lvl: "high" | "medium" | "low") => {
    switch (lvl) {
      case "high": return "text-red-400 border-red-500/30 bg-red-950/20";
      case "medium": return "text-amber-400 border-amber-500/30 bg-amber-950/20";
      case "low": return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    }
  };

  return (
    <div
      id="hud-task-center-block"
      className="p-5 bg-slate-950/40 rounded-3xl border border-cyan-500/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col h-full font-mono"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            ENGINEERING TICKETS
          </span>
        </div>
        <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
          {tasks.filter((t) => !t.completed).length} ACTIVE
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add routine ticket description..."
            maxLength={100}
            className="flex-1 bg-slate-900/60 border border-cyan-500/20 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
          <button
            type="submit"
            className="px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex gap-3 items-center">
          <span className="text-[10px] text-slate-500">PRIORITY:</span>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPriority(lvl)}
                className={`text-[9px] uppercase px-2 py-0.5 rounded border transition-all ${
                  priority === lvl
                    ? "border-cyan-400/60 bg-cyan-950/40 text-cyan-300"
                    : "border-slate-800 bg-transparent text-slate-500 hover:text-slate-400"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Grid of Task Items */}
      <div className="flex-1 overflow-y-auto max-h-60 pr-1 space-y-2 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center text-slate-600">
            <AlertCircle className="w-6 h-6 mb-2 opacity-50 text-slate-500" />
            <span className="text-[10px] tracking-wider uppercase">NO PENDING DISRUPTIONS</span>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl border flex gap-3 items-start justify-between transition-all group ${
                task.completed
                  ? "border-slate-900 bg-slate-950/25 opacity-55"
                  : "border-slate-800 bg-slate-900/10 hover:border-cyan-500/20"
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>

              {/* Text content */}
              <div className="flex-1 flex flex-col">
                <span className={`text-[11px] leading-relaxed break-all ${
                  task.completed ? "line-through text-slate-600" : "text-slate-300"
                }`}>
                  {task.text}
                </span>
                
                {/* Meta details */}
                {!task.completed && (
                  <div className="flex gap-2 items-center mt-1">
                    <span className={`text-[8px] font-bold border rounded px-1.5 uppercase ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-[8px] text-slate-600">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Erase button */}
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 rounded transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clear tool */}
      {tasks.some((t) => t.completed) && (
        <button
          onClick={onClearCompleted}
          className="mt-3 text-[9px] text-center text-slate-500 hover:text-red-400 uppercase tracking-widest font-bold border border-dashed border-slate-800 hover:border-red-500/20 py-1 rounded-xl transition-all cursor-pointer"
        >
          FLUSH RESOLVED TICKETS
        </button>
      )}
    </div>
  );
}
