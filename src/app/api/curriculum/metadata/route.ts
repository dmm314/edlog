import { NextRequest, NextResponse } from "next/server";
import {
  getModuleMetadata,
  getModuleMetadataByName,
  getFamiliesForLevel,
  getAllFamilies,
} from "@/../prisma/seed/curriculum-metadata";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subjectCode = searchParams.get("subjectCode");
  const classLevel = searchParams.get("classLevel");
  const moduleName = searchParams.get("moduleName");
  const moduleNumStr = searchParams.get("moduleNum");

  if (!subjectCode || !classLevel) {
    return NextResponse.json({
      familyOfSituation: null,
      objectives: [],
      availableFamilies: getAllFamilies(),
    });
  }

  // Try to find specific module metadata
  let metadata = null;

  if (moduleNumStr) {
    const moduleNum = parseInt(moduleNumStr);
    if (!isNaN(moduleNum)) {
      metadata = getModuleMetadata(subjectCode, classLevel, moduleNum);
    }
  }

  if (!metadata && moduleName) {
    metadata = getModuleMetadataByName(subjectCode, classLevel, moduleName);
  }

  if (metadata) {
    return NextResponse.json({
      familyOfSituation: metadata.familyOfSituation,
      objectives: metadata.objectives,
      moduleName: metadata.moduleName,
      availableFamilies: getFamiliesForLevel(subjectCode, classLevel),
    });
  }

  // No specific module match — return available families for this level
  const levelFamilies = getFamiliesForLevel(subjectCode, classLevel);
  return NextResponse.json({
    familyOfSituation: null,
    objectives: [],
    availableFamilies: levelFamilies.length > 0 ? levelFamilies : getAllFamilies(),
  });
}
