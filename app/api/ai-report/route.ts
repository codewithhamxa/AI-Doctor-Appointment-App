import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

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

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString("base64");

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

Format the output clearly using Markdown. Be professional, empathetic, and clear. 
Always include a disclaimer that this is an AI analysis and the patient should consult a real doctor.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({ report: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate AI report" },
      { status: 500 },
    );
  }
}
