import { Play, Pause, Heart, Volume2, Activity, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { EmotionResult } from "../types";

interface EmotionDashboardProps {
  result: EmotionResult;
  audioUrl: string;
}

export default function EmotionDashboard({ result, audioUrl }: EmotionDashboardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset play state if audioUrl changes
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Helper to get emotion-specific style classes
  const getEmotionTheme = (emotion: string) => {
    const norm = emotion.toLowerCase();
    if (norm.includes("calm")) {
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        accent: "bg-emerald-500",
        shadow: "shadow-emerald-950/30",
        glow: "from-emerald-500/20 to-teal-500/5"
      };
    } else if (norm.includes("happy")) {
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        accent: "bg-amber-500",
        shadow: "shadow-amber-950/30",
        glow: "from-amber-500/20 to-yellow-500/5"
      };
    } else if (norm.includes("sad")) {
      return {
        text: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        accent: "bg-sky-500",
        shadow: "shadow-sky-950/30",
        glow: "from-sky-500/20 to-indigo-500/5"
      };
    } else if (norm.includes("anxious")) {
      return {
        text: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        accent: "bg-indigo-500",
        shadow: "shadow-indigo-950/30",
        glow: "from-indigo-500/20 to-violet-500/5"
      };
    } else if (norm.includes("angry")) {
      return {
        text: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        accent: "bg-rose-500",
        shadow: "shadow-rose-950/30",
        glow: "from-rose-500/20 to-red-500/5"
      };
    } else if (norm.includes("excited")) {
      return {
        text: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10",
        border: "border-fuchsia-500/20",
        accent: "bg-fuchsia-500",
        shadow: "shadow-fuchsia-950/30",
        glow: "from-fuchsia-500/20 to-pink-500/5"
      };
    } else {
      return {
        text: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        accent: "bg-slate-500",
        shadow: "shadow-slate-950/30",
        glow: "from-slate-500/10 to-slate-500/5"
      };
    }
  };

  const theme = getEmotionTheme(result.primaryEmotion);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in" id="analysis-dashboard">
      {/* Hidden native audio element for control */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Primary Hero Section */}
      <div className={`relative overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.glow} p-6 shadow-xl ${theme.shadow}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-white/5 to-transparent rounded-full -mr-20 -mt-20 blur-xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${theme.bg} border ${theme.border} ${theme.text}`}>
              <Activity className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Primary Detected State</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h2 className={`text-3xl font-bold tracking-tight ${theme.text}`}>{result.primaryEmotion}</h2>
                <span className="text-sm text-slate-400">({result.confidence}% confidence)</span>
              </div>
            </div>
          </div>

          {/* Audio Playback button (if audio URL is available) */}
          {audioUrl && (
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border ${isPlaying ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white text-slate-950 hover:bg-slate-50 border-white'} shadow active:scale-95 cursor-pointer`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause playback
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Listen back
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Transcript & Spectrum (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Transcript Block */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Verbatim Transcription
            </h3>
            <div className="relative bg-slate-950/40 border border-slate-800 p-5 rounded-2xl min-h-[100px] flex items-center justify-center">
              <span className="absolute -top-3 left-4 text-5xl font-serif text-slate-700 pointer-events-none">“</span>
              <p className="text-sm font-medium leading-relaxed text-slate-200 text-center italic relative z-10 px-4">
                {result.transcript || "No spoken dialogue detected. Your audio may consist of silence, noise, or sighing."}
              </p>
              <span className="absolute -bottom-9 right-4 text-5xl font-serif text-slate-700 pointer-events-none">”</span>
            </div>
          </div>

          {/* Detailed Acoustic Summary */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Acoustic Profile Analysis
            </h3>
            <p className="text-sm leading-relaxed text-slate-300 bg-slate-950/20 border border-slate-800 p-4 rounded-2xl">
              {result.detailedAnalysis}
            </p>
          </div>

          {/* Supportive Guidance */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-rose-500/10 pointer-events-none">
              <Heart className="w-24 h-24 fill-current" />
            </div>
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2 relative z-10">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Professional Reflection & Advice
            </h3>
            <div className="flex gap-3 relative z-10">
              <div className="flex-shrink-0 w-1 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
              <p className="text-sm leading-relaxed text-slate-200 font-medium italic">
                {result.supportiveAdvice}
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Vocal Breakdown & Sub-emotions (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Emotion Spectrum Distribution */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" /> Emotion Spectrum Breakdown
            </h3>
            <div className="flex flex-col gap-3.5 mt-1">
              {Object.entries(result.emotionsBreakdown || {}).map(([emotionName, val]) => {
                const isPrimary = emotionName.toLowerCase() === result.primaryEmotion.toLowerCase();
                const emTheme = getEmotionTheme(emotionName);
                
                return (
                  <div key={emotionName} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline text-xs font-mono font-medium">
                      <span className={`${isPrimary ? `${emTheme.text} font-bold` : 'text-slate-400'}`}>
                        {emotionName} {isPrimary && "• Primary"}
                      </span>
                      <span className={isPrimary ? emTheme.text : 'text-slate-500'}>{val}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                      <div
                        className={`h-full rounded-full ${emTheme.accent} transition-all duration-1000`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vocal Metrics Cards */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" /> Acoustic Dimensions
            </h3>

            <div className="flex flex-col gap-4 mt-1">
              {/* Tempo Block */}
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Tempo (Rate)</span>
                  <span className="text-xs font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded-full">{result.vocals.tempo}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{result.vocals.tempoExplanation}</p>
              </div>

              {/* Pitch Block */}
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Pitch Register</span>
                  <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/10 px-2 py-0.5 rounded-full">{result.vocals.pitch}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{result.vocals.pitchExplanation}</p>
              </div>

              {/* Volume Block */}
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Volume (Intensity)</span>
                  <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">{result.vocals.volume}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{result.vocals.volumeExplanation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
