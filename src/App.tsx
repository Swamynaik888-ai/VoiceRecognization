import { useState, useEffect } from "react";
import { Mic, Activity, Info, Sparkles, BookOpen, Brain, RefreshCw } from "lucide-react";
import AudioRecorder from "./components/AudioRecorder";
import EmotionDashboard from "./components/EmotionDashboard";
import HistoryList from "./components/HistoryList";
import { EmotionResult, RecordingSession } from "./types";

export default function App() {
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [isNewRecordingLoading, setIsNewRecordingLoading] = useState(false);

  // Load sessions from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("voice_emotion_sessions");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Map stored sessions (which don't have Blob references)
        const mapped: RecordingSession[] = parsed.map((s: any) => ({
          ...s,
          audioBlob: null,
          audioUrl: "" // Blob URLs do not survive storage reloading
        }));
        setSessions(mapped);
        
        // Auto-select the latest session as the default dashboard view
        if (mapped.length > 0) {
          setCurrentSession(mapped[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load historical sessions:", e);
    }
  }, []);

  // Save sessions to LocalStorage when sessions change
  const saveSessionsToStorage = (updatedSessions: RecordingSession[]) => {
    try {
      // Strip Blobs and Blob URLs before stringifying
      const sanitized = updatedSessions.map(({ audioBlob, audioUrl, ...rest }) => rest);
      localStorage.setItem("voice_emotion_sessions", JSON.stringify(sanitized));
    } catch (e) {
      console.error("Failed to save sessions:", e);
    }
  };

  const handleAnalysisStart = () => {
    setIsNewRecordingLoading(true);
    setCurrentSession(null);
  };

  const handleAnalysisSuccess = (result: EmotionResult, audioBlob: Blob, audioUrl: string) => {
    // Check approximate recording length from audioBlob or default to 10s
    const duration = audioBlob.size > 0 ? Math.round(audioBlob.size / 16000) || 5 : 10;
    
    const newSession: RecordingSession = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      duration: duration > 60 ? 60 : duration,
      audioBlob,
      audioUrl,
      result
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSession(newSession);
    setIsNewRecordingLoading(false);
    saveSessionsToStorage(updated);
  };

  const handleSelectSession = (session: RecordingSession) => {
    setCurrentSession(session);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessionsToStorage(updated);
    if (currentSession?.id === id) {
      setCurrentSession(updated[0] || null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire voice recording history?")) {
      setSessions([]);
      setCurrentSession(null);
      localStorage.removeItem("voice_emotion_sessions");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="voice-emotion-app">
      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-950/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Voice Emotion Analyzer</h1>
              <span className="text-[10px] font-mono font-medium text-slate-500">AI SPEECH ACOUSTICS v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-rose-400">
              <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" /> Gemini 3.5-Flash
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 md:py-8 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Control widget & tracking history */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Recorder Panel */}
          <AudioRecorder
            onAnalysisStart={handleAnalysisStart}
            onAnalysisSuccess={handleAnalysisSuccess}
          />

          {/* Longitudinal list */}
          <HistoryList
            sessions={sessions}
            selectedSessionId={currentSession?.id || null}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onClearHistory={handleClearHistory}
          />
        </div>

        {/* Right Columns: Active Analysis Dashboard */}
        <div className="lg:col-span-2 flex flex-col min-h-[400px]">
          {isNewRecordingLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl text-center min-h-[350px]">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-rose-500 animate-spin" />
                <Activity className="w-5 h-5 text-rose-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mt-4">Computing Emotional Metrics...</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Gathering pitch profiles, calculating speaking rate patterns, and rendering voice spectrum breakdown.
              </p>
            </div>
          ) : currentSession ? (
            <div className="flex flex-col gap-4">
              {/* If playing a restored historic session with no blob, show warning pill */}
              {!currentSession.audioUrl && (
                <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
                  <Info className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>
                    Historical Snapshot Mode: Playback audio is unavailable for reloaded logs to respect local browser cache space. Detailed text analytics and spectrum metrics are fully preserved.
                  </span>
                </div>
              )}
              
              <EmotionDashboard
                result={currentSession.result}
                audioUrl={currentSession.audioUrl}
              />
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl text-center min-h-[350px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Ready for Speech Capture</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                To evaluate your mood register, click "Start Capture" on the Voice Analyzer, speak naturally for 5-60 seconds, and hit Stop. Gemini AI will instantly map your psychological acoustics.
              </p>

              {/* Tips list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mt-6 text-left">
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-300">Read a paragraph</h4>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Read a book chapter or news article aloud to evaluate standard resting baseline vocalizations.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex gap-2">
                  <Brain className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-300">Express true emotions</h4>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Try capturing yourself when telling an exciting story, being calm, or explaining a topic.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer block */}
      <footer className="border-t border-slate-900 py-6 px-4 md:px-8 text-center text-[10px] font-mono text-slate-600 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>SPEECH PATTERN COGNITIVE CLASSIFICATION • ENGINE VER: 2.5</span>
          <span className="flex items-center gap-1">
            POWERED BY <span className="font-semibold text-rose-500">GEMINI AI</span> & WEB MEDIARECORDER API
          </span>
        </div>
      </footer>
    </div>
  );
}
