export type AIProvider = "none" | "ollama" | "openai" | "gemini";

const STORAGE_KEYS = {
  provider: "fareflow-ai-provider",
  ollamaEndpoint: "fareflow-ollama-endpoint",
  ollamaModel: "fareflow-ollama-model",
  openaiKey: "fareflow-openai-key",
  geminiKey: "fareflow-gemini-key",
} as const;

export interface AISettings {
  provider: AIProvider;
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiKey: string;
  geminiKey: string;
}

export function loadAISettings(): AISettings {
  return {
    provider: (localStorage.getItem(STORAGE_KEYS.provider) as AIProvider) ?? "none",
    ollamaEndpoint: localStorage.getItem(STORAGE_KEYS.ollamaEndpoint) ?? "http://localhost:11434",
    ollamaModel: localStorage.getItem(STORAGE_KEYS.ollamaModel) ?? "llama3",
    openaiKey: localStorage.getItem(STORAGE_KEYS.openaiKey) ?? "",
    geminiKey: localStorage.getItem(STORAGE_KEYS.geminiKey) ?? "",
  };
}

export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(STORAGE_KEYS.provider, settings.provider);
  localStorage.setItem(STORAGE_KEYS.ollamaEndpoint, settings.ollamaEndpoint);
  localStorage.setItem(STORAGE_KEYS.ollamaModel, settings.ollamaModel);
  localStorage.setItem(STORAGE_KEYS.openaiKey, settings.openaiKey);
  localStorage.setItem(STORAGE_KEYS.geminiKey, settings.geminiKey);
}

async function extractErrorMessage(res: Response, prefix: string): Promise<never> {
  let detail = `${res.status} ${res.statusText}`.trim();
  try {
    const body = await res.json();
    const msg =
      body?.error?.message ??
      body?.message ??
      body?.error ??
      null;
    if (typeof msg === "string" && msg) detail = msg;
  } catch {
    // body was not JSON — keep status text
  }
  throw new Error(`${prefix}: ${detail}`);
}

async function callOllama(endpoint: string, model: string, prompt: string): Promise<string> {
  const url = endpoint.replace(/\/$/, "") + "/api/chat";
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach Ollama at ${endpoint}. Make sure it is running and OLLAMA_ORIGINS=* is set.`
    );
  }
  if (!res.ok) await extractErrorMessage(res, "Ollama");
  const data = await res.json();
  return data.message?.content ?? data.response ?? "";
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });
  } catch (err) {
    throw new Error("Network error reaching OpenAI. Check your internet connection.");
  }
  if (!res.ok) await extractErrorMessage(res, "OpenAI");
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function askGemini(prompt: string): Promise<string> {
  const settings = loadAISettings();
  if (!settings.geminiKey) throw new Error("Gemini API key missing.");
  return callGemini(settings.geminiKey, prompt);
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  } catch (err) {
    throw new Error("Network error reaching Gemini. Check your internet connection.");
  }
  if (!res.ok) await extractErrorMessage(res, "Gemini");
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function askAI(question: string, context: string): Promise<string> {
  const settings = loadAISettings();
  const prompt = `You are a helpful ride-hailing assistant for FareFlow. Answer concisely in 2-4 sentences.

Current fare data:
${context}

User question: ${question}`;

  switch (settings.provider) {
    case "ollama":
      return callOllama(settings.ollamaEndpoint, settings.ollamaModel, prompt);
    case "openai":
      if (!settings.openaiKey) throw new Error("OpenAI API key not configured.");
      return callOpenAI(settings.openaiKey, prompt);
    case "gemini":
      if (!settings.geminiKey) throw new Error("Gemini API key not configured.");
      return callGemini(settings.geminiKey, prompt);
    default:
      throw new Error("NO_PROVIDER");
  }
}

export function buildFareContext(data: {
  distance: number;
  providers: Array<{ name: string; fare: number; eta: number }>;
  cheapestProvider: string;
  cheapestFare: number;
  highestFare: number;
  savings: number;
  surgeLevel: string;
  surgeMultiplier: number;
  weather: string;
  traffic: string;
  futureTrend: string;
  futureConfidence: number;
  recommendation: string;
  expectedSavings?: number;
}): string {
  const providerLines = data.providers
    .map((p) => `  - ${p.name}: ₹${p.fare} (ETA ${p.eta} min)`)
    .join("\n");

  return `Trip distance: ${data.distance.toFixed(1)} km
Providers:
${providerLines}
Cheapest: ${data.cheapestProvider} at ₹${data.cheapestFare}
Potential savings vs. most expensive: ₹${data.savings}
Current surge: ${data.surgeLevel} (${data.surgeMultiplier.toFixed(2)}x)
Weather: ${data.weather}, Traffic: ${data.traffic}
Predicted trend (next 15 min): ${data.futureTrend} (${data.futureConfidence}% confidence)
Recommendation: ${data.recommendation}${data.expectedSavings ? ` — expected savings ₹${data.expectedSavings}` : ""}`;
}
