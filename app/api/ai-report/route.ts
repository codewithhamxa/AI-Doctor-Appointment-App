import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import MedicalHistory from "@/models/MedicalHistory";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;

    if (!text && !file) {
      return NextResponse.json(
        { message: "Please provide symptoms or a prescription file." },
        { status: 400 },
      );
    }

    const parts: any[] = [];

    if (text) {
      parts.push({ text });
    }

    let fileDataUrl = '';
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString("base64");
      fileDataUrl = `data:${file.type};base64,${base64Data}`;

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    const systemInstruction = `You are an expert AI Medical Assistant. Analyze the provided symptoms and/or prescription image/document.
Generate a structured medical report with the following sections EXACTLY:
- Patient Summary
- Medicines & Purpose
- Possible Diagnosis
- Usage Instructions
- Precautions
- Lifestyle Suggestions
- Follow-up Advice
- Severity Level (Low / Medium / High)
- Recommended Doctor Type (e.g., General Physician, Cardiologist)

Format the output clearly using Markdown. Be professional, empathetic, and clear. 
Always include a disclaimer that this is an AI analysis and the patient should consult a real doctor.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction,
      },
    });

    const reportText = response.text;

    // Save to Medical History
    await dbConnect();
    await MedicalHistory.create({
      patientId: session.user.id,
      reportText,
      prescriptionFile: fileDataUrl || undefined,
    });

    return NextResponse.json({ report: reportText });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate AI report" },
      { status: 500 },
    );
  }
}
