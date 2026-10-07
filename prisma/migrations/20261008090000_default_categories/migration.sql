-- Default product categories (reference data required to publish products).
-- Data-only migration: no schema changes. Idempotent — existing slugs are left untouched,
-- so categories edited or added by an admin are never overwritten.
INSERT INTO "Category" ("id", "slug", "name", "description", "icon", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('cat_electronics', 'electronics', 'אלקטרוניקה', 'טלפונים, טאבלטים, אוזניות וגאדג׳טים', 'smartphone', 0, true, NOW(), NOW()),
  ('cat_computers', 'computers', 'מחשבים', 'מחשבים ניידים, נייחים, מסכים וציוד היקפי', 'laptop', 1, true, NOW(), NOW()),
  ('cat_furniture', 'furniture', 'ריהוט', 'ספות, שולחנות, כיסאות וארונות', 'sofa', 2, true, NOW(), NOW()),
  ('cat_bikes', 'bikes', 'אופניים וקורקינטים', 'אופני עיר, הרים, ילדים וקורקינטים חשמליים', 'bike', 3, true, NOW(), NOW()),
  ('cat_fashion', 'fashion', 'אופנה', 'בגדים, נעליים ואקססוריז', 'shirt', 4, true, NOW(), NOW()),
  ('cat_kids', 'kids', 'תינוקות וילדים', 'עגלות, צעצועים, ריהוט וביגוד לילדים', 'baby', 5, true, NOW(), NOW()),
  ('cat_home_appliances', 'home-appliances', 'מוצרי חשמל לבית', 'מקררים, מכונות כביסה, מיקרוגל ועוד', 'fridge', 6, true, NOW(), NOW()),
  ('cat_gaming', 'gaming', 'גיימינג', 'קונסולות, משחקים ואביזרים', 'gamepad', 7, true, NOW(), NOW()),
  ('cat_sports', 'sports', 'ספורט ופנאי', 'ציוד כושר, קמפינג ומשחקי חוץ', 'dumbbell', 8, true, NOW(), NOW()),
  ('cat_home_decor', 'home-decor', 'עיצוב הבית', 'תאורה, שטיחים, עציצים ואקססוריז לבית', 'lamp', 9, true, NOW(), NOW()),
  ('cat_books', 'books', 'ספרים', 'ספרי קריאה, לימוד וילדים', 'book', 10, true, NOW(), NOW()),
  ('cat_music', 'music', 'כלי נגינה', 'גיטרות, קלידים, מגברים וציוד אולפן', 'guitar', 11, true, NOW(), NOW()),
  ('cat_cameras', 'cameras', 'צילום', 'מצלמות, עדשות ורחפנים', 'camera', 12, true, NOW(), NOW()),
  ('cat_tools', 'tools', 'כלי עבודה', 'כלי עבודה, גינון ושיפוצים', 'wrench', 13, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;
