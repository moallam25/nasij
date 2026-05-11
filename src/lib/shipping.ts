export type GovernorateZone = 'cairo_giza' | 'delta' | 'upper' | 'remote';

export type Governorate = {
  id: string;
  nameAr: string;
  nameEn: string;
  zone: GovernorateZone;
};

export const GOVERNORATES: Governorate[] = [
  // Cairo & Giza zone
  { id: 'cairo',         nameAr: 'القاهرة',          nameEn: 'Cairo',            zone: 'cairo_giza' },
  { id: 'giza',          nameAr: 'الجيزة',            nameEn: 'Giza',             zone: 'cairo_giza' },
  // Delta & North Coast zone
  { id: 'alexandria',    nameAr: 'الإسكندرية',        nameEn: 'Alexandria',       zone: 'delta' },
  { id: 'gharbia',       nameAr: 'الغربية',            nameEn: 'Gharbia',          zone: 'delta' },
  { id: 'dakahlia',      nameAr: 'الدقهلية',           nameEn: 'Dakahlia',         zone: 'delta' },
  { id: 'sharqia',       nameAr: 'الشرقية',            nameEn: 'Sharqia',          zone: 'delta' },
  { id: 'monufia',       nameAr: 'المنوفية',           nameEn: 'Monufia',          zone: 'delta' },
  { id: 'qalyubia',      nameAr: 'القليوبية',          nameEn: 'Qalyubia',         zone: 'delta' },
  { id: 'kafr_el_sheikh',nameAr: 'كفر الشيخ',          nameEn: 'Kafr el-Sheikh',   zone: 'delta' },
  { id: 'beheira',       nameAr: 'البحيرة',            nameEn: 'Beheira',          zone: 'delta' },
  { id: 'damietta',      nameAr: 'دمياط',              nameEn: 'Damietta',         zone: 'delta' },
  { id: 'ismailia',      nameAr: 'الإسماعيلية',        nameEn: 'Ismailia',         zone: 'delta' },
  { id: 'port_said',     nameAr: 'بورسعيد',            nameEn: 'Port Said',        zone: 'delta' },
  { id: 'suez',          nameAr: 'السويس',             nameEn: 'Suez',             zone: 'delta' },
  { id: 'north_sinai',   nameAr: 'شمال سيناء',         nameEn: 'North Sinai',      zone: 'delta' },
  // Upper Egypt zone
  { id: 'minya',         nameAr: 'المنيا',             nameEn: 'Minya',            zone: 'upper' },
  { id: 'beni_suef',     nameAr: 'بني سويف',           nameEn: 'Beni Suef',        zone: 'upper' },
  { id: 'fayoum',        nameAr: 'الفيوم',             nameEn: 'Fayoum',           zone: 'upper' },
  { id: 'asyut',         nameAr: 'أسيوط',              nameEn: 'Asyut',            zone: 'upper' },
  { id: 'sohag',         nameAr: 'سوهاج',              nameEn: 'Sohag',            zone: 'upper' },
  { id: 'qena',          nameAr: 'قنا',                nameEn: 'Qena',             zone: 'upper' },
  { id: 'luxor',         nameAr: 'الأقصر',             nameEn: 'Luxor',            zone: 'upper' },
  { id: 'aswan',         nameAr: 'أسوان',              nameEn: 'Aswan',            zone: 'upper' },
  // Remote zone
  { id: 'red_sea',       nameAr: 'البحر الأحمر',       nameEn: 'Red Sea',          zone: 'remote' },
  { id: 'south_sinai',   nameAr: 'جنوب سيناء',         nameEn: 'South Sinai',      zone: 'remote' },
  { id: 'matruh',        nameAr: 'مطروح',              nameEn: 'Matruh',           zone: 'remote' },
  { id: 'new_valley',    nameAr: 'الوادي الجديد',      nameEn: 'New Valley',       zone: 'remote' },
];

export const ZONE_FEES: Record<GovernorateZone, number> = {
  cairo_giza: 60,
  delta:      75,
  upper:      90,
  remote:     110,
};

export const LARGE_ORDER_EXTRA     = 50;
export const LARGE_ORDER_THRESHOLD = 8000;

export function calcShipping(governorateId: string, subtotal: number): number {
  const gov  = GOVERNORATES.find((g) => g.id === governorateId);
  const base = ZONE_FEES[gov?.zone ?? 'delta'];
  return base + (subtotal >= LARGE_ORDER_THRESHOLD ? LARGE_ORDER_EXTRA : 0);
}
