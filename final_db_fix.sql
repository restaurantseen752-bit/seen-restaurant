-- إنشاء جدول الإعدادات بشكل صحيح لضمان عمل الحفظ
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- إضافة حقل معلومات الدفع
INSERT OR IGNORE INTO settings (key, value) VALUES ('prepayment_info', 'يرجى تحويل المبلغ إلى حساب المطعم: سداد 091XXXXXXX');

-- إنشاء جدول مناطق التوصيل
CREATE TABLE IF NOT EXISTS delivery_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fee REAL NOT NULL DEFAULT 0
);

-- إضافة أعمدة الصورة والوصف (إذا لم تكن موجودة مسبقاً)
ALTER TABLE items ADD COLUMN description TEXT;
ALTER TABLE items ADD COLUMN image_url TEXT;
