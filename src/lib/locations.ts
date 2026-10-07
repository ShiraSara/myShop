import type { Region } from "@prisma/client";

export const REGIONS: { value: Region; label: string }[] = [
  { value: "TEL_AVIV", label: "תל אביב והסביבה" },
  { value: "CENTER", label: "מרכז" },
  { value: "SHARON", label: "השרון" },
  { value: "SHFELA", label: "שפלה" },
  { value: "JERUSALEM", label: "ירושלים והסביבה" },
  { value: "HAIFA", label: "חיפה והקריות" },
  { value: "NORTH", label: "צפון" },
  { value: "SOUTH", label: "דרום" },
];

export const REGION_LABELS = Object.fromEntries(REGIONS.map((r) => [r.value, r.label])) as Record<Region, string>;

/** Israeli cities and their region. Extend freely — the list drives validation and filters. */
export const CITIES: { name: string; region: Region }[] = [
  { name: "תל אביב-יפו", region: "TEL_AVIV" },
  { name: "רמת גן", region: "TEL_AVIV" },
  { name: "גבעתיים", region: "TEL_AVIV" },
  { name: "בני ברק", region: "TEL_AVIV" },
  { name: "חולון", region: "TEL_AVIV" },
  { name: "בת ים", region: "TEL_AVIV" },
  { name: "הרצליה", region: "SHARON" },
  { name: "רמת השרון", region: "SHARON" },
  { name: "רעננה", region: "SHARON" },
  { name: "כפר סבא", region: "SHARON" },
  { name: "הוד השרון", region: "SHARON" },
  { name: "נתניה", region: "SHARON" },
  { name: "פתח תקווה", region: "CENTER" },
  { name: "ראש העין", region: "CENTER" },
  { name: "ראשון לציון", region: "CENTER" },
  { name: "נס ציונה", region: "CENTER" },
  { name: "רחובות", region: "SHFELA" },
  { name: "מודיעין", region: "CENTER" },
  { name: "לוד", region: "CENTER" },
  { name: "רמלה", region: "CENTER" },
  { name: "יהוד-מונוסון", region: "CENTER" },
  { name: "אור יהודה", region: "CENTER" },
  { name: "שוהם", region: "CENTER" },
  { name: "אשדוד", region: "SHFELA" },
  { name: "אשקלון", region: "SOUTH" },
  { name: "גדרה", region: "SHFELA" },
  { name: "יבנה", region: "SHFELA" },
  { name: "קריית גת", region: "SHFELA" },
  { name: "בית שמש", region: "JERUSALEM" },
  { name: "ירושלים", region: "JERUSALEM" },
  { name: "מבשרת ציון", region: "JERUSALEM" },
  { name: "מעלה אדומים", region: "JERUSALEM" },
  { name: "חיפה", region: "HAIFA" },
  { name: "קריית ביאליק", region: "HAIFA" },
  { name: "קריית מוצקין", region: "HAIFA" },
  { name: "קריית אתא", region: "HAIFA" },
  { name: "נשר", region: "HAIFA" },
  { name: "טירת כרמל", region: "HAIFA" },
  { name: "חדרה", region: "HAIFA" },
  { name: "זכרון יעקב", region: "HAIFA" },
  { name: "עכו", region: "NORTH" },
  { name: "נהריה", region: "NORTH" },
  { name: "כרמיאל", region: "NORTH" },
  { name: "נצרת", region: "NORTH" },
  { name: "נוף הגליל", region: "NORTH" },
  { name: "עפולה", region: "NORTH" },
  { name: "טבריה", region: "NORTH" },
  { name: "צפת", region: "NORTH" },
  { name: "קריית שמונה", region: "NORTH" },
  { name: "יקנעם", region: "NORTH" },
  { name: "באר שבע", region: "SOUTH" },
  { name: "אילת", region: "SOUTH" },
  { name: "דימונה", region: "SOUTH" },
  { name: "נתיבות", region: "SOUTH" },
  { name: "שדרות", region: "SOUTH" },
  { name: "אופקים", region: "SOUTH" },
  { name: "ערד", region: "SOUTH" },
];

export const CITY_NAMES = CITIES.map((c) => c.name);

export function regionForCity(city: string): Region | null {
  return CITIES.find((c) => c.name === city)?.region ?? null;
}

export function isRegion(value: string): value is Region {
  return REGIONS.some((r) => r.value === value);
}
