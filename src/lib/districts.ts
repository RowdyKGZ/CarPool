export const BISHKEK_DISTRICTS = [
  "ЦУМ",
  "Арча-Бешик",
  "Джал",
  "Асанбай",
  "Орто-Сай",
  "Восток-5",
  "Аламедин-1",
  "Политех",
  "Южные ворота",
  "Бишкек Парк",
] as const;

export type BishkekDistrict = (typeof BISHKEK_DISTRICTS)[number];
