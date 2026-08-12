import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Directly analyzes audio file using Google's multimodal Gemini models.
 * @param {string} filePath - Absolute path to the saved audio file
 * @param {string} mimeType - The mimetype of the uploaded audio
 * @param {string} modelName - The Gemini model to call
 */
export async function analyzeAudioWithGemini(filePath, mimeType, modelName = 'gemini-3.5-flash') {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').replace(/['"]/g, '').trim();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Convert raw audio to Base64 stream
  const audioData = fs.readFileSync(filePath).toString('base64');
  
  // Safe fallback for standard audio containers (Gemini accepts audio/aac, audio/wav, audio/mp3, audio/flac, audio/ogg, audio/aiff)
  let activeMime = mimeType || 'audio/aac';
  if (activeMime === 'audio/m4a' || activeMime.includes('m4a')) {
    activeMime = 'audio/aac';
  }

  const systemInstructions = `CRITICAL FIRST STEP: Listen to the audio and determine if it is a valid respiratory screening recording. A valid recording MUST contain actual respiratory sounds such as breathing, coughing, gasping, sighing, or wheezing. If the audio is invalid (e.g. it contains pure conversational talking, clear spoken words with no respiratory sounds, loud music, singing, or absolute silence), you MUST return the JSON with "invalid": true, "summary": "Invalid audio recording. Please upload a clear recording containing breathing, coughing, or wheezing.", "clinicalFindings": "Invalid audio recording. Please upload a clear recording containing breathing, coughing, or wheezing.", and set all other fields to default or empty values. Otherwise, set "invalid": false. If there is any respiratory sound (breathing, sighing, coughing, or wheezing) even if accompanied by noise, set "invalid": false.

You are a professional respiratory symptom screening assistant for AsthmaSense AI.
Your absolute #1 priority is to listen to the uploaded audio and detect expiratory WHEEZING, chest tightness, whistling breathing, dry spasmodic coughs, or restricted airflow.

You must listen directly to the audio recording. The recording contains raw breathing, coughing, and wheezing sounds:
1. Scrutinize the audio carefully for high-pitched, musical whistling, whistling rattling, or prolonged/forced exhalation (expiratory wheeze).
2. Listen for dry spasmodic coughing, throat clearing, or breath cycle congestion.
3. Classify the severity of restricted breathing into Low, Moderate, or High risk level.
4. Er on the side of caution! If any expiratory wheezing, exhalation whistling, or whistling breathing is detected, you MUST immediately classify wheezingDetected as "Yes" and riskLevel as "High" to ensure patient safety!
5. If heavy respiratory cycles (such as heavy, labored, deep, loud, or rapid breathing cycles) are present in the audio, you MUST classify this as wheezing (set wheezingDetected as "Yes" and riskLevel as "High").

Rules:
- invalid: Set to true ONLY if the audio contains clear conversational talking/speech, music, singing, or absolute silence with absolutely no audible respiratory cycles. If there are breathing cycles, sighing, coughing, or wheezing (even if faint or noisy), set invalid to false.
- wheezingDetected: "Yes" if expiratory wheeze whistling, high-pitched whistling, dry rattles, OR heavy, labored, deep, or loud respiratory cycles are heard in the exhalation or cough cycles.
- riskLevel:
  - High = if expiratory wheezing is detected, OR if severe spasmodic coughing (e.g. 4 or more distinct cough events), heavily restricted or prolonged exhalation, gasping breathing, or obvious respiratory distress is identified.
  - Moderate = mild to moderate coughing (e.g. 1 to 3 occasional coughs or throat clears), mild congestion, or forced exhalation (with zero active wheeze).
  - Low = normal, clear, uninhibited respiratory breathing cycles with no wheeze or active coughing.
- pattern:
  - If coughing is detected, set this field to "Mild cough · X events" (for 1 to 3 occasional events) or "Heavy cough · X events" (for 4 or more events), substituting X with the count of cough events.
  - If no coughing is detected (even if expiratory wheezing, whistling, or asthmatic rattling is prominent), set this field to "None detected".
- regularity: Standard breath/cough cycle consistency (Low risk is usually 90%-96%, Moderate is 80%-89%, High risk is under 80%).
- recommendedExercise:
  - "box" (Box Breathing): best for elevated heart rate, respiratory control, panic, or hyperventilation.
  - "belly" (Deep Belly): best for shallow breathing, standard calming, or chest tightness.
  - "pursed" (Pursed Lip): best for shortness of breath, active asthmatic wheezing, COPD, or easing air trapping.
  - "diaphragm" (Diaphragmatic Reset): best for recovering post-flare.
  If none is suitable, set to "none".
- recommendations: Exactly 3 highly helpful, actionable respiratory health tips.
- foodsToEat: Exactly 3 highly useful dietary food recommendations that are clinically beneficial for the current asthmatic status (e.g. warm fluids, ginger, antioxidant-rich fruits/veggies).
- foodsToAvoid: Exactly 3 specific dietary foods/drinks that can trigger symptoms, provoke reflux, or cause bronchial constriction (e.g. ice-cold beverages, sulfited dried fruits, processed allergens).`;

  console.log(`Attempting audio analysis with Gemini model: ${modelName} using official @google/genai client...`);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: activeMime, data: audioData } }
        ]
      }
    ],
    config: {
      systemInstruction: systemInstructions,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          invalid: { type: Type.BOOLEAN },
          wheezingDetected: { type: Type.STRING },
          riskLevel: { type: Type.STRING },
          summary: { type: Type.STRING },
          clinicalFindings: { type: Type.STRING },
          confidence: { type: Type.STRING },
          rr: { type: Type.STRING },
          pattern: { type: Type.STRING },
          regularity: { type: Type.STRING },
          recommendedExercise: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          foodsToEat: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          foodsToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "invalid",
          "wheezingDetected",
          "riskLevel",
          "summary",
          "clinicalFindings",
          "confidence",
          "rr",
          "pattern",
          "regularity",
          "recommendedExercise",
          "recommendations",
          "foodsToEat",
          "foodsToAvoid"
        ]
      }
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini returned an empty response');
  }

  return JSON.parse(responseText.trim());
}
