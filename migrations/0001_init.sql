create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists channels (
  id uuid primary key,
  channel_pda text not null unique,
  sender_wallet text not null,
  recipient_claim_pubkey text not null,
  recipient_wallet text,
  mint text not null,
  vault_token_account text not null,
  channel_nonce_hex text not null,
  environment text not null check (environment = 'solana:devnet'),
  status text not null,
  funded_total numeric(30,0) not null default 0,
  activated_authorized_total numeric(30,0) not null default 0,
  settled_total numeric(30,0) not null default 0,
  refunded_total numeric(30,0) not null default 0,
  latest_sequence numeric(30,0) not null default 0,
  latest_voucher_hash text,
  last_observed_slot bigint,
  last_observed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channels_sender_wallet_idx on channels(sender_wallet);
create index if not exists channels_recipient_wallet_idx on channels(recipient_wallet);

create table if not exists claim_links (
  locator text primary key,
  channel_id uuid not null references channels(id) on delete cascade,
  claim_public_key text not null,
  secret_hash text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists channel_operations (
  operation_id text primary key,
  channel_id uuid not null references channels(id) on delete cascade,
  operation_type text not null,
  commitment_hash text not null,
  transaction_signature text,
  state text not null,
  submitted_at timestamptz,
  recovered_at timestamptz,
  terminal_at timestamptz,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channel_operations_channel_idx on channel_operations(channel_id, created_at desc);
