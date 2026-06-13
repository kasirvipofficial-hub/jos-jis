import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const kitabs = await prisma.kitab.findMany({
      include: {
        _count: {
          select: { paragraphs: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(kitabs);
  } catch (error: any) {
    console.error("GET Kitabs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, author, genre, era, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul Kitab wajib diisi" }, { status: 400 });
    }

    const newKitab = await prisma.kitab.create({
      data: {
        title,
        author: author || "Anonim",
        genre: genre || "Kajian",
        era: era || "Klasik",
        description: description || ""
      }
    });

    return NextResponse.json(newKitab);
  } catch (error: any) {
    console.error("POST Kitab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
