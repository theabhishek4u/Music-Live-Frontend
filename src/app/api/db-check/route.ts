import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Run a basic test query
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    return NextResponse.json({ status: "success", result });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: error.message,
      code: error.code,
      meta: error.meta,
      env_db_url_exists: !!process.env.DATABASE_URL
    }, { status: 500 });
  }
}
