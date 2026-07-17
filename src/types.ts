export enum Alignment {
  SHADOW = "SHADOW",
  HUNTER = "HUNTER",
  NEUTRAL = "NEUTRAL"
}

export interface Character {
  name: string;
  alignment: Alignment;
  hp: number;
  abilityName: string;
  abilityDesc: string;
  winCondition: string;
}

export enum CardType {
  HERMIT = "HERMIT", // Lá xanh lá: Dò hỏi thân phận
  LIGHT = "LIGHT",   // Lá xanh dương: Trợ giúp/Pháp bảo
  SHADOW = "SHADOW"  // Lá cam: Tấn công/Bóng tối
}

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  isEquipment: boolean;
  effect: (gameState: any, targetPlayerId: string, sourcePlayerId: string) => any;
}

export enum LocationArea {
  HERMIT_CABIN = "Hermit Cabin", // 2-3
  UNDERWORLD_FOUNTAIN = "Underworld Fountain", // 4-5
  CHURCH = "Church", // 6
  CEMETERY = "Cemetery", // 8
  BLACK_ANVIL = "Black Anvil", // 9
  WEIRD_WOODS = "Weird Woods" // 10
}

export interface BoardLocation {
  id: string;
  name: string;
  rollValues: number[];
  description: string;
  area: LocationArea;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  currentHp: number;
  locationId: string | null; // ID địa điểm hiện tại
  alignmentRevealed: boolean; // Đã tiết lộ thân phận hay chưa
  hasUsedAbility?: boolean; // Đã sử dụng kỹ năng đặc biệt chủ động hay chưa
  equipments: string[]; // Danh sách các ID thẻ trang bị đang sở hữu
  drawnCards: string[]; // Danh sách ID thẻ đã từng bốc
  isBot: boolean;
  isDead: boolean;
  color: string;
  hasGuardianAngel?: boolean;
  hasHolyShield?: boolean; // Chặn một đòn tấn công gây sát thương rồi biến mất
  hasDeathMark?: boolean; // Đòn tấn công tiếp theo nhận thêm 2 sát thương
  hasGregorShield?: boolean;  // Gregor: không nhận sát thương đến đầu lượt sau
  abilityDisabled?: boolean;  // Ellen: vô hiệu hóa kỹ năng bị chọn vĩnh viễn
  extraTurnCount?: number;
  killsCount?: number;
  charlesKilledThirdOrLater?: boolean; // Charles kết liễu người chết thứ 3 trở đi của toàn trận
  agnesTargetPlayerId?: string | null;
  bryanKilledHp13?: boolean;
  mgangaPoisoned?: boolean;
  lightEquipmentDisabled?: boolean; // Nhật Thực Noctis tạm khóa trang bị Trắng
  cerberusTargetId?: string | null; // Mục tiêu đang bị Cerberus truy sát
  characterOptions?: string[]; // 2 nhân vật được rút để chọn (multiplayer)
  characterChoice?: string | null; // null = chưa chọn, string = đã chọn
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: "info" | "action" | "attack" | "card" | "system" | "reveal";
}

export interface DiceAnimState {
  rollerName: string;
  rollerColor: string;
  d6: number;
  d4: number;
  total: number;
  reason: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  hostId?: string; // ID của người tạo phòng (chủ phòng)
  players: Player[];
  turnIndex: number;
  phase: "lobby" | "roll" | "action" | "attack" | "game_over" | "cancelled" | "character_select";
  rolledDice: { d6: number; d4: number; total: number } | null;
  logs: GameLog[];
  winnerAlignment: Alignment[] | string[] | null; // Phe thắng cuộc
  selectedPlayerIdForHermit: string | null; // Phục vụ lúc chọn đích hỏi bài Ẩn Sĩ
  selectedPlayerIdForAttack: string | null; // Phục vụ lúc chọn đích tấn công
  selectedCard: { id: string; type: CardType } | null; // Thẻ đang chọn để dùng
  lastAttackDamage: number | null;
  lastAttackDice: { d6: number; d4: number; damage: number } | null;
  isPublicRoom: boolean;
  createdAt: number;
  roundNumber?: number;
  drawnCardId?: string | null;
  showGateSelection?: boolean;
  selectedGateDeck?: CardType | null;
  diceAnimState?: DiceAnimState | null;
  hermitDeck?: string[];
  hermitDiscard?: string[];
  lightDeck?: string[];
  lightDiscard?: string[];
  shadowDeck?: string[];
  shadowDiscard?: string[];
  hermitTargetIdentityShown?: { viewerId: string; targetId: string; characterName: string; alignment: string } | null;
  fukaTargetId?: string | null; // Fuka: lượt sau đặt damage của target về 7
  winnerPlayerIds?: string[] | null;
}

export interface VictoryResult {
  winnerAlignment: Alignment[];
  winnerPlayerIds: string[];
}

