import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { openai, OPENAI_MODEL } from "@/lib/openai-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paragraph = await prisma.paragraph.findUnique({
      where: { id },
      include: { kitab: true }
    });

    if (!paragraph) {
      return NextResponse.json({ error: "Paragraph not found" }, { status: 404 });
    }

    // Check if translation is already cached, unless user wants to force re-translate
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    if (paragraph.translationText && !force) {
      return NextResponse.json({
        translationText: paragraph.translationText,
        source: "database"
      });
    }

    // Verify key exists before calling OpenAI to avoid silent crashes
    if (!process.env.OPENAI_API_KEY) {
      // Return a professional fallback mock or error message
      return NextResponse.json({
        translationText: "[Translation unavailable: OPENAI_API_KEY is not defined in Secrets settings. Please configure your key in Secrets panel.]",
        source: "mock-fallback"
      });
    }

    const bookGenre = paragraph.kitab.genre || "Classical Islamic";
    const prompt = `Translate the following Arabic islamic classical text into Indonesian. 
Ensure the translation matches the high standards of traditional islamic scholarly syntax (harfiyah yet elegant and readable).
The book genre is: ${bookGenre}.

Arabic Text:
${paragraph.arabicText}

Indonesian Translation:`;

    const systemInstruction = "You are an expert dual Arabic-Indonesian classical islamic scholar translating traditional texts with academic and high structural fidelity.";

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || "Translation failed.";

    // Save back to database
    const updatedParagraph = await prisma.paragraph.update({
      where: { id },
      data: {
        translationText: translatedText
      }
    });

    return NextResponse.json({
      translationText: updatedParagraph.translationText,
      source: "openai"
    });
  } catch (error: any) {
    console.error("Error in translation API:", error);
    return NextResponse.json({ error: "Failed to translate: " + error.message }, { status: 500 });
  }
}
