import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai-client";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { messages, paragraphId, selectedText, kitabId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages list is required" }, { status: 400 });
    }

    // Verify key exists before calling OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        text: "The AI Companion is currently in offline mode because the OPENAI_API_KEY is not defined. To activate, please add OPENAI_API_KEY under the Settings > Secrets section.",
      });
    }

    let contextualPrompt = "";

    // If active paragraph is selected, retrieve from SQLite to seed context
    if (paragraphId) {
      const p = await prisma.paragraph.findUnique({
        where: { id: paragraphId },
        include: { kitab: true }
      });
      if (p) {
        contextualPrompt += `CONTEXT OF SELECTED PARAGRAPH:\nBook: ${p.kitab.title} (${p.kitab.author})\nParagraph type: ${p.type}\nArabic Text:\n${p.arabicText}\nTranslated Text:\n${p.translationText || "No translation available"}\n\n`;
      }
    } else if (selectedText) {
      contextualPrompt += `CONTEXT OF SELECTED TEXT:\n"${selectedText}"\n\n`;
    }

    const systemInstruction = `You are an expert Islamic Scholarly Companion ("Syarif").
Your role is to help students, researchers, and general readers understand classical Islamic Kitabs (texts) in Arabic and Indonesian.
Help analyze grammar (nahwu/sharaf), theological implications, legal context (fiqh rules), terminology index, and historical context of active paragraphs.
Maintain educational, respectful, highly objective, and scholarly tones at all times.
Incorporate references to traditional schools of thought (madhahib) or linguistic derivations if asked.

${contextualPrompt}`;

    const formattedMessages = messages.map((m: any) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content || "",
    }));

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        ...formattedMessages
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
      text: response.choices[0]?.message?.content || "No response generated."
    });
  } catch (error: any) {
    console.error("Error in AI Chat Companion API:", error);
    return NextResponse.json({ error: "Failed to communicate with AI helper: " + error.message }, { status: 500 });
  }
}
