import { Alignment, Character, Card, CardType } from "../types";

export const CHARACTERS: Character[] = [
  // PHE SHADOW (Base Game)
  {
    name: "Unknown (Bóng Ma Vô Diện)",
    alignment: Alignment.SHADOW,
    hp: 14,
    abilityName: "Nói dối",
    abilityDesc: "Khi nhận Hermit Card, có thể nói dối (không cần lật ngửa thân phận).",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },
  {
    name: "Vampire (Ma Cà Rồng)",
    alignment: Alignment.SHADOW,
    hp: 13,
    abilityName: "Hút máu",
    abilityDesc: "Khi attack gây sát thương cho người khác: Hồi 2 sát thương cho bản thân.",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },
  {
    name: "Werewolf (Người Sói)",
    alignment: Alignment.SHADOW,
    hp: 11,
    abilityName: "Phản công tức thời",
    abilityDesc: "Khi bị người khác attack: Phản công ngay lập tức với tỷ lệ thành công 100% (gây ra lượng sát thương đúng bằng lượng sát thương vừa nhận).",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },

  // PHE SHADOW (Expansion)
  {
    name: "Ultrasoul (Siêu Hồn)",
    alignment: Alignment.SHADOW,
    hp: 11,
    abilityName: "Hào quang địa ngục",
    abilityDesc: "Bất kỳ người chơi nào khác phe khi di chuyển bước vào Underworld Gate: Nhận ngay 3 sát thương.",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },
  {
    name: "Valkyrie (Nữ Chiến Binh)",
    alignment: Alignment.SHADOW,
    hp: 14,
    abilityName: "Đòn chém định mệnh",
    abilityDesc: "Attack dùng chỉ xúc xắc d4 (không thể fail, damage cố định theo d4).",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },
  {
    name: "Wight (Bóng Tối Cổ Đại)",
    alignment: Alignment.SHADOW,
    hp: 14,
    abilityName: "Lượt bổ sung",
    abilityDesc: "Một lần: Được chơi thêm số lượt bằng số người đã chết hiện tại.",
    winCondition: "Giết hết tất cả Hunter hoặc giết 3 Neutral."
  },

  // PHE HUNTER (Base Game)
  {
    name: "Emi (Nữ Thần Không Gian)",
    alignment: Alignment.HUNTER,
    hp: 14,
    abilityName: "Dịch chuyển tức thời",
    abilityDesc: "Khi di chuyển: Được tự do chọn địa điểm đến thay vì phải lăn xúc xắc (Teleport).",
    winCondition: "Giết hết tất cả Shadow."
  },
  {
    name: "Franklin (Cơ giáp Sấm Sét)",
    alignment: Alignment.HUNTER,
    hp: 13,
    abilityName: "Phóng sét định điểm",
    abilityDesc: "Một lần: Chọn bất kỳ ai và gây 4 sát thương cố định.",
    winCondition: "Giết hết tất cả Shadow."
  },
  {
    name: "George (Thợ Săn Công Lý)",
    alignment: Alignment.HUNTER,
    hp: 9,
    abilityName: "Phát bắn chính nghĩa",
    abilityDesc: "Đầu lượt (trước khi lắc xúc xắc): Chọn bất kỳ ai và gây sát thương bằng lắc 1 xúc xắc d4 (không giới hạn số lần sử dụng).",
    winCondition: "Giết hết tất cả Shadow."
  },

  // PHE HUNTER (Expansion)
  {
    name: "Ellen (Phù Thủy Phong Ấn)",
    alignment: Alignment.HUNTER,
    hp: 10,
    abilityName: "Phong ấn vĩnh cửu",
    abilityDesc: "Một lần: Chọn 1 người, vô hiệu hóa vĩnh viễn Special Ability của họ.",
    winCondition: "Giết hết tất cả Shadow."
  },
  {
    name: "Fuka (Pháp Sư Thời Gian)",
    alignment: Alignment.HUNTER,
    hp: 12,
    abilityName: "Thao túng thời gian",
    abilityDesc: "Một lần: Chọn 1 người chơi, sát thương nhận vào của họ lập tức bị đặt về 7.",
    winCondition: "Giết hết tất cả Shadow."
  },
  {
    name: "Gregor (Hiệp Sĩ Thép)",
    alignment: Alignment.HUNTER,
    hp: 16,
    abilityName: "Áo giáp thép",
    abilityDesc: "Một lần: Sau khi kết thúc lượt, không nhận sát thương đến đầu lượt sau.",
    winCondition: "Giết hết tất cả Shadow."
  },

  // PHE NEUTRAL
  {
    name: "Allie (Cô Gái Ngây Thơ)",
    alignment: Alignment.NEUTRAL,
    hp: 8,
    abilityName: "Ước nguyện an lành",
    abilityDesc: "Một lần: Hồi phục đầy máu (full heal).",
    winCondition: "Sống sót đến khi có người khác thắng."
  },
  {
    name: "Bob (Kẻ Trộm Mộ)",
    alignment: Alignment.NEUTRAL,
    hp: 10,
    abilityName: "Trộm trang bị",
    abilityDesc: "Khi gây ≥2 sát thương bằng đòn tấn công thường: Có thể cướp 1 trang bị của mục tiêu thay vì gây sát thương.",
    winCondition: "Sở hữu từ 5 trang bị trở lên."
  },
  {
    name: "Charles (Kiếm Sĩ Cuồng Nộ)",
    alignment: Alignment.NEUTRAL,
    hp: 11,
    abilityName: "Chém đôi cuồng nộ",
    abilityDesc: "Sau khi tấn công, bạn có thể tự nhận 2 sát thương để tấn công lại cùng mục tiêu đó.",
    winCondition: "Đòn tấn công của bạn tiêu diệt người chơi thứ 3 trở đi."
  },
  {
    name: "Daniel (Linh Hồn U Uất)",
    alignment: Alignment.NEUTRAL,
    hp: 13,
    abilityName: "Trăn trối oán hận",
    abilityDesc: "Khi có bất kỳ người chơi nào chết, bạn bắt buộc phải lật ngửa thân phận. Bạn không được tự lật ngửa ở các thời điểm khác.",
    winCondition: "Là người chết đầu tiên trong trận, hoặc sống sót và phe Hunter thắng."
  },
  {
    name: "Agnes (Kẻ Hai Mặt)",
    alignment: Alignment.NEUTRAL,
    hp: 8,
    abilityName: "Đảo chiều số phận",
    abilityDesc: "Một lần trong trận (khi đã tiết lộ thân phận): Đổi điều kiện thắng thành người chơi bên dưới bạn (theo thứ tự vòng chơi) thắng.",
    winCondition: "Người chơi bên trên bạn (theo thứ tự vòng chơi) giành chiến thắng."
  },
  {
    name: "Bryan (Sát Thủ Thầm Lặng)",
    alignment: Alignment.NEUTRAL,
    hp: 10,
    abilityName: "Ngụy trang bại lộ",
    abilityDesc: "Nếu đòn tấn công của bạn tiêu diệt người chơi có HP tối đa ≤ 12: Bạn bắt buộc phải lập tức lật ngửa thân phận.",
    winCondition: "Tấn công tiêu diệt người chơi có HP tối đa ≥ 13, hoặc đang đứng ở Bàn Thờ Cổ (Erstwhile Altar) khi trận đấu kết thúc."
  },
  {
    name: "Catherine (Nhà Chiêm Tinh)",
    alignment: Alignment.NEUTRAL,
    hp: 11,
    abilityName: "Thiền định chiêm tinh",
    abilityDesc: "Bắt đầu mỗi lượt của bạn: Bạn tự động hồi phục 1 HP.",
    winCondition: "Là người chết đầu tiên trong trận, hoặc là 1 trong 2 người cuối cùng còn sống sót."
  },
  {
    name: "David (Kẻ Thu Thập Thánh Vật)",
    alignment: Alignment.NEUTRAL,
    hp: 13,
    abilityName: "Đào mộ thánh tích",
    abilityDesc: "Một lần trong trận (khi đã tiết lộ thân phận): Cướp lấy 1 trang bị bất kỳ từ một người chơi đã tử vong.",
    winCondition: "Sở hữu ít nhất 3 trong số các trang bị sau: Cài Áo May Mắn, Thương Longinus, Áo Choàng Thánh, Chuỗi Hạt Bạc."
  }
];

// Định nghĩa thẻ bài game
export interface GameCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
  isEquipment: boolean;
  effectText: string;
}

export let DECK_HERMIT: GameCard[] = [
  {
    id: "h_aid",
    name: "Hermit's Aid (Ẩn Sĩ Trợ Giúp)",
    type: CardType.HERMIT,
    description: "Nếu là Hunter: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương).",
    isEquipment: false,
    effectText: "Hunter hồi 1 HP hoặc nhận 1 sát thương nếu đầy máu."
  },
  {
    id: "h_nurture",
    name: "Hermit's Nurturance (Ẩn Sĩ Chăm Sóc)",
    type: CardType.HERMIT,
    description: "Nếu là Neutral: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương).",
    isEquipment: false,
    effectText: "Neutral hồi 1 HP hoặc nhận 1 sát thương nếu đầy máu."
  },
  {
    id: "h_huddle",
    name: "Hermit's Huddle (Ẩn Sĩ Che Chở)",
    type: CardType.HERMIT,
    description: "Nếu là Shadow: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương).",
    isEquipment: false,
    effectText: "Shadow hồi 1 HP hoặc nhận 1 sát thương nếu đầy máu."
  },
  {
    id: "h_blackmail",
    name: "Hermit's Blackmail (Ẩn Sĩ Tống Tiền)",
    type: CardType.HERMIT,
    description: "Nếu là Neutral hoặc Hunter: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Neutral/Hunter phải giao 1 trang bị hoặc nhận 1 sát thương."
  },
  {
    id: "h_anger",
    name: "Hermit's Anger (Cơn Giận Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Nếu là Hunter hoặc Shadow: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Hunter/Shadow phải giao 1 trang bị hoặc nhận 1 sát thương."
  },
  {
    id: "h_greed",
    name: "Hermit's Greed (Lòng Tham Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Nếu là Neutral hoặc Shadow: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Neutral/Shadow phải giao 1 trang bị hoặc nhận 1 sát thương."
  },
  {
    id: "h_slap",
    name: "Hermit's Slap (Cái Tát Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Nếu là Hunter: Nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Hunter nhận 1 sát thương."
  },
  {
    id: "h_spell",
    name: "Hermit's Spell (Thần Chú Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Nếu là Shadow: Nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Shadow nhận 1 sát thương."
  },
  {
    id: "h_exorcism",
    name: "Hermit's Exorcism (Trục Xuất Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Nếu là Shadow: Nhận 2 sát thương.",
    isEquipment: false,
    effectText: "Shadow nhận 2 sát thương."
  },
  {
    id: "h_bully",
    name: "Hermit's Bully (Ẩn Sĩ Bắt Nạt)",
    type: CardType.HERMIT,
    description: "Nếu HP tối đa ≤ 11 (A, B, C, E, U...): Nhận 1 sát thương.",
    isEquipment: false,
    effectText: "HP tối đa từ 11 trở xuống nhận 1 sát thương."
  },
  {
    id: "h_lesson",
    name: "Hermit's Tough Lesson (Bài Học Khắc Nghiệt)",
    type: CardType.HERMIT,
    description: "Nếu HP tối đa ≥ 12 (D, F, G, V, W...): Nhận 2 sát thương.",
    isEquipment: false,
    effectText: "HP tối đa từ 12 trở lên nhận 2 sát thương."
  },
  {
    id: "h_prediction",
    name: "Hermit's Prediction (Dự Đoán Của Ẩn Sĩ)",
    type: CardType.HERMIT,
    description: "Bắt buộc cho người đưa thẻ xem thân phận của bạn.",
    isEquipment: false,
    effectText: "Xem trộm vai diễn và phe phái bí mật của đối thủ."
  }
];

export let DECK_LIGHT: GameCard[] = [
  // 1. Dùng 1 lần
  {
    id: "l_advent",
    name: "Advent (Lộ Diện Thần Thánh)",
    type: CardType.LIGHT,
    description: "Nếu là Hunter, có thể lật ngửa thân phận. Nếu lật (hoặc đã lật), hồi hết sát thương (full heal).",
    isEquipment: false,
    effectText: "Hunter lật mặt nạ hoặc đã lật được hồi đầy máu."
  },
  {
    id: "l_blessing",
    name: "Blessing (Ban Phước)",
    type: CardType.LIGHT,
    description: "Chọn 1 người khác, lắc d6, người đó hồi sát thương bằng số chấm.",
    isEquipment: false,
    effectText: "Chọn 1 người khác hồi d6 máu."
  },
  {
    id: "l_chocolate",
    name: "Chocolate (Expansion)",
    type: CardType.LIGHT,
    description: "Nếu tên nhân vật bắt đầu bằng A, E, U, có thể lật ngửa. Nếu lật, full heal.",
    isEquipment: false,
    effectText: "Nhân vật A, E, U lật mặt nạ được hồi đầy máu."
  },
  {
    id: "l_concealed",
    name: "Concealed Knowledge (Tri Thức Che Giấu)",
    type: CardType.LIGHT,
    description: "Sau khi kết thúc lượt này, bạn được chơi thêm 1 lượt nữa.",
    isEquipment: false,
    effectText: "Đi thêm 1 lượt nữa ngay sau lượt này."
  },
  {
    id: "l_disenchant",
    name: "Disenchant Mirror (Expansion) (Gương Hóa Giải)",
    type: CardType.LIGHT,
    description: "Nếu là Shadow (không phải Unknown), bắt buộc lật ngửa thân phận.",
    isEquipment: false,
    effectText: "Shadow (trừ Unknown) bắt buộc lật mặt nạ."
  },
  {
    id: "l_firstaid",
    name: "First Aid (Sơ Cứu)",
    type: CardType.LIGHT,
    description: "Đặt sát thương của 1 người (kể cả bản thân) về 7.",
    isEquipment: false,
    effectText: "Đặt sát thương của 1 người về 7 (HP = HP tối đa - 7)."
  },
  {
    id: "l_flare",
    name: "Flare of Judgement (Tia Sáng Phán Quyết)",
    type: CardType.LIGHT,
    description: "Tất cả người chơi khác (trừ bạn) nhận 2 sát thương.",
    isEquipment: false,
    effectText: "Gây 2 sát thương cho toàn bộ người chơi khác."
  },
  {
    id: "l_guardian_single",
    name: "Guardian Angel (Thiên Thần Hộ Mệnh)",
    type: CardType.LIGHT,
    description: "Không nhận sát thương từ attack của người khác cho đến lượt sau.",
    isEquipment: false,
    effectText: "Kháng hoàn toàn sát thương tấn công cho đến lượt sau."
  },
  {
    id: "l_holywater1",
    name: "Holy Water of Healing (Nước Thánh Trị Liệu - Bản 1)",
    type: CardType.LIGHT,
    description: "Hồi 2 sát thương cho bản thân.",
    isEquipment: false,
    effectText: "Hồi 2 máu cho bản thân."
  },
  {
    id: "l_holywater2",
    name: "Holy Water of Healing (Nước Thánh Trị Liệu - Bản 2)",
    type: CardType.LIGHT,
    description: "Hồi 2 sát thương cho bản thân.",
    isEquipment: false,
    effectText: "Hồi 2 máu cho bản thân."
  },

  // 2. Trang bị
  {
    id: "l_fortune",
    name: "Fortune Brooch (Cài Áo May Mắn)",
    type: CardType.LIGHT,
    description: "Không nhận sát thương từ khu vực Weird Woods.",
    isEquipment: true,
    effectText: "Kháng sát thương từ Rừng Quái Dị."
  },
  {
    id: "l_holyrobe",
    name: "Holy Robe (Thánh Bào)",
    type: CardType.LIGHT,
    description: "Attack của bạn gây -1 sát thương, và sát thương bạn nhận từ attack -1.",
    isEquipment: true,
    effectText: "Công -1 sát thương, thủ +1 (giảm 1 sát thương nhận)."
  },
  {
    id: "l_compass",
    name: "Mystic Compass (La Bàn Thần Bí)",
    type: CardType.LIGHT,
    description: "Khi di chuyển, lắc xúc xắc 2 lần và chọn kết quả mong muốn.",
    isEquipment: true,
    effectText: "Đổ xúc xắc 2 lần khi di chuyển và chọn 1."
  },
  {
    id: "l_rosary",
    name: "Silver Rosary (Chuỗi Hạt Bạc)",
    type: CardType.LIGHT,
    description: "Khi attack giết chết người khác, cướp tất cả Equipment của họ.",
    isEquipment: true,
    effectText: "Cướp tất cả trang bị của người bị bạn tiêu diệt."
  },
  {
    id: "l_spear",
    name: "Spear of Longinus (Thương Longinus)",
    type: CardType.LIGHT,
    description: "Nếu là Hunter và attack thành công gây sát thương, có thể lật ngửa. Attack gây +2 sát thương.",
    isEquipment: true,
    effectText: "Hunter có thể lật mặt nạ khi công thành công; công tăng +2 sát thương."
  },
  {
    id: "l_talisman",
    name: "Talisman (Bùa Hộ Mệnh)",
    type: CardType.LIGHT,
    description: "Không nhận sát thương từ Black Cards: Bloodthirsty Spider, Vampire Bat, Dynamite.",
    isEquipment: true,
    effectText: "Kháng sát thương từ Nhện Độc, Dơi Hút Máu, Thuốc Nổ."
  }
];

export let DECK_SHADOW: GameCard[] = [
  // 1. Dùng 1 lần
  {
    id: "s_banana",
    name: "Banana Peel (Vỏ Chuối)",
    type: CardType.SHADOW,
    description: "Đưa 1 Equipment của bạn cho người chơi khác. Nếu không có, bạn nhận 1 sát thương.",
    isEquipment: false,
    effectText: "Chuyển giao 1 trang bị cho người khác hoặc tự nhận 1 sát thương."
  },
  {
    id: "s_spider",
    name: "Bloodthirsty Spider (Nhện Độc Khát Máu)",
    type: CardType.SHADOW,
    description: "Chọn 1 người gây 2 sát thương, bạn cũng nhận 2 sát thương.",
    isEquipment: false,
    effectText: "Gây 2 sát thương cho đối thủ và nhận 2 sát thương cho bản thân."
  },
  {
    id: "s_ritual",
    name: "Diabolic Ritual (Nghi Lễ Tà Ác)",
    type: CardType.SHADOW,
    description: "Nếu là Shadow, có thể lật ngửa thân phận. Nếu lật (hoặc đã lật), full heal (hồi hết sát thương).",
    isEquipment: false,
    effectText: "Shadow lật mặt nạ hoặc đã lật được hồi đầy máu."
  },
  {
    id: "s_dynamite",
    name: "Dynamite (Thuốc Nổ)",
    type: CardType.SHADOW,
    description: "Lắc 2 xúc xắc, gây 3 sát thương cho tất cả người chơi ở khu vực tương ứng (không có gì nếu ra 7).",
    isEquipment: false,
    effectText: "Lắc xúc xắc gây 3 sát thương diện rộng khu vực tương ứng."
  },
  {
    id: "s_goblin1",
    name: "Moody Goblin (Yêu Tinh Cau Có - Bản 1)",
    type: CardType.SHADOW,
    description: "Cướp 1 Equipment từ bất kỳ người chơi nào.",
    isEquipment: false,
    effectText: "Cướp 1 trang bị từ người chơi khác."
  },
  {
    id: "s_goblin2",
    name: "Moody Goblin (Yêu Tinh Cau Có - Bản 2)",
    type: CardType.SHADOW,
    description: "Cướp 1 Equipment từ bất kỳ người chơi nào.",
    isEquipment: false,
    effectText: "Cướp 1 trang bị từ người chơi khác."
  },
  {
    id: "s_doll",
    name: "Spiritual Doll (Búp Bê Nguyền Rủa)",
    type: CardType.SHADOW,
    description: "Chọn 1 người, lắc d6: 1-4: Người đó nhận 3 sát thương; 5-6: Bạn nhận 3 sát thương.",
    isEquipment: false,
    effectText: "Chọn 1 người, cơ hội gây 3 sát thương đối thủ hoặc phản lực 3 sát thương bản thân."
  },
  {
    id: "s_bat1",
    name: "Vampire Bat (Dơi Hút Máu - Bản 1)",
    type: CardType.SHADOW,
    description: "Chọn 1 người gây 2 sát thương, bạn hồi 1 sát thương.",
    isEquipment: false,
    effectText: "Gây 2 sát thương cho đối thủ và hồi 1 máu cho bản thân."
  },
  {
    id: "s_bat2",
    name: "Vampire Bat (Dơi Hút Máu - Bản 2)",
    type: CardType.SHADOW,
    description: "Chọn 1 người gây 2 sát thương, bạn hồi 1 sát thương.",
    isEquipment: false,
    effectText: "Gây 2 sát thương cho đối thủ và hồi 1 máu cho bản thân."
  },
  {
    id: "s_bat3",
    name: "Vampire Bat (Dơi Hút Máu - Bản 3)",
    type: CardType.SHADOW,
    description: "Chọn 1 người gây 2 sát thương, bạn hồi 1 sát thương.",
    isEquipment: false,
    effectText: "Gây 2 sát thương cho đối thủ và hồi 1 máu cho bản thân."
  },

  // 2. Trang bị
  {
    id: "s_knife",
    name: "Butcher Knife (Dao Đồ Tể)",
    type: CardType.SHADOW,
    description: "Attack thành công gây +1 sát thương.",
    isEquipment: true,
    effectText: "+1 sát thương khi tấn công trúng."
  },
  {
    id: "s_chainsaw",
    name: "Chainsaw (Cưa Máy)",
    type: CardType.SHADOW,
    description: "Attack thành công gây +1 sát thương.",
    isEquipment: true,
    effectText: "+1 sát thương khi tấn công trúng."
  },
  {
    id: "s_axe",
    name: "Rusted Broad Axe (Rìu Rỉ Sét)",
    type: CardType.SHADOW,
    description: "Attack thành công gây +1 sát thương.",
    isEquipment: true,
    effectText: "+1 sát thương khi tấn công trúng."
  },
  {
    id: "s_handgun",
    name: "Handgun (Súng Ngắn)",
    type: CardType.SHADOW,
    description: "Phạm vi attack của bạn là tất cả khu vực trừ khu vực của bạn.",
    isEquipment: true,
    effectText: "Phạm vi tấn công đổi thành các khu vực khác khu vực hiện tại."
  },
  {
    id: "s_machinegun",
    name: "Machine Gun (Súng Liên Thanh)",
    type: CardType.SHADOW,
    description: "Khi attack, gây sát thương cho tất cả người chơi trong phạm vi attack (lắc 1 lần áp dụng cho tất cả).",
    isEquipment: true,
    effectText: "Tấn công sát thương toàn bộ đối thủ trong phạm vi."
  },
  {
    id: "s_masamune",
    name: "Cursed Sword Masamune (Thần Kiếm Yêu Nguyền Masamune)",
    type: CardType.SHADOW,
    description: "Bắt buộc phải attack nếu có thể. Attack dùng chỉ xúc xắc d4 (không thể fail).",
    isEquipment: true,
    effectText: "Bắt buộc phải tấn công; xúc xắc tấn công chỉ dùng D4 (luôn trúng)."
  }
];

export function getCardById(id: string): GameCard | undefined {
  return (
    DECK_HERMIT.find((c) => c.id === id) ||
    DECK_LIGHT.find((c) => c.id === id) ||
    DECK_SHADOW.find((c) => c.id === id)
  );
}

export function updateCardDecksFromFirebase(hermit: GameCard[], light: GameCard[], shadow: GameCard[]) {
  DECK_HERMIT = hermit;
  DECK_LIGHT = light;
  DECK_SHADOW = shadow;
}
