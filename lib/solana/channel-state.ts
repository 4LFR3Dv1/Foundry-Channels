import { PublicKey } from "@solana/web3.js";

export const CHANNEL_STATE_SPACE = 490;
export const CHANNEL_STATE_DISCRIMINATOR = Uint8Array.from([74, 132, 141, 196, 64, 52, 83, 136]);

const statusNames = [
  "draft",
  "funding",
  "active",
  "settling",
  "closing",
  "closed",
  "expired",
  "blocked",
  "disputed",
  "needs_recovery",
  "needs_review",
] as const;

export type ChannelStatus = (typeof statusNames)[number];

export type ChannelState = {
  accountVersion: number;
  bump: number;
  status: ChannelStatus;
  environment: "local-validator" | "solana-devnet";
  network: "solana";
  programVersion: number;
  policyFlags: number;
  epoch: bigint;
  sender: PublicKey;
  recipientClaimPubkey: PublicKey;
  recipientWallet: PublicKey | null;
  recipientBound: boolean;
  mint: PublicKey;
  vaultTokenAccount: PublicKey;
  decimals: number;
  fundedTotal: bigint;
  activatedAuthorizedTotal: bigint;
  settledTotal: bigint;
  refundedTotal: bigint;
  latestActivatedSequence: bigint;
  latestActivatedVoucherHash: string;
  closeRequested: boolean;
  claimDeadline: bigint | null;
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function readU64(view: DataView, offset: number): bigint {
  return view.getBigUint64(offset, true);
}

function readI64(view: DataView, offset: number): bigint {
  return view.getBigInt64(offset, true);
}

function readPubkey(data: Uint8Array, offset: number): PublicKey {
  return new PublicKey(data.slice(offset, offset + 32));
}

export function decodeChannelState(data: Uint8Array): ChannelState {
  if (data.byteLength !== CHANNEL_STATE_SPACE) {
    throw new Error(`invalid ChannelState length: ${data.byteLength}`);
  }
  if (!bytesEqual(data.slice(0, 8), CHANNEL_STATE_DISCRIMINATOR)) {
    throw new Error("invalid ChannelState discriminator");
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const accountVersion = view.getUint16(8, true);
  if (accountVersion !== 1) throw new Error(`unsupported ChannelState version: ${accountVersion}`);

  const statusCode = view.getUint8(11);
  const status = statusNames[statusCode];
  if (!status) throw new Error(`unknown ChannelState status: ${statusCode}`);

  const environmentCode = view.getUint8(12);
  const environment = environmentCode === 0 ? "local-validator" : environmentCode === 1 ? "solana-devnet" : null;
  if (!environment) throw new Error(`unknown ChannelState environment: ${environmentCode}`);

  if (view.getUint8(13) !== 1) throw new Error("unsupported ChannelState network");
  const policyFlags = view.getUint32(16, true);
  if ((policyFlags & ~0b11) !== 0) throw new Error("unknown ChannelState policy flags");

  const recipientBoundRaw = view.getUint8(220);
  if (recipientBoundRaw > 1) throw new Error("invalid recipient_bound flag");
  const recipientWalletRaw = readPubkey(data, 188);
  const recipientWallet = recipientBoundRaw === 1 ? recipientWalletRaw : null;
  if (recipientBoundRaw === 0 && !recipientWalletRaw.equals(PublicKey.default)) {
    throw new Error("recipient binding mismatch");
  }

  const reserved = data.slice(426, 490);
  if (reserved.some((byte) => byte !== 0)) throw new Error("non-zero reserved ChannelState bytes");

  const claimDeadlineSet = view.getUint8(417);
  if (claimDeadlineSet > 1) throw new Error("invalid claim_deadline_set flag");

  return {
    accountVersion,
    bump: view.getUint8(10),
    status,
    environment,
    network: "solana",
    programVersion: view.getUint16(14, true),
    policyFlags,
    epoch: readU64(view, 116),
    sender: readPubkey(data, 124),
    recipientClaimPubkey: readPubkey(data, 156),
    recipientWallet,
    recipientBound: recipientBoundRaw === 1,
    mint: readPubkey(data, 253),
    vaultTokenAccount: readPubkey(data, 285),
    decimals: view.getUint8(317),
    fundedTotal: readU64(view, 318),
    activatedAuthorizedTotal: readU64(view, 326),
    settledTotal: readU64(view, 334),
    refundedTotal: readU64(view, 342),
    latestActivatedSequence: readU64(view, 350),
    latestActivatedVoucherHash: hex(data.slice(358, 390)),
    closeRequested: view.getUint8(408) === 1,
    claimDeadline: claimDeadlineSet === 1 ? readI64(view, 418) : null,
  };
}

export function channelEconomics(state: ChannelState) {
  const readyToReceive = state.activatedAuthorizedTotal - state.settledTotal;
  const available = state.fundedTotal - state.refundedTotal - state.activatedAuthorizedTotal;
  const vaultBalance = state.fundedTotal - state.settledTotal - state.refundedTotal;

  if (readyToReceive < 0n || available < 0n || vaultBalance < 0n) {
    throw new Error("ChannelState violates economic conservation");
  }

  return { readyToReceive, available, vaultBalance };
}
