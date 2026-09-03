CREATE TABLE IF NOT EXISTS accounts (
    id bigint generated always as identity PRIMARY KEY,
    address text NOT NULL UNIQUE,
    history jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
