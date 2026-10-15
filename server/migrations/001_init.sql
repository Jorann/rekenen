-- A child who practises. One for now, but the schema allows siblings later.
CREATE TABLE players (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One practice session: the settings chosen on the start screen.
-- finished_at stays NULL when she stopped before the last round.
CREATE TABLE sessions (
  id                   UUID PRIMARY KEY,
  player_id            INT NOT NULL REFERENCES players(id),
  operations           TEXT[] NOT NULL,
  questions_per_round  INT NOT NULL CHECK (questions_per_round > 0),
  rounds_total         INT NOT NULL CHECK (rounds_total > 0),
  settings             JSONB NOT NULL DEFAULT '{}',
  started_at           TIMESTAMPTZ NOT NULL,
  finished_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_player_started_idx ON sessions (player_id, started_at DESC);

-- One sum, stored once it has been solved.
-- duration_ms is active time (iPad unlocked, app visible) from showing the sum until the correct answer.
CREATE TABLE questions (
  id              UUID PRIMARY KEY,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number    INT NOT NULL,
  position        INT NOT NULL,
  operation       TEXT NOT NULL CHECK (operation IN ('add', 'sub', 'mul')),
  operand_a       INT NOT NULL,
  operand_b       INT NOT NULL,
  correct_answer  INT NOT NULL,
  shown_at        TIMESTAMPTZ NOT NULL,
  solved_at       TIMESTAMPTZ NOT NULL,
  duration_ms     INT NOT NULL,
  wrong_attempts  INT NOT NULL DEFAULT 0,
  UNIQUE (session_id, round_number, position)
);
CREATE INDEX questions_operation_idx ON questions (operation, operand_a, operand_b);

-- Every answer she submitted, wrong ones included.
CREATE TABLE attempts (
  id              BIGSERIAL PRIMARY KEY,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempt_number  INT NOT NULL,
  answer          INT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  elapsed_ms      INT NOT NULL,
  attempted_at    TIMESTAMPTZ NOT NULL,
  UNIQUE (question_id, attempt_number)
);
