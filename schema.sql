CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    prize TEXT NOT NULL,
    duration TEXT NOT NULL,
    winner TEXT,
    status TEXT DEFAULT 'active'
);

INSERT INTO settings (key, value) VALUES 
('status', 'open'), ('announcement', ''), ('offer', ''), 
('phone', '0935746965'), ('address', 'سرت . نهاية شارع العطارين'), ('whatsapp', '218935746965')
ON CONFLICT(key) DO NOTHING;
