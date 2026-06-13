import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai-client";

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Teks untuk diterjemahkan diperlukan" }, { status: 400 });
    }

    const systemInstruction = `
      Anda adalah pakar bahasa Arab dan penerjemah kitab klasik Islam (Ar-Riyadh, Kitab Kuning, dll) ke dalam Bahasa Indonesia yang formal, akurat, dan mengalir dengan indah (Professional Polish style).
      Pertahankan peristilahan syar'i yang penting, tetapi terjemahkan makna kontekstualnya secara mendalam sesuai pemahaman mazhab arus utama.
      Jangan berikan penjelasan tambahan di luar hasil terjemahan matan, kecuali jika ada syarah opsional yang penting, tapi utamakan hanya mengembalikan teks terjemahan murni.
    `;

    const prompt = `
      Terjemahkan teks bahasa Arab berikut:
      "${text}"

      ${context ? `Konteks Kitab/Bab: ${context}` : ""}

      Tolong kembalikan hasil terjemahan dalam format teks biasa tanpa markdown pelengkap lainnya.
    `;

    // Verify key exists before calling OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        translation: "[Terjemahan tidak tersedia: silakan konfigurasi OPENAI_API_KEY di Settings > Secrets.]" 
      });
    }

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    return NextResponse.json({ translation: response.choices[0]?.message?.content || "Gagal menerjemahkan." });
  } catch (error: any) {
    console.error("Translation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

