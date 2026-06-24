import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Sparkles, AlertCircle, Info } from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";
import { EmotionResult } from "../types";

interface AudioRecorderProps {
  onAnalysisSuccess: (result: EmotionResult, audioBlob: Blob, audioUrl: string) => void;
  onAnalysisStart: () => void;
}

export default function AudioRecorder({ onAnalysisSuccess, onAnalysisStart }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; code?: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Clean up stream and timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startTimer = () => {
    setDuration(0);
    timerRef.current = window.setInterval(() => {
      setDuration((prev) => {
        if (prev >= 60) {
          // Auto-stop at 60 seconds to manage API payloads
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    
    try {
      // Request microphone access
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(userStream);

      // Determine supported MIME types for audio recording
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
      }
      if (!MediaRecorder.isTypeSupported("audio/ogg") && !MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "" }; // default fallback
      }

      const mediaRecorder = new MediaRecorder(userStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks on the stream to release the mic light
        userStream.getTracks().forEach((track) => track.stop());
        setStream(null);

        // Proceed to analyze the recording
        await analyzeAudio(audioBlob, audioUrl, mediaRecorder.mimeType || "audio/webm");
      };

      mediaRecorder.start(250); // Collect data in small chunks
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setError({
        title: "Microphone Access Denied",
        message: "Could not access your microphone. Please check your browser permissions for this site and try again."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const analyzeAudio = async (audioBlob: Blob, audioUrl: string, mimeType: string) => {
    setIsAnalyzing(true);
    onAnalysisStart();
    setError(null);

    try {
      // Convert Blob to Base64 String
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          // Extract base64 payload by splitting past metadata header
          const base64Data = resultStr.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = (e) => reject(e);
      });

      const audioBase64 = await base64Promise;

      // Call API Endpoint
      const response = await fetch("/api/analyze-emotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType: mimeType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          title: data.error || "Analysis Failed",
          message: data.message || "An error occurred while analyzing the audio.",
          code: data.code
        };
      }

      onAnalysisSuccess(data, audioBlob, audioUrl);
    } catch (err: any) {
      console.error("Error calling voice analysis API:", err);
      setError({
        title: err.title || "Vocal Analysis Failed",
        message: err.message || "An unexpected error occurred. Please check your network and try again.",
        code: err.code
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to trigger a local simulated response when API key is missing
  // This allows full UI testing even before the user puts their actual secret
  const runSimulatedDemo = () => {
    setIsAnalyzing(true);
    onAnalysisStart();
    setError(null);

    setTimeout(() => {
      const mockResult: EmotionResult = {
        transcript: "Hello, I am testing this emotion recognition voice app. I hope you are having a wonderful day, and everything is feeling calm and peaceful.",
        primaryEmotion: "Calm",
        confidence: 94,
        emotionsBreakdown: {
          Calm: 80,
          Happy: 10,
          Sad: 2,
          Anxious: 3,
          Angry: 1,
          Excited: 2,
          Neutral: 2
        },
        vocals: {
          tempo: "Normal",
          tempoExplanation: "Your speaking rate was smooth and deliberate at around 110 words per minute, indicating a composed and relaxed baseline.",
          pitch: "Medium",
          pitchExplanation: "Pitch levels are stable with gentle inflections, pointing to a natural, resting vocal register without tension.",
          volume: "Moderate",
          volumeExplanation: "Volume is consistent and comfortable, reinforcing a sense of confidence, peace, and high emotional safety."
        },
        detailedAnalysis: "The speaker's voice displays strong cues of calm and emotional balance. There is no jitter or strain in the vocal tract. The speech is moderately paced and has rhythmic regularities associated with relaxation, deep breathing, and mindful expression. The language used contains supportive and optimistic terms, aligning perfectly with a healthy, well-regulated state.",
        supportiveAdvice: "Your voice radiates beautiful composure and serenity. Keep doing what you are doing. Take a moment to appreciate this sense of calm and carry it forward into your next activities."
      };

      // Create a dummy audio blob for visual playbacks
      const dummyBlob = new Blob([], { type: "audio/webm" });
      onAnalysisSuccess(mockResult, dummyBlob, "");
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl" id="audio-recorder-widget">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-rose-500" /> Voice Analyzer
        </h2>
        <p className="text-xs text-slate-400">
          Record a short speech snippet (5-60 seconds) to analyze vocal emotion, pitch, and acoustic metrics.
        </p>
      </div>

      {/* Visualizer Frame */}
      <AudioVisualizer stream={stream} isRecording={isRecording} />

      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-mono text-red-400 font-semibold">{formatTime(duration)}</span>
              <span className="text-xs text-slate-500">/ 01:00 max</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Speak clearly into your mic
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRecording ? (
            <button
              id="stop-recording-button"
              onClick={stopRecording}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-rose-950/20 active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" /> Stop Recording
            </button>
          ) : (
            <button
              id="start-recording-button"
              disabled={isAnalyzing}
              onClick={startRecording}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-rose-950/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Mic className="w-4 h-4" /> Start Capture
            </button>
          )}
        </div>
      </div>

      {/* Loading overlay for AI computation */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 bg-slate-900/60 border border-dashed border-rose-500/20 rounded-2xl animate-fade-in">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" /> Gemini AI Analyzing Voice Acoustics...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
              Transcribing speech, checking frequency distribution, and evaluating psychological emotional indicators. Please wait.
            </p>
          </div>
        </div>
      )}

      {/* Error / Alert Boxes */}
      {error && (
        <div className="flex flex-col gap-3 p-4 bg-red-950/20 border border-red-900/50 rounded-2xl" id="recorder-error-box">
          <div className="flex gap-2.5 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-300">{error.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{error.message}</p>
            </div>
          </div>
          
          {error.code === "GEMINI_API_KEY_MISSING" && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-red-900/30">
              <p className="text-[11px] text-slate-400 font-medium">
                Want to test out the visual analyzer and dashboard right now? You can bypass this with a high-fidelity local demo:
              </p>
              <button
                onClick={runSimulatedDemo}
                className="self-start text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-all cursor-pointer"
              >
                Run High-Fidelity Local Simulation ⚡
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
