import { NextRequest, NextResponse } from "next/server";
import { getModuleMetadata } from "@/../prisma/seed/curriculum-metadata";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subjectCode = searchParams.get("subjectCode");
  const classLevel = searchParams.get("classLevel");
  const moduleNumStr = searchParams.get("moduleNum");

  if (!subjectCode || !classLevel || !moduleNumStr) {
    return NextResponse.json({ familyOfSituation: null, objectives: [] });
  }

  const moduleNum = parseInt(moduleNumStr);
  if (isNaN(moduleNum)) {
    return NextResponse.json({ familyOfSituation: null, objectives: [] });
  }

  const metadata = getModuleMetadata(subjectCode, classLevel, moduleNum);

  return NextResponse.json({
    familyOfSituation: metadata?.familyOfSituation || null,
    objectives: metadata?.objectives || [],
  });
}
