import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limit to accommodate audio uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Helper function to initialize Gemini API client securely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Route for Voice Emotion Analysis
  app.post("/api/analyze-emotion", async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;
      if (!audioData || !mimeType) {
        return res.status(400).json({ error: "Missing audioData or mimeType" });
      }

      // Strip codecs parameter from MIME type to ensure compatibility with Gemini API
      // e.g. "audio/webm;codecs=opus" -> "audio/webm"
      const cleanMime = mimeType.split(';')[0];

      let ai;
      try {
        ai = getAiClient();
      } catch (err: any) {
        if (err.message === "GEMINI_API_KEY_MISSING") {
          return res.status(401).json({
            error: "API Key Not Found",
            code: "GEMINI_API_KEY_MISSING",
            message: "The GEMINI_API_KEY environment variable is not configured. Please add it to your secrets in the Settings menu (Secrets panel) of Google AI Studio."
          });
        }
        throw err;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioData
            }
          },
          {
            text: "Analyze this spoken audio. Transcribe the spoken text word for word. Perform an acoustic voice analysis to identify tempo, pitch, volume, and emotional features. Calculate the breakdown of primary emotions. Provide warm, empathetic advice and reflections. Respond strictly following the required schema in JSON format."
          }
        ],
        config: {
          systemInstruction: "You are an expert Speech Acoustics scientist and Empathic Therapist. You analyze spoken voice audio to extract the verbatim transcript, acoustic qualities, and emotional breakdown. Your tone is professional, scientific yet warm and supportive.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING, description: "Full transcript of the spoken words in the audio." },
              primaryEmotion: { type: Type.STRING, description: "One of: Calm, Happy, Sad, Anxious, Angry, Excited, Neutral." },
              confidence: { type: Type.INTEGER, description: "A confidence percentage between 0 and 100." },
              emotionsBreakdown: {
                type: Type.OBJECT,
                properties: {
                  Calm: { type: Type.INTEGER },
                  Happy: { type: Type.INTEGER },
                  Sad: { type: Type.INTEGER },
                  Anxious: { type: Type.INTEGER },
                  Angry: { type: Type.INTEGER },
                  Excited: { type: Type.INTEGER },
                  Neutral: { type: Type.INTEGER }
                },
                required: ["Calm", "Happy", "Sad", "Anxious", "Angry", "Excited", "Neutral"]
              },
              vocals: {
                type: Type.OBJECT,
                properties: {
                  tempo: { type: Type.STRING, description: "Normal, Fast, or Slow." },
                  tempoExplanation: { type: Type.STRING, description: "Brief description of the speech rate." },
                  pitch: { type: Type.STRING, description: "High, Medium, or Low." },
                  pitchExplanation: { type: Type.STRING, description: "Brief description of pitch variations and tones." },
                  volume: { type: Type.STRING, description: "Quiet, Moderate, or Loud." },
                  volumeExplanation: { type: Type.STRING, description: "Brief description of speech volume, intensity, and amplitude." }
                },
                required: ["tempo", "tempoExplanation", "pitch", "pitchExplanation", "volume", "volumeExplanation"]
              },
              detailedAnalysis: { type: Type.STRING, description: "Detailed psychological and acoustic voice profile of the user." },
              supportiveAdvice: { type: Type.STRING, description: "Empathetic, actionable guidance and reflection for the user based on their emotion." }
            },
            required: [
              "transcript",
              "primaryEmotion",
              "confidence",
              "emotionsBreakdown",
              "vocals",
              "detailedAnalysis",
              "supportiveAdvice"
            ]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response received from the Gemini model.");
      }

      const emotionResult = JSON.parse(resultText);
      return res.json(emotionResult);
    } catch (error: any) {
      console.error("Error in analyze-emotion endpoint:", error);
      return res.status(500).json({
        error: "Voice Analysis Failed",
        message: error.message || "An unexpected error occurred during audio analysis.",
        details: error.toString()
      });
    }
  });

  // Vite integration for dev and production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server with Vite is running on http://localhost:${PORT}`);
  });
}

startServer();
