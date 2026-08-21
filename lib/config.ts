import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SOLANA_RPC_URL: z.string().url(),
  CHANNEL_VAULT_PROGRAM_ID: z.string().min(32),
  CHANNEL_VAULT_NETWORK: z.literal("solana:devnet"),
  PUBLIC_APP_ORIGIN: z.string().url(),
});

export type RuntimeConfig = z.infer<typeof schema> & {
  programId: PublicKey;
};

export function getRuntimeConfig(): RuntimeConfig {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Foundry Channels runtime is not configured: ${fields}`);
  }

  let programId: PublicKey;
  try {
    programId = new PublicKey(parsed.data.CHANNEL_VAULT_PROGRAM_ID);
  } catch {
    throw new Error("Foundry Channels runtime is not configured: CHANNEL_VAULT_PROGRAM_ID is invalid");
  }

  return { ...parsed.data, programId };
}

export function runtimeConfigurationState(): {
  configured: boolean;
  missing: string[];
} {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) {
    try {
      new PublicKey(parsed.data.CHANNEL_VAULT_PROGRAM_ID);
      return { configured: true, missing: [] };
    } catch {
      return { configured: false, missing: ["CHANNEL_VAULT_PROGRAM_ID"] };
    }
  }
  return {
    configured: false,
    missing: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))],
  };
}
