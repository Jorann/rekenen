-- Coins. She earns one for every solved sum, so earnings aren't stored separately:
--   balance = (solved sums in questions) + (coin_gifts) - (purchases.price)

-- Everything she bought in the shop (shared/catalog.ts). Garden flowers and trees can be bought more than once.
-- price is what she paid at the time, so changing a price later doesn't change her balance.
CREATE TABLE purchases (
  id            UUID PRIMARY KEY,
  player_id     INT NOT NULL REFERENCES players(id),
  item_id       TEXT NOT NULL,
  price         INT NOT NULL CHECK (price >= 0),
  purchased_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX purchases_player_idx ON purchases (player_id, purchased_at);

-- Extra coins from a parent, e.g. for helping out at home. A negative amount takes coins away.
-- There is no screen for this yet; see the README for the SQL.
CREATE TABLE coin_gifts (
  id          SERIAL PRIMARY KEY,
  player_id   INT NOT NULL REFERENCES players(id),
  amount      INT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX coin_gifts_player_idx ON coin_gifts (player_id);

-- How her character looks ('avatar'), how her garden is arranged ('home') and what she is saving for ('goal').
-- Each value is replaced as a whole; updated_at comes from the iPad, so an older change that arrives late is ignored.
CREATE TABLE player_state (
  player_id   INT NOT NULL REFERENCES players(id),
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (player_id, key)
);
