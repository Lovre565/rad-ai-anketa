import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
      deployedAt: process.env.VERCEL_GIT_COMMIT_SHA ? undefined : new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
