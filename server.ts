import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API client lazy/safe setup
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.warn("Could not init Gemini SDK:", e);
    }
  }

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "AarogyaDham - Rural Health Connect Maharashtra",
      version: "1.0.0",
      aiAvailable: Boolean(ai),
    });
  });

  // AI Triage API endpoint for ASHA workers and doctors
  app.post("/api/triage", async (req, res) => {
    const { patient = {}, vitals = {}, symptoms = [], language = "en" } = req.body || {};

    try {
      if (!ai) {
        const fallback = getRuleBasedTriage(vitals, symptoms);
        return res.json({
          triage: fallback,
          source: "offline_rule_engine",
          note: "Evaluated by National Health Mission Rural Maharashtra Clinical Guidelines",
        });
      }

      const prompt = `You are a clinical decision support AI for rural Maharashtra ASHA healthcare workers under the National Health Mission (NHM), Govt of Maharashtra.
Context: Tribal and rural belt of Gadchiroli (Aheri, Bhamragad, Dhanora, Kurkheda) and Nandurbar (Dhadgaon/Akrani, Akkalkuwa, Toranmal, Taloda). Endemic for Sickle Cell Disease (SCD), Vivax & Falciparum Malaria, Malnutrition (SAM/MAM), Snakebites, and High-Risk Maternal Anemia.

Patient Details:
- Name: ${patient.name || "Anonymous"}, Age: ${patient.age || "N/A"}, Gender: ${patient.gender || "N/A"}
- Village / Pada: ${patient.village || "N/A"}, Taluka: ${patient.taluka || "N/A"}, District: ${patient.district || "Gadchiroli/Nandurbar"}
- Vitals: BP: ${vitals.bpSystolic || 120}/${vitals.bpDiastolic || 80} mmHg, Pulse: ${vitals.pulse || 72} bpm, SpO2: ${vitals.spO2 || 98}%, Blood Sugar: ${vitals.bloodSugar || 100} mg/dL, Temp: ${vitals.temp || 98.6} °F, Hemoglobin: ${vitals.hemoglobin || 12} g/dL, Weight: ${vitals.weight || 50} kg, Height: ${vitals.height || 160} cm
- Symptoms: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms}
- Risk Factors: Pregnant: ${patient.isPregnant ? "Yes" : "No"}, Child under 5: ${patient.isChild ? "Yes" : "No"}, Sickle Cell Trait: ${patient.hasSickleCell ? "Yes" : "No"}

Task:
1. Classify Triage Category strictly as:
   - "RED" (Immediate Life Threat / Emergency Referral to Rural Hospital or District Hospital. e.g., SpO2 < 90, Severe Anemia Hb < 7, Hypertensive Crisis, Suspected Snakebite, Convulsions, Severe Dehydration, Acute Sickle Crisis)
   - "YELLOW" (Urgent Medical Officer Attention / Telemedicine within 24 hours. e.g., Moderate Anemia Hb 7-10, Persistent High Fever > 101°F, High Blood Sugar > 250, Pregnancy Warning signs)
   - "GREEN" (Routine / Mild. Managed at Village Sub-Centre or Home with ASHA drug kit like ORS, Paracetamol, IFA, Zinc)
2. Return strictly a JSON object with this schema:
{
  "triageLevel": "RED" | "YELLOW" | "GREEN",
  "score": number (severity index 0 to 100),
  "primaryConcern": "Short clinical summary",
  "clinicalRationale": "Detailed reasoning based on vitals and symptoms",
  "ashaAction": "Step by step instructions for ASHA worker in English",
  "referralNeeded": boolean,
  "recommendedFacility": "PHC / Sub-District Hospital / District Civil Hospital",
  "ashaKitMedicines": ["list of medicines from standard ASHA kit to give or avoid"],
  "marathiInstructions": "आशा सेविकेसाठी मराठीत अत्यंत सोप्या आणि स्पष्ट सूचना",
  "dangerSigns": ["list of red flag symptoms to observe"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.15,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        triage: parsed,
        source: "gemini_ai",
      });
    } catch (err: any) {
      console.error("AI Triage generation error:", err);
      const fallback = getRuleBasedTriage(vitals, symptoms);
      return res.json({
        triage: fallback,
        source: "fallback_rule_engine",
        error: err.message,
      });
    }
  });

  // Assistant endpoint for rural patient voice & symptom queries in Marathi/English
  app.post("/api/patient-assist", async (req, res) => {
    const { query = "", language = "mr" } = req.body || {};
    try {
      if (!ai) {
        return res.json({
          response: language === "mr" 
            ? "तुमच्या जवळील प्राथमिक आरोग्य केंद्र (PHC) शोधण्यासाठी नकाशा वापरा. आपत्कालीन मदतीसाठी त्वरित १०८ क्रमांकावर कॉल करा."
            : "Use the interactive map to locate your nearest Primary Health Centre. For medical emergency, call 108 immediately.",
        });
      }

      const prompt = `You are AarogyaDham Virtual Health Guide for rural Maharashtra (Gadchiroli & Nandurbar).
User query: "${query}"
Language requested: ${language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English"}
Guidelines:
- Keep the answer empathetic, medically accurate, brief, and very easy to understand for rural citizens.
- Recommend visiting nearest PHC (प्राथमिक आरोग्य केंद्र / प्राथमिक स्वास्थ्य केंद्र) or Sub-Centre (उपकेंद्र).
- Mention Emergency 108 if danger symptoms appear.
- Respond directly in ${language === "mr" ? "Marathi (मराठी)" : language === "hi" ? "Hindi (हिंदी)" : "English"}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      return res.json({
        response: response.text,
      });
    } catch (e: any) {
      return res.json({
        response: language === "mr" 
          ? "आपत्कालीन सेवेसाठी कृपया तात्काळ १०८ वर कॉल करा किंवा जवळच्या प्राथमिक आरोग्य केंद्राशी संपर्क साधा."
          : "For emergency, please dial 108 or visit your nearest Primary Health Centre immediately.",
      });
    }
  });

  // Vite middleware in dev, static files in prod
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
    console.log(`AarogyaDham Server running on port ${PORT}`);
  });
}

function getRuleBasedTriage(vitals: any = {}, symptoms: any[] = []) {
  const spO2 = Number(vitals.spO2) || 98;
  const hb = Number(vitals.hemoglobin) || 12;
  const sys = Number(vitals.bpSystolic) || 120;
  const dia = Number(vitals.bpDiastolic) || 80;
  const temp = Number(vitals.temp) || 98.6;
  const symptomsStr = Array.isArray(symptoms) ? symptoms.join(" ").toLowerCase() : "";

  const isCritical =
    spO2 < 90 ||
    hb < 7 ||
    sys >= 160 ||
    sys < 85 ||
    dia >= 100 ||
    symptomsStr.includes("snake") ||
    symptomsStr.includes("convulsion") ||
    symptomsStr.includes("unconscious") ||
    symptomsStr.includes("severe breathlessness") ||
    symptomsStr.includes("bleeding");

  if (isCritical) {
    return {
      triageLevel: "RED",
      score: 94,
      primaryConcern:
        spO2 < 90
          ? "Severe Hypoxia / Acute Respiratory Distress"
          : hb < 7
          ? "Severe Life-Threatening Anemia (Hb < 7)"
          : symptomsStr.includes("snake")
          ? "Suspected Envenomation / Snakebite Emergency"
          : "Severe Acute Medical Emergency",
      clinicalRationale: `Critical vital thresholds breached: SpO2=${spO2}%, Hb=${hb}g/dL, BP=${sys}/${dia} mmHg. Immediate higher-center transfer needed.`,
      ashaAction:
        "Call 108 Emergency Ambulance immediately. Keep patient warm and in lateral recovery position. Do not administer oral fluids.",
      referralNeeded: true,
      recommendedFacility: "Sub-District Hospital / District Civil Hospital",
      ashaKitMedicines: ["Ensure clear airway", "Cold compress if high fever", "Administer Oral Rehydration if conscious and vomiting absent"],
      marathiInstructions:
        "तातडीने १०८ रुग्णवाहिकेला फोन करा! रुग्णाला नजीकच्या ग्रामीण रुग्णालय किंवा उपजिल्हा रुग्णालयात पाठवा. रुग्णाला आडवे ठेवा आणि श्वासोच्छ्वास तपासा.",
      dangerSigns: ["तज्ज्ञ डॉक्टरांची तातडीने गरज", "SpO2 पातळी खालावणे", "रक्तदाब अतिशय अनियंत्रित असणे"],
    };
  }

  const isUrgent =
    spO2 < 95 ||
    hb < 10 ||
    sys >= 140 ||
    temp >= 101 ||
    symptomsStr.includes("fever") ||
    symptomsStr.includes("vomiting") ||
    symptomsStr.includes("cough");

  if (isUrgent) {
    return {
      triageLevel: "YELLOW",
      score: 58,
      primaryConcern: "Moderate Risk / Medical Officer Evaluation Needed",
      clinicalRationale: `Vitals require medical review: Temp=${temp}°F, Hb=${hb}g/dL, BP=${sys}/${dia} mmHg. Risk of worsening if unattended.`,
      ashaAction:
        "Register for priority Telemedicine or refer to nearest PHC within 24 hours. Monitor vitals twice daily.",
      referralNeeded: true,
      recommendedFacility: "Primary Health Centre (PHC)",
      ashaKitMedicines: ["Paracetamol 500mg (for fever)", "ORS packets for hydration", "Iron Folic Acid if moderate anemia"],
      marathiInstructions:
        "२४ तासांत प्राथमिक आरोग्य केंद्रातील (PHC) वैद्यकीय अधिकाऱ्यांकडे तपासणी करा. ताप असल्यास पॅरासिटामॉल द्या आणि ओआरएसचे द्रावण द्या.",
      dangerSigns: ["ताप न उतरणे", "उलट्या थांबत नसल्यास", "अशक्तपणा वाढणे"],
    };
  }

  return {
    triageLevel: "GREEN",
    score: 18,
    primaryConcern: "Routine / Stable Vitals",
    clinicalRationale:
      "All physiological parameters are within normal safe limits. No urgent referral indicators detected.",
    ashaAction:
      "Provide ASHA drug kit basic care, encourage nutrition and safe drinking water. Re-evaluate in 3 days if symptoms persist.",
    referralNeeded: false,
    recommendedFacility: "Village Sub-Centre / Home Monitoring",
    ashaKitMedicines: ["ORS packets", "Zinc tablets", "Albendazole (if deworming due)", "Iron-Folic Acid"],
    marathiInstructions:
      "प्रकृती स्थिर आहे. विश्रांती, उकळलेले पाणी आणि संतुलित आहार घेण्याचा सल्ला द्या. ३ दिवसांत बरे न वाटल्यास पुन्हा भेटा.",
    dangerSigns: ["अचानक तीव्र ताप येणे", "श्वास घेण्यास त्रास होणे"],
  };
}

startServer();
