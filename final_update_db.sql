-- 1. إضافة أعمدة الصورة والوصف للأصناف
ALTER TABLE items ADD COLUMN description TEXT;
ALTER TABLE items ADD COLUMN image_url TEXT;

-- 2. إنشاء جدول مناطق التوصيل
CREATE TABLE IF NOT EXISTS delivery_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fee REAL NOT NULL DEFAULT 0
);

-- 3. إضافة حقل معلومات الدفع المسبق
INSERT OR IGNORE INTO settings (key, value) VALUES ('prepayment_info', 'يرجى تحويل المبلغ إلى حساب المطعم: سداد 091XXXXXXX');
