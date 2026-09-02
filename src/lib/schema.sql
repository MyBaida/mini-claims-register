CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_number TEXT NOT NULL,
  insured_name TEXT NOT NULL,
  loss_date TEXT NOT NULL,
  notified_date TEXT NOT NULL,
  loss_nature TEXT NOT NULL,
  currency TEXT NOT NULL,
  estimated_loss_minor INTEGER NOT NULL,
  approved_amount_minor INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  fx_rate REAL NOT NULL DEFAULT 1,
  converted_amount_minor INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);