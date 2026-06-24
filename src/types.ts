export interface EmotionVocals {
  tempo: string;
  tempoExplanation: string;
  pitch: string;
  pitchExplanation: string;
  volume: string;
  volumeExplanation: string;
}

export interface EmotionsBreakdown {
  Calm: number;
  Happy: number;
  Sad: number;
  Anxious: number;
  Angry: number;
  Excited: number;
  Neutral: number;
}

export interface EmotionResult {
  transcript: string;
  primaryEmotion: 'Calm' | 'Happy' | 'Sad' | 'Anxious' | 'Angry' | 'Excited' | 'Neutral' | string;
  confidence: number;
  emotionsBreakdown: EmotionsBreakdown;
  vocals: EmotionVocals;
  detailedAnalysis: string;
  supportiveAdvice: string;
}

export interface RecordingSession {
  id: string;
  timestamp: string;
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string; // Blob URL
  result: EmotionResult;
}
