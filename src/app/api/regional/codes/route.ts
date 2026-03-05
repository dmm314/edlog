export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Generate a cryptographically random registration code
// Format: REG-XXXXXX (6 random chars)
function generateRegCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `REG-${code}`;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN" || !user.regionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await db.registrationCode.findMany({
      where: { regionId: user.regionId },
      include: {
        usedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      codes.map((c) => ({
        id: c.id,
        code: c.code,
        usedAt: c.usedAt,
        usedBy: c.usedBy
          ? `${c.usedBy.firstName} ${c.usedBy.lastName} (${c.usedBy.email})`
          : null,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        isExpired: new Date() > c.expiresAt,
        isUsed: !!c.usedAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/regional/codes error:", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN" || !user.regionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate unique code
    let code: string;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = generateRegCode();
      const existing = await db.registrationCode.findUnique({ where: { code } });
      if (!existing) break;
      if (attempt === 9) {
        return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
      }
    }

    // Code expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const regCode = await db.registrationCode.create({
      data: {
        code: code!,
        type: "SCHOOL_REGISTRATION",
        regionId: user.regionId,
        createdById: user.id,
        expiresAt,
      },
    });

    return NextResponse.json({
      id: regCode.id,
      code: regCode.code,
      expiresAt: regCode.expiresAt,
      createdAt: regCode.createdAt,
      isExpired: false,
      isUsed: false,
      usedAt: null,
      usedBy: null,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/regional/codes error:", error);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}
