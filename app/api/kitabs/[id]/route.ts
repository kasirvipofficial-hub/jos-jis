import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID Kitab is required" }, { status: 400 });
    }

    const kitab = await prisma.kitab.findUnique({
      where: { id },
      include: {
        jilids: {
          include: {
            babs: {
              include: {
                subBabs: true
              }
            }
          },
          orderBy: { number: "asc" }
        },
        paragraphs: {
          orderBy: { sequence: "asc" }
        }
      }
    });

    if (!kitab) {
      return NextResponse.json({ error: "Kitab tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(kitab);
  } catch (error: any) {
    console.error("GET Kitab detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID Kitab is required" }, { status: 400 });
    }

    await prisma.kitab.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Kitab berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Kitab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
