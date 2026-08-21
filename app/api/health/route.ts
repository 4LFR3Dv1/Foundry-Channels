import { NextResponse } from "next/server";
import { runtimeConfigurationState } from "@/lib/config";
import { databaseReady } from "@/lib/db";
import { channelVaultProgramReady } from "@/lib/solana/read-channel";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = runtimeConfigurationState();
  const [database, program] = config.configured
    ? await Promise.all([databaseReady(), channelVaultProgramReady()])
    : [false, false];
  const ready = config.configured && database && program;

  return NextResponse.json(
    {
      status: ready ? "ready" : "unavailable",
      environment: "solana:devnet",
      configuration: config.configured,
      database,
      channelVaultProgram: program,
      missing: config.missing,
    },
    { status: ready ? 200 : 503 },
  );
}
