CREATE TABLE IF NOT EXISTS accounts (
    id bigint generated always as identity PRIMARY KEY,
    address text NOT NULL UNIQUE,
    history jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id bigint generated always as identity PRIMARY KEY,
    account_id bigint NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_account_id_idx ON sessions (account_id);

CREATE TABLE IF NOT EXISTS nonces (
    nonce text PRIMARY KEY,
    expires_at timestamptz NOT NULL
);
