import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export default function AudioVisualizer({ stream, isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      // Clean up when recording stops
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      drawIdlePattern();
      return;
    }

    try {
      // Initialize Web Audio API components
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        if (!isRecording) return;
        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Clear canvas
        ctx.fillStyle = "rgba(15, 23, 42, 0.2)"; // Semi-transparent to create motion blur / trails
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set line styles for waveform/bars
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];

          // Dynamic styling based on amplitude
          const red = Math.floor(200 + (barHeight / 255) * 55);
          const green = Math.floor(100 - (barHeight / 255) * 50);
          const blue = Math.floor(100 - (barHeight / 255) * 50);

          // We draw symmetrical waves from the center of the canvas
          const height = (barHeight / 255) * (canvas.height / 1.5);
          const centerY = canvas.height / 2;

          // Gradient color
          const gradient = ctx.createLinearGradient(0, centerY - height, 0, centerY + height);
          gradient.addColorStop(0, "rgba(244, 63, 94, 0.8)"); // Rose-500
          gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.9)"); // Pink-500
          gradient.addColorStop(1, "rgba(244, 63, 94, 0.8)");

          ctx.fillStyle = gradient;
          ctx.fillRect(x, centerY - height / 2, barWidth - 2, height);

          x += barWidth;
        }

        // Overlay a fine horizontal line in the center for a technical grid look
        ctx.beginPath();
        ctx.strokeStyle = "rgba(244, 63, 94, 0.15)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    } catch (e) {
      console.error("Failed to initialize audio visualizer:", e);
      drawIdlePattern();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording]);

  // Draws a beautiful calm sine wave style pattern when idle
  const drawIdlePattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgb(15, 23, 42)"; // slate-900 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;

    // Draw a subtle, breathing center horizontal line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)"; // slate-400
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);

    // Draw a very small calm wave
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY + Math.sin(x * 0.03) * 2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  useEffect(() => {
    drawIdlePattern();
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-2 shadow-inner" id="audio-visualizer-container">
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border border-slate-800 text-slate-400">
        <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
        {isRecording ? "VOICE CAPTURE ACTIVE" : "MICROPHONE STANDBY"}
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={140}
        className="w-full h-[140px] block rounded-xl bg-slate-900"
      />
    </div>
  );
}
