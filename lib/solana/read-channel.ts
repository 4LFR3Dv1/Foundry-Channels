import { Connection, PublicKey } from "@solana/web3.js";
import { getRuntimeConfig } from "@/lib/config";
import { decodeChannelState, type ChannelState } from "@/lib/solana/channel-state";

export type ObservedChannel = {
  pda: PublicKey;
  state: ChannelState;
  slot: number;
};

export function getConnection(): Connection {
  return new Connection(getRuntimeConfig().SOLANA_RPC_URL, "confirmed");
}

export async function readChannel(pda: PublicKey): Promise<ObservedChannel> {
  const config = getRuntimeConfig();
  const connection = getConnection();
  const response = await connection.getAccountInfoAndContext(pda, "confirmed");
  if (!response.value) throw new Error("Channel account not found");
  if (!response.value.owner.equals(config.programId)) {
    throw new Error("Channel account is not owned by the authorized ChannelVault program");
  }

  return {
    pda,
    state: decodeChannelState(response.value.data),
    slot: response.context.slot,
  };
}

export async function channelVaultProgramReady(): Promise<boolean> {
  try {
    const config = getRuntimeConfig();
    const account = await getConnection().getAccountInfo(config.programId, "confirmed");
    return Boolean(account?.executable);
  } catch {
    return false;
  }
}
