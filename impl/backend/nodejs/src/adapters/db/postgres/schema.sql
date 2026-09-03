CREATE TABLE IF NOT EXISTS accounts (
    id bigint generated always as identity PRIMARY KEY,
    address text NOT NULL UNIQUE,
    session_token text UNIQUE,
    session_expires_at timestamptz,
    history jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nonces (
    nonce text PRIMARY KEY,
    expires_at timestamptz NOT NULL
);
