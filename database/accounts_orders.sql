-- MARK13: invitation-only accounts and scoped order intake. Run on a NEW 904° D1 database.
-- Authentication remains Cloudflare Access; this file stores roles and business data, not passwords.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  is_prospect INTEGER NOT NULL DEFAULT 1 CHECK (is_prospect IN (0,1)),
  is_customer INTEGER NOT NULL DEFAULT 0 CHECK (is_customer IN (0,1)),
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0,1)),
  is_owner INTEGER NOT NULL DEFAULT 0 CHECK (is_owner IN (0,1)),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended')),
  invited_by TEXT REFERENCES accounts(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_one_owner ON accounts(is_owner) WHERE is_owner = 1;
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  public_ref TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  design_id TEXT,
  service TEXT NOT NULL CHECK (service IN ('new_website','redesign','content_editor','additional_work','other')),
  project_name TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  desired_timeline TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewing','needs_details','quoted','accepted','declined','cancelled')),
  admin_note TEXT NOT NULL DEFAULT '',
  last_actor_id TEXT REFERENCES accounts(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Guarantees the order update and audit record are committed atomically.
CREATE TRIGGER IF NOT EXISTS orders_update_audit AFTER UPDATE OF status,admin_note ON orders
WHEN NEW.last_actor_id IS NOT NULL
BEGIN
  INSERT INTO order_history(order_id,actor_account_id,action,old_status,new_status,note)
  VALUES(NEW.id,NEW.last_actor_id,'status_updated',OLD.status,NEW.status,NEW.admin_note);
END;
CREATE INDEX IF NOT EXISTS orders_by_customer ON orders(account_id,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_by_status ON orders(status,created_at DESC);
CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS order_history_by_order ON order_history(order_id,created_at DESC);
CREATE TABLE IF NOT EXISTS account_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
