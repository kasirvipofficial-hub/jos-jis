import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai-client";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { 
      kitabId, 
      chunkText, 
      chunkIndex, 
      totalChunks, 
      initialBabId, 
      initialSubBabId 
    } = await req.json();

    if (!kitabId) {
      return NextResponse.json({ error: "Kitab ID is required" }, { status: 400 });
    }
    if (!chunkText || !chunkText.trim()) {
      return NextResponse.json({ error: "Chunk text is required" }, { status: 400 });
    }

    // Verify key exists before calling OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OPENAI_API_KEY is not defined. Please configure it in Settings > Secrets.",
      }, { status: 500 });
    }

    // Fetch Kitab to verify existence
    const kitab = await prisma.kitab.findUnique({
      where: { id: kitabId },
      include: { _count: { select: { paragraphs: true } } }
    });

    if (!kitab) {
      return NextResponse.json({ error: "Kitab not found" }, { status: 404 });
    }

    // Identify or create the Jilid
    let jilid = await prisma.jilid.findFirst({
      where: { kitabId }
    });
    if (!jilid) {
      jilid = await prisma.jilid.create({
        data: {
          kitabId,
          number: 1,
          title: "Jilid Al-Ula (First Volume)"
        }
      });
    }

    // Get current sequence counter
    const lastParagraph = await prisma.paragraph.findFirst({
      where: { kitabId },
      orderBy: { sequence: "desc" }
    });
    let sequenceCounter = lastParagraph ? lastParagraph.sequence + 1 : 1;

    // Define System Instructions for parsing
    const systemInstruction = `You are an expert manuscript segmentation AI.
Your task is to analyze a raw block of classical literature text (optionally containing Arabic and/or Indonesian translation mixed together) and structure it.
You MUST decompose the text chronologically into structural blocks:
1. BAB (Chapter title) - when you detect lines like "BAB I", "Bab Pertama", "Kajian Ke-x", "Fashal...", "Kitab...".
2. SUB_BAB (Section/Sub-chapter title) - when you detect sub-headings or topics under a chapter.
3. PARAGRAPH (Body contents). For paragraphs:
   - Separate Arabic text lines from Indonesian translation lines.
   - If there is ONLY Arabic in the source line, output that Arabic text AND make a translationText of that line in elegant, high-quality scholarly Indonesian.
   - If there is ONLY Indonesian explanation text, set translationText and fill arabicText with clean empty description block.
   - Choose the literature type: "MATAN" (core text), "SYARAH" (commentary/explanation by scholar), "TALIQ" (annotation/footnote), "QURAN", "HADITH" or "COMMENTARY".

Always structure your complete response into the provided JSON schema. Ensure no text is lost; capture everything in order.`;

    const userPrompt = `Parse this block of raw text (Chunk ${chunkIndex + 1}/${totalChunks} of Book: ${kitab.title}):\n\n${chunkText}

You MUST return a JSON object containing a "segments" array where each segment has:
- "type": "BAB" | "SUB_BAB" | "PARAGRAPH"
- "title": (string) - only required for type BAB or SUB_BAB.
- "arabicText": (string) - Arabic script lines found. Leave blank if none.
- "translationText": (string) - Indonesian translation line or explanation. If the line was pure Arabic without a translation in the raw file, translate it into standard Indonesian.
- "paragraphType": "MATAN" | "SYARAH" | "TALIQ" | "FOOTNOTE" | "QURAN" | "HADITH" | "COMMENTARY" - only required for PARAGRAPH type.
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemInstruction + "\nYou MUST return a valid JSON object matching the format specified by the user." },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const outputText = response.choices[0]?.message?.content;
    if (!outputText) {
      throw new Error("No parsed data returned from OpenAI");
    }

    const parsedJson = JSON.parse(outputText);
    const segments = parsedJson.segments || [];

    let currentBabId = initialBabId || null;
    let currentSubBabId = initialSubBabId || null;
    let paragraphsCreatedCount = 0;

    // Use a transaction to commit segmented elements safely
    await prisma.$transaction(async (tx) => {
      for (const segment of segments) {
        if (segment.type === "BAB") {
          // Count active chapters to resolve next index number
          const babCount = await tx.bab.count({ where: { jilidId: jilid.id } });
          const newBab = await tx.bab.create({
            data: {
              jilidId: jilid.id,
              number: babCount + 1,
              title: segment.title || "Bab Baru"
            }
          });
          currentBabId = newBab.id;
          currentSubBabId = null; // Reset subbab when entering a new BAB
        } 
        else if (segment.type === "SUB_BAB") {
          // We need a parent Bab; if none is active, we create a default one
          if (!currentBabId) {
            const babCount = await tx.bab.count({ where: { jilidId: jilid.id } });
            const defaultBab = await tx.bab.create({
              data: {
                jilidId: jilid.id,
                number: babCount + 1,
                title: "Bab Pendahuluan"
              }
            });
            currentBabId = defaultBab.id;
          }

          const subBabCount = await tx.subBab.count({ where: { babId: currentBabId } });
          const newSubBab = await tx.subBab.create({
            data: {
              babId: currentBabId,
              number: subBabCount + 1,
              title: segment.title || "Fasal Baru"
            }
          });
          currentSubBabId = newSubBab.id;
        } 
        else if (segment.type === "PARAGRAPH") {
          // If no Bab exists, create a default Bab
          if (!currentBabId) {
            const babCount = await tx.bab.count({ where: { jilidId: jilid.id } });
            const defaultBab = await tx.bab.create({
              data: {
                jilidId: jilid.id,
                number: babCount + 1,
                title: "Pendahuluan Utama"
              }
            });
            currentBabId = defaultBab.id;
          }

          // If no SubBab exists, create a default SubBab
          if (!currentSubBabId) {
            const subBabCount = await tx.subBab.count({ where: { babId: currentBabId } });
            const defaultSubBab = await tx.subBab.create({
              data: {
                babId: currentBabId,
                number: subBabCount + 1,
                title: "Fasal Pertama"
              }
            });
            currentSubBabId = defaultSubBab.id;
          }

          await tx.paragraph.create({
            data: {
              kitabId,
              jilidId: jilid.id,
              babId: currentBabId,
              subBabId: currentSubBabId,
              sequence: sequenceCounter++,
              arabicText: segment.arabicText || "[Teks Penjelas]",
              translationText: segment.translationText || "",
              type: segment.paragraphType || "MATAN",
              pageNumber: Math.floor((sequenceCounter - 1) / 3) + 1,
              lineNumber: ((sequenceCounter - 1) % 10) + 1
            }
          });
          paragraphsCreatedCount++;
        }
      }
    });

    // Lookup active titles to return updated visual tracking state to client
    let activeBabTitle = "Pendahuluan";
    let activeSubBabTitle = "Umum";

    if (currentBabId) {
      const activeBab = await prisma.bab.findUnique({ where: { id: currentBabId } });
      if (activeBab) activeBabTitle = activeBab.title;
    }
    if (currentSubBabId) {
      const activeSubBab = await prisma.subBab.findUnique({ where: { id: currentSubBabId } });
      if (activeSubBab) activeSubBabTitle = activeSubBab.title;
    }

    return NextResponse.json({
      success: true,
      activeBabId: currentBabId,
      activeSubBabId: currentSubBabId,
      activeBabTitle,
      activeSubBabTitle,
      paragraphsAdded: paragraphsCreatedCount
    });

  } catch (error: any) {
    console.error("Error progressive parser api chunk:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
