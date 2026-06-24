import { Calendar, Trash2, ChevronRight, BarChart2 } from "lucide-react";
import { RecordingSession } from "../types";

interface HistoryListProps {
  sessions: RecordingSession[];
  selectedSessionId: string | null;
  onSelectSession: (session: RecordingSession) => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
}

export default function HistoryList({
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
  onClearHistory,
}: HistoryListProps) {
  
  const getEmotionColorClass = (emotion: string) => {
    const norm = emotion.toLowerCase();
    if (norm.includes("calm")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (norm.includes("happy")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (norm.includes("sad")) return "text-sky-400 bg-sky-500/10 border-sky-500/20";
    if (norm.includes("anxious")) return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    if (norm.includes("angry")) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (norm.includes("excited")) return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center py-10" id="history-empty-state">
        <BarChart2 className="w-8 h-8 text-slate-600 mb-2.5" />
        <h3 className="text-sm font-semibold text-slate-300">No session history yet</h3>
        <p className="text-xs text-slate-500 max-w-[240px] mt-1">
          Your analyzed speech snapshots will appear here for longitudinal mood tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4" id="history-panel">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" /> Longitudinal Tracker
        </h3>
        <button
          onClick={onClearHistory}
          className="text-[10px] font-semibold text-slate-500 hover:text-rose-400 hover:underline transition-colors uppercase tracking-wider cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 select-none scrollbar-thin">
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          const colorClass = getEmotionColorClass(session.result.primaryEmotion);

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                isSelected
                  ? "bg-slate-800/60 border-rose-500/30 shadow-md shadow-rose-950/5"
                  : "bg-slate-950/30 border-slate-800/60 hover:bg-slate-850 hover:border-slate-800"
              }`}
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatDate(session.timestamp)} • {session.duration}s
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                    {session.result.primaryEmotion}
                  </span>
                  <p className="text-xs text-slate-400 truncate pr-4 italic font-medium">
                    "{session.result.transcript}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className={`w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors ${isSelected ? "text-rose-400" : ""}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
