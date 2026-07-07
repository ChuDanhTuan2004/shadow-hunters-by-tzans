import { BoardLocation, LocationArea } from "../types";

export const LOCATIONS: BoardLocation[] = [
  {
    id: "loc_hermit",
    name: "Hermit's Cabin (Nhà của Hermit)",
    rollValues: [2, 3],
    description: "Rút 1 Hermit Card, xem bí mật rồi đưa cho người chơi khác.",
    area: LocationArea.HERMIT_CABIN
  },
  {
    id: "loc_fountain",
    name: "Underworld Gate (Cổng Âm Phủ)",
    rollValues: [4, 5],
    description: "Chọn 1 trong 3 chồng bài (White / Black / Hermit) để rút.",
    area: LocationArea.UNDERWORLD_FOUNTAIN
  },
  {
    id: "loc_church",
    name: "Church (Nhà thờ)",
    rollValues: [6],
    description: "Rút 1 White Card và thực hiện.",
    area: LocationArea.CHURCH
  },
  {
    id: "loc_cemetery",
    name: "Cemetery (Nghĩa địa)",
    rollValues: [8],
    description: "Rút 1 Black Card và thực hiện.",
    area: LocationArea.CEMETERY
  },
  {
    id: "loc_woods",
    name: "Weird Woods (Rừng Quái Dị)",
    rollValues: [9],
    description: "Chọn 1 người: Gây 2 sát thương hoặc hồi 1 HP.",
    area: LocationArea.WEIRD_WOODS
  },
  {
    id: "loc_anvil",
    name: "Erstwhile Altar (Bàn Thờ Cổ)",
    rollValues: [10],
    description: "Cướp 1 Equipment Card từ người chơi khác.",
    area: LocationArea.BLACK_ANVIL
  }
];

/**
 * Kiểm tra xem 2 địa điểm có nằm trong cùng khu vực ghép đôi (phạm vi tấn công) hay không
 * Shadow Hunters ghép đôi theo thứ tự:
 * - Lều Ẩn Sĩ (2-3) & Suối Nguồn (4-5) => Cùng Khu vực A
 * - Nhà Thờ Cổ (6) & Nghĩa Địa (8) => Cùng Khu vực B
 * - Đe Hắc Ám (9) & Rừng Rậm (10) => Cùng Khu vực C
 */
export function areLocationsInSameArea(locId1: string | null, locId2: string | null): boolean {
  if (!locId1 || !locId2) return false;
  if (locId1 === locId2) return true;

  const areaMap: { [key: string]: string } = {
    loc_hermit: "A",
    loc_fountain: "A",
    loc_church: "B",
    loc_cemetery: "B",
    loc_anvil: "C",
    loc_woods: "C"
  };

  return areaMap[locId1] === areaMap[locId2];
}

export function getLocationByRoll(roll: number): BoardLocation | null {
  // Nếu roll ra 7, người chơi được chọn bất kỳ ô nào trừ ô hiện tại (logic được xử lý trong gameEngine)
  return LOCATIONS.find((loc) => loc.rollValues.includes(roll)) || null;
}
