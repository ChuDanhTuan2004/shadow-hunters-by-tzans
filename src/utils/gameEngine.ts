import { Alignment, Character, Player, GameState, GameLog, CardType, Card, VictoryResult } from "../types";
import { CHARACTERS, DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, GameCard, getCardById } from "../data/cards";
import { LOCATIONS, areLocationsInSameArea, getLocationByRoll } from "../data/locations";

/**
 * Phân bổ nhân vật ngẫu nhiên tuân theo tỷ lệ phe chuẩn Shadow Hunters
 */
export function assignCharactersForPlayers(count: number): Character[] {
  const shadows = CHARACTERS.filter(c => c.alignment === Alignment.SHADOW);
  const hunters = CHARACTERS.filter(c => c.alignment === Alignment.HUNTER);
  const neutrals = CHARACTERS.filter(c => c.alignment === Alignment.NEUTRAL);

  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const shuffledShadows = shuffle(shadows);
  const shuffledHunters = shuffle(hunters);
  const shuffledNeutrals = shuffle(neutrals);

  let shadowCount = 1;
  let hunterCount = 1;
  let neutralCount = 1;

  if (4 === count) {
    shadowCount = 2;
    hunterCount = 2;
    neutralCount = 0;
  } else if (5 === count) {
    shadowCount = 2;
    hunterCount = 2;
    neutralCount = 1;
  } else if (6 === count) {
    shadowCount = 2;
    hunterCount = 2;
    neutralCount = 2;
  } else if (7 === count) {
    shadowCount = 3;
    hunterCount = 3;
    neutralCount = 1;
  } else if (8 === count) {
    shadowCount = 3;
    hunterCount = 3;
    neutralCount = 2;
  } else if (9 === count) {
    shadowCount = 3;
    hunterCount = 3;
    neutralCount = 3;
  } else if (10 === count) {
    shadowCount = 3;
    hunterCount = 3;
    neutralCount = 4;
  } else if (11 === count) {
    shadowCount = 4;
    hunterCount = 4;
    neutralCount = 3;
  } else if (12 <= count) {
    shadowCount = 4;
    hunterCount = 4;
    neutralCount = 4;
  }

  const selected: Character[] = [
    ...shuffledShadows.slice(0, shadowCount),
    ...shuffledHunters.slice(0, hunterCount),
    ...shuffledNeutrals.slice(0, neutralCount)
  ];

  return shuffle(selected);
}

/**
 * Khởi tạo một trận đấu mới
 */
export function initGame(playersInLobby: { id: string; name: string; isBot: boolean }[]): GameState {
  const finalPlayersList = [...playersInLobby];
  
  // Đảm bảo có ít nhất 3 người chơi bằng cách thêm Bot
  const botColors = [
    "#EF4444", "#3B82F6", "#10B981", "#F59E0B", 
    "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280",
    "#84CC16", "#6366F1", "#F97316", "#06B6D4"
  ];
  const botNames = ["Hắc Long Bot", "Bạch Hổ Bot", "Ẩn Sĩ Bot", "Bóng Ma Bot", "Thợ Săn Bot", "Dân Thường Bot"];
  
  while (3 > finalPlayersList.length) {
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];
    const uniqueName = `${randomName} #${Math.floor(Math.random() * 900) + 100}`;
    if (!finalPlayersList.some(p => p.name === uniqueName)) {
      finalPlayersList.push({
        id: "bot_" + Math.random().toString(36).substr(2, 9),
        name: uniqueName,
        isBot: true
      });
    }
  }

  // Phân bổ nhân vật ngẫu nhiên chuẩn phe Shadow Hunters
  const assignedCharacters = assignCharactersForPlayers(finalPlayersList.length);
  
  const players: Player[] = finalPlayersList.map((p, idx) => {
    const character = assignedCharacters[idx];
    return {
      id: p.id,
      name: p.name,
      character: { ...character },
      currentHp: character.hp,
      locationId: null,
      alignmentRevealed: false,
      equipments: [],
      isBot: p.isBot,
      isDead: false,
      color: botColors[idx % botColors.length]
    };
  });

  const shuffleIds = (arr: GameCard[]): string[] => {
    return arr.map(c => c.id).sort(() => Math.random() - 0.5);
  };

  const roomId = "ROOM_" + Math.floor(Math.random() * 90000 + 10000);

  return {
    roomId,
    players,
    turnIndex: 0,
    phase: "roll",
    rolledDice: null,
    roundNumber: 1,
    logs: [
      {
        id: "log_init",
        timestamp: Date.now(),
        message: "Trận đấu Shadow Hunters chính thức bắt đầu! Thân phận của bạn đã được phân phát bí mật.",
        type: "system"
      }
    ],
    winnerAlignment: null,
    winnerPlayerIds: null,
    selectedPlayerIdForHermit: null,
    selectedPlayerIdForAttack: null,
    selectedCard: null,
    lastAttackDamage: null,
    lastAttackDice: null,
    isPublicRoom: false,
    createdAt: Date.now(),
    hermitDeck: shuffleIds(DECK_HERMIT),
    hermitDiscard: [],
    lightDeck: shuffleIds(DECK_LIGHT),
    lightDiscard: [],
    shadowDeck: shuffleIds(DECK_SHADOW),
    shadowDiscard: []
  };
}

/**
 * Đổ xúc xắc xúc tiến di chuyển (D6 + D4)
 */
export function rollForMovement(): { d6: number; d4: number; total: number } {
  const d6 = Math.floor(Math.random() * 6) + 1;
  const d4 = Math.floor(Math.random() * 4) + 1;
  return { d6, d4, total: d6 + d4 };
}

/**
 * Đổ xúc xắc tấn công |D6 - D4|
 */
export function rollForAttack(): { d6: number; d4: number; damage: number } {
  const d6 = Math.floor(Math.random() * 6) + 1;
  const d4 = Math.floor(Math.random() * 4) + 1;
  return { d6, d4, damage: Math.abs(d6 - d4) };
}

/**
 * Tạo log game mới
 */
export function createLog(message: string, type: GameLog["type"] = "info"): GameLog {
  return {
    id: "log_" + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    message,
    type
  };
}

/**
 * Kiểm tra điều kiện thắng trận đấu
 */
export function checkVictory(players: Player[]): VictoryResult | null {
  const totalShadows = players.filter(p => Alignment.SHADOW === p.character.alignment).length;
  const totalHunters = players.filter(p => Alignment.HUNTER === p.character.alignment).length;

  const alivePlayers = players.filter(p => !p.isDead);
  const deadPlayers = players.filter(p => p.isDead);

  const aliveShadows = alivePlayers.filter(p => Alignment.SHADOW === p.character.alignment);
  const aliveHunters = alivePlayers.filter(p => Alignment.HUNTER === p.character.alignment);
  const deadNeutrals = deadPlayers.filter(p => Alignment.NEUTRAL === p.character.alignment);

  // 0. Daniel hoặc Catherine thắng ngay lập tức nếu là người chết đầu tiên
  const firstDead = 1 === deadPlayers.length ? deadPlayers[0] : null;
  let neutralInstantWin = false;

  if (null !== firstDead) {
    const fdName = firstDead.character.name;
    if (fdName.startsWith("Daniel") || fdName.startsWith("Catherine")) {
      neutralInstantWin = true;
    }
  }

  // 1. Phe Shadow thắng
  const shadowWinByDeadHunters = 0 < totalHunters && 0 === aliveHunters.length;
  const shadowWinByDeadNeutrals = 3 <= deadNeutrals.length;
  const shadowWins = shadowWinByDeadHunters || shadowWinByDeadNeutrals;

  // 2. Phe Hunter thắng
  const hunterWins = 0 < totalShadows && 0 === aliveShadows.length;

  // 3. Kiểm tra các điều kiện thắng lập tức (Instant Win) của phe Neutral khác để dừng game
  for (const p of players) {
    if (Alignment.NEUTRAL !== p.character.alignment) continue;
    const charName = p.character.name;

    // Bob có >= 5 trang bị
    if (charName.startsWith("Bob") && 5 <= p.equipments.length) {
      neutralInstantWin = true;
    }
    // Charles diệt >= 3 người
    if (charName.startsWith("Charles") && 3 <= (p.killsCount || 0)) {
      neutralInstantWin = true;
    }
    // David có >= 3 trang bị thánh tích
    if (charName.startsWith("David")) {
      const count = p.equipments.filter(eq => ["l_talisman", "l_spear", "l_holyrobe", "l_rosary"].includes(eq)).length;
      if (3 <= count) {
        neutralInstantWin = true;
      }
    }
    // Bryan hạ gục người có HP tối đa >= 13
    if (charName.startsWith("Bryan") && p.bryanKilledHp13) {
      neutralInstantWin = true;
    }
    // Catherine là 1 trong 2 người cuối cùng còn sống
    if (charName.startsWith("Catherine") && 2 >= alivePlayers.length && false === p.isDead) {
      neutralInstantWin = true;
    }
  }

  const isGameOver = shadowWins || hunterWins || neutralInstantWin;
  if (false === isGameOver) {
    return null;
  }

  const winnerAlignments: Alignment[] = [];
  if (shadowWins) {
    winnerAlignments.push(Alignment.SHADOW);
  }
  if (hunterWins) {
    winnerAlignments.push(Alignment.HUNTER);
  }

  const winningPlayerIds: string[] = [];

  // Thêm người chơi phe Shadow nếu Shadow thắng
  if (shadowWins) {
    players.forEach(p => {
      if (Alignment.SHADOW === p.character.alignment) {
        winningPlayerIds.push(p.id);
      }
    });
  }

  // Thêm người chơi phe Hunter nếu Hunter thắng
  if (hunterWins) {
    players.forEach(p => {
      if (Alignment.HUNTER === p.character.alignment) {
        winningPlayerIds.push(p.id);
      }
    });
  }

  // Pass 1: Kiểm tra tất cả Neutral trừ Agnes
  players.forEach(p => {
    if (Alignment.NEUTRAL !== p.character.alignment) return;
    const charName = p.character.name;
    if (charName.startsWith("Agnes")) return; // Để xét ở Pass 2

    let neutralWon = false;
    if (charName.startsWith("Allie")) {
      neutralWon = false === p.isDead;
    } else if (charName.startsWith("Bob")) {
      neutralWon = 5 <= p.equipments.length;
    } else if (charName.startsWith("Charles")) {
      neutralWon = 3 <= (p.killsCount || 0);
    } else if (charName.startsWith("Daniel")) {
      neutralWon = (null !== firstDead && firstDead.id === p.id) || (false === p.isDead && hunterWins);
    } else if (charName.startsWith("Bryan")) {
      neutralWon = !!p.bryanKilledHp13 || ("loc_anvil" === p.locationId && false === p.isDead);
    } else if (charName.startsWith("Catherine")) {
      neutralWon = (null !== firstDead && firstDead.id === p.id) || (2 >= alivePlayers.length && false === p.isDead);
    } else if (charName.startsWith("David")) {
      const count = p.equipments.filter(eq => ["l_talisman", "l_spear", "l_holyrobe", "l_rosary"].includes(eq)).length;
      neutralWon = 3 <= count;
    }

    if (neutralWon) {
      winningPlayerIds.push(p.id);
    }
  });

  // Pass 2: Kiểm tra Agnes dựa trên trạng thái thắng của mục tiêu
  players.forEach(p => {
    if (Alignment.NEUTRAL !== p.character.alignment) return;
    const charName = p.character.name;
    if (!charName.startsWith("Agnes")) return;

    const myIndex = players.findIndex(pl => pl.id === p.id);
    const targetId = p.agnesTargetPlayerId || players[(myIndex - 1 + players.length) % players.length].id;
    
    // Nếu mục tiêu của Agnes đã thắng (phe Hunter/Shadow thắng, hoặc Neutral thắng ở Pass 1)
    if (winningPlayerIds.includes(targetId)) {
      winningPlayerIds.push(p.id);
    }
  });

  // Thêm Alignment.NEUTRAL vào winnerAlignments nếu có Neutral thắng
  const hasNeutralWinner = players.some(p => Alignment.NEUTRAL === p.character.alignment && winningPlayerIds.includes(p.id));
  if (hasNeutralWinner) {
    winnerAlignments.push(Alignment.NEUTRAL);
  }

  return {
    winnerAlignment: winnerAlignments,
    winnerPlayerIds: winningPlayerIds
  };
}

/**
 * Rút bài từ một xấp bài (Hermit / Light / Shadow), xáo lại bài bỏ nếu xấp bài rút rỗng.
 */
export function drawCardFromDeck(gameState: GameState, deckType: CardType): { state: GameState; cardId: string | null } {
  const nextState = { ...gameState };
  let deck = CardType.HERMIT === deckType 
    ? [...(nextState.hermitDeck || [])] 
    : CardType.LIGHT === deckType 
      ? [...(nextState.lightDeck || [])] 
      : [...(nextState.shadowDeck || [])];
  let discard = CardType.HERMIT === deckType 
    ? [...(nextState.hermitDiscard || [])] 
    : CardType.LIGHT === deckType 
      ? [...(nextState.lightDiscard || [])] 
      : [...(nextState.shadowDiscard || [])];

  if (0 === deck.length) {
    if (0 === discard.length) {
      return { state: nextState, cardId: null };
    }
    deck = [...discard].sort(() => Math.random() - 0.5);
    discard = [];
  }

  const cardId = deck.shift() || null;

  if (CardType.HERMIT === deckType) {
    nextState.hermitDeck = deck;
    nextState.hermitDiscard = discard;
  } else if (CardType.LIGHT === deckType) {
    nextState.lightDeck = deck;
    nextState.lightDiscard = discard;
  } else {
    nextState.shadowDeck = deck;
    nextState.shadowDiscard = discard;
  }

  return { state: nextState, cardId };
}

/**
 * Tính toán sát thương thực nhận dựa trên trang bị phòng thủ
 */
export function calculateDamageTaken(target: Player, baseDamage: number, attacker: Player): { finalDamage: number; logMsg: string } {
  let finalDamage = baseDamage;
  let logMsg = "";

  // Holy Robe: công -1, thủ +1 (giảm 1 sát thương nhận từ đòn đánh thường)
  if (target.equipments.includes("l_holyrobe") && finalDamage > 0) {
    finalDamage = Math.max(0, finalDamage - 1);
    logMsg = `🛡️ [Thánh Bào] giảm bớt 1 sát thương nhận vào của ${target.name}. `;
  }

  // Guardian Angel: kháng sát thương hoàn toàn từ attack của người khác
  if (target.hasGuardianAngel && finalDamage > 0) {
    finalDamage = 0;
    logMsg = `🛡️ [Thiên Thần Hộ Mệnh] kích hoạt bảo vệ ${target.name} khỏi mọi đòn tấn công! `;
  }

  // Gregor shield: kháng sát thương hoàn toàn cho đến đầu lượt sau
  if (target.hasGregorShield && finalDamage > 0) {
    finalDamage = 0;
    logMsg = `🛡️ [Áo Giáp Thép Gregor] kích hoạt bảo vệ ${target.name} khỏi mọi sát thương! `;
  }

  return { finalDamage, logMsg };
}

/**
 * Thực hiện đòn tấn công từ người chơi này sang người chơi khác
 */
export function performAttack(
  gameState: GameState,
  attackerId: string,
  targetId: string,
  forcedDamage: number | null = null
): GameState {
  let updatedPlayers = gameState.players.map(p => ({ 
    ...p, 
    character: { ...p.character },
    equipments: [...p.equipments] 
  }));

  const attacker = updatedPlayers.find(p => p.id === attackerId)!;
  const target = updatedPlayers.find(p => p.id === targetId)!;
  
  if (attacker.isDead || target.isDead) return gameState;

  let damageRoll = 0;
  let diceDetail = "";
  let attackD6 = 0;
  let attackD4 = 0;

  if (null !== forcedDamage) {
    damageRoll = forcedDamage;
    diceDetail = `(Sát thương cố định: ${forcedDamage})`;
  } else {
    // Valkyrie hoặc Masamune: chỉ dùng xúc xắc D4 (luôn trúng)
    const isValkyrie = attacker.character.name.startsWith("Valkyrie");
    if (isValkyrie || attacker.equipments.includes("s_masamune")) {
      attackD4 = Math.floor(Math.random() * 4) + 1;
      damageRoll = attackD4;
      const src = isValkyrie ? "Valkyrie | Đòn Chém D4" : "Thần kiếm Masamune";
      diceDetail = `(${src} | Xúc xắc D4: ${attackD4} | Sát thương gốc: ${attackD4})`;
    } else {
      const { d6, d4, damage } = rollForAttack();
      damageRoll = damage;
      attackD6 = d6;
      attackD4 = d4;
      diceDetail = `(Xúc xắc D6: ${d6}, D4: ${d4} | Sát thương gốc: ${damage})`;
    }
  }

  const diceAnimState = null;
  const logs: GameLog[] = [];

  // Xác định các mục tiêu tấn công (nếu có Súng Liên Thanh thì quét toàn bộ mục tiêu trong tầm)
  const hasMachineGun = attacker.equipments.includes("s_machinegun");
  const targetsToAttack: Player[] = [];
  if (hasMachineGun && null === forcedDamage) {
    const hasHandgun = attacker.equipments.includes("s_handgun");
    updatedPlayers.forEach(p => {
      if (p.id !== attacker.id && !p.isDead) {
        const inSame = areLocationsInSameArea(attacker.locationId, p.locationId);
        const inRange = hasHandgun ? !inSame : inSame;
        if (inRange) {
          targetsToAttack.push(p);
        }
      }
    });
    // Đảm bảo mục tiêu gốc luôn nằm trong danh sách nếu vô tình bị sót
    if (targetsToAttack.length === 0) {
      targetsToAttack.push(target);
    }
  } else {
    targetsToAttack.push(target);
  }

  logs.push(createLog(`⚔️ ${attacker.name} khai hỏa tấn công ${hasMachineGun && null === forcedDamage ? "diện rộng" : `lên ${target.name}`}! ${diceDetail}`, "attack"));

  // Lặp qua từng mục tiêu để áp dụng sát thương
  targetsToAttack.forEach(currTarget => {
    // Nếu sát thương gốc bằng 0 (hụt) và không ép buộc sát thương
    if (0 === damageRoll && null === forcedDamage) {
      logs.push(createLog(`💨 Đòn đánh lên ${currTarget.name} bị HỤT!`, "attack"));
      return;
    }

    // Cộng sát thương từ Trang bị của Attacker
    let damageBonus = 0;
    if (attacker.equipments.includes("s_knife")) { // Dao Đồ Tể
      damageBonus += 1;
    }
    if (attacker.equipments.includes("s_chainsaw")) { // Cưa Máy
      damageBonus += 1;
    }
    if (attacker.equipments.includes("s_axe")) { // Rìu Rỉ Sét
      damageBonus += 1;
    }
    if (attacker.equipments.includes("l_holyrobe")) { // Thánh Bào (tấn công bị giảm 1 sát thương)
      damageBonus -= 1;
    }
    if (attacker.equipments.includes("l_spear") && attacker.character.alignment === Alignment.HUNTER) { // Thương Longinus (+2 sát thương cho Hunter)
      damageBonus += 2;
    }

    let finalDamage = damageRoll + damageBonus;

    // Nếu attacker là Bob và gây từ 2 sát thương trở lên, đồng thời mục tiêu có trang bị:
    // Tự động kích hoạt cướp trang bị thay vì gây sát thương!
    if (attacker.alignmentRevealed && attacker.character.name.startsWith("Bob") && finalDamage >= 2 && currTarget.equipments.length > 0) {
      const stolenId = currTarget.equipments[Math.floor(Math.random() * currTarget.equipments.length)];
      currTarget.equipments = currTarget.equipments.filter(e => e !== stolenId);
      attacker.equipments = [...attacker.equipments, stolenId];
      finalDamage = 0;
      
      const card = getCardById(stolenId);
      const cardName = card ? card.name : "Trang bị";
      logs.push(createLog(`🎒 [Trộm Trang Bị Bob] Bob [${attacker.name}] gây sát thương lớn và quyết định cướp trang bị [${cardName}] từ ${currTarget.name} thay vì gây sát thương!`, "action"));
    }

    // Áp dụng trang bị phòng thủ của mục tiêu
    const defenseResult = calculateDamageTaken(currTarget, finalDamage, attacker);
    finalDamage = defenseResult.finalDamage;
    if (defenseResult.logMsg) {
      logs.push(createLog(defenseResult.logMsg, "attack"));
    }

    // Trừ máu mục tiêu
    if (finalDamage > 0) {
      currTarget.currentHp = Math.max(0, currTarget.currentHp - finalDamage);
      logs.push(createLog(
        `💥 Gây ${finalDamage} sát thương lên ${currTarget.name}!`,
        "attack"
      ));
    }

    // Kích hoạt Spear of Longinus tự lật thân phận nếu gây sát thương thành công
    if (attacker.equipments.includes("l_spear") && attacker.character.alignment === Alignment.HUNTER && !attacker.alignmentRevealed && finalDamage > 0) {
      attacker.alignmentRevealed = true;
      logs.push(createLog(`📣 [Thương Longinus] Tấn công thành công giúp Hunter [${attacker.name}] lộ diện danh tính thực sự là [${attacker.character.name}]!`, "reveal"));
    }

    // Kích hoạt nội tại hút máu của Vampire (không cần tiết lộ thân phận)
    if (attacker.alignmentRevealed && attacker.character.name.startsWith("Vampire") && 0 < finalDamage && !attacker.isDead) {
      attacker.currentHp = Math.min(attacker.character.hp, attacker.currentHp + 2);
      logs.push(createLog(`🩸 [Hút Máu] Vampire [${attacker.name}] hồi 2 HP từ vết thương của ${currTarget.name}.`, "action"));
    }

    // Kiểm tra cái chết
    if (0 >= currTarget.currentHp) {
      currTarget.isDead = true;
      currTarget.alignmentRevealed = true; // Chết là lộ vai trò
      logs.push(createLog(`☠️ ${currTarget.name} đã gục ngã! Thân phận thực sự: [${currTarget.character.name}] - Phe [${currTarget.character.alignment}].`, "reveal"));

      // Tăng số mạng hạ gục cho attacker
      attacker.killsCount = (attacker.killsCount || 0) + 1;
      logs.push(createLog(`⚔️ ${attacker.name} ghi nhận mạng hạ gục thứ ${attacker.killsCount}!`, "system"));

      // Bryan: lật mặt nếu giết mục tiêu hp <= 12, ghi nhận chỉ tiêu nếu giết mục tiêu hp >= 13
      if (attacker.character.name.startsWith("Bryan")) {
        if (currTarget.character.hp >= 13) {
          attacker.bryanKilledHp13 = true;
          logs.push(createLog(`🎯 [Bryan Đạt Chỉ Tiêu] Bryan [${attacker.name}] hạ gục đối thủ HP tối đa ≥ 13 (${currTarget.name}), hoàn thành mục tiêu chiến thắng!`, "system"));
        } else if (currTarget.character.hp <= 12) {
          if (!attacker.alignmentRevealed) {
            attacker.alignmentRevealed = true;
            logs.push(createLog(`📣 [Bại Lộ Bryan] Do hạ gục mục tiêu HP tối đa ≤ 12 (${currTarget.name}), Bryan [${attacker.name}] buộc phải lật ngửa thân phận!`, "reveal"));
          }
        }
      }

      // Tự động tiết lộ Daniel nếu có người chết
      updatedPlayers = updatedPlayers.map(p => {
        if (p.character.name.startsWith("Daniel") && !p.alignmentRevealed && !p.isDead) {
          logs.push(createLog(`📣 [Trăn Trối Daniel] Do có người chơi tử nạn, Daniel [${p.name}] bắt buộc lật ngửa thân phận của mình!`, "reveal"));
          return { ...p, alignmentRevealed: true };
        }
        return p;
      });

      // Silver Rosary: cướp tất cả trang bị của nạn nhân
      if (attacker.equipments.includes("l_rosary") && currTarget.equipments.length > 0) {
        attacker.equipments = Array.from(new Set([...attacker.equipments, ...currTarget.equipments]));
        logs.push(createLog(`🎒 [Chuỗi Hạt Bạc] ${attacker.name} cướp lấy toàn bộ trang bị từ tay ${currTarget.name}!`, "action"));
        currTarget.equipments = [];
      }

      // Nội tại của Bob Kẻ Trộm Mộ: cướp trang bị của người chết (Yêu cầu đã tiết lộ thân phận)
      const bob = updatedPlayers.find(p => p.character.name.startsWith("Bob") && p.alignmentRevealed && !p.isDead);
      if (undefined !== bob && null !== bob && 0 < currTarget.equipments.length) {
        bob.equipments = Array.from(new Set([...bob.equipments, ...currTarget.equipments]));
        logs.push(createLog(`🎒 Kẻ trộm mộ [${bob.name}] nhanh tay cướp sạch trang bị của ${currTarget.name}!`, "action"));
        currTarget.equipments = [];
      }
    }

    // Kích hoạt nội tại Phản công tức thời của Werewolf (có thể lật ngửa để dùng, hoặc đã lật rồi)
    // Werewolf counterattack bằng đòn tấn công thường (|D6-D4|) khi bị tấn công
    if (currTarget.alignmentRevealed && currTarget.character.name.startsWith("Werewolf") && !currTarget.isDead && 0 < finalDamage && !attacker.isDead) {
      const { d6: wD6, d4: wD4, damage: wDmg } = rollForAttack();
      const counterDamage = Math.max(0, wDmg);
      logs.push(createLog(`🐺 [Phản Công Tức Thời] Người Sói [${currTarget.name}] counterattack! D6:${wD6} D4:${wD4} → ${counterDamage} sát thương lên ${attacker.name}!`, "action"));
      if (0 < counterDamage) {
        attacker.currentHp = Math.max(0, attacker.currentHp - counterDamage);
        if (0 >= attacker.currentHp) {
          attacker.isDead = true;
          attacker.alignmentRevealed = true;
          logs.push(createLog(`☠️ [${attacker.name}] chết do phản đòn của Người Sói! Thân phận thực sự: [${attacker.character.name}] - Phe [${attacker.character.alignment}].`, "reveal"));
        }
      } else {
        logs.push(createLog(`💨 Đòn phản công của Người Sói [${currTarget.name}] bị HỤT!`, "action"));
      }
    }
  });

  // Kiểm tra điều kiện thắng
  const victoryResult = checkVictory(updatedPlayers);
  let newPhase = gameState.phase;
  let winnerAlignment: Alignment[] | string[] | null = null;
  let winnerPlayerIds: string[] | null = null;

  if (null !== victoryResult) {
    newPhase = "game_over";
    winnerAlignment = victoryResult.winnerAlignment;
    winnerPlayerIds = victoryResult.winnerPlayerIds;
    updatedPlayers = updatedPlayers.map(p => ({ ...p, alignmentRevealed: true }));
    logs.push(createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Phe chiến thắng: ${victoryResult.winnerAlignment.join(", ")}!`, "system"));
  }

  return {
    ...gameState,
    players: updatedPlayers,
    logs: [...logs, ...gameState.logs],
    lastAttackDamage: damageRoll,
    lastAttackDice: { d6: attackD6, d4: attackD4, damage: damageRoll },
    phase: newPhase,
    winnerAlignment,
    winnerPlayerIds,
    diceAnimState
  };
}

/**
 * Xử lý lá bài Hermit (Ẩn sĩ dò hỏi)
 */
export function applyHermitCard(
  gameState: GameState,
  targetPlayerId: string,
  cardId: string,
  sourcePlayerId: string
): GameState {
  let updatedPlayers = gameState.players.map(p => ({ ...p, character: { ...p.character } }));
  const source = updatedPlayers.find(p => p.id === sourcePlayerId)!;
  const target = updatedPlayers.find(p => p.id === targetPlayerId)!;

  if (target.isDead) return gameState;

  const logs: GameLog[] = [];
  let damageToDeal = 0;
  let healToDeal = 0;
  let matches = false;
  let hermitTargetIdentityShown: any = null;

  switch (cardId) {
    case "h_aid": // Hermit's Aid: Nếu là Hunter: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương)
      if (Alignment.HUNTER === target.character.alignment) {
        matches = true;
        if (target.currentHp === target.character.hp) {
          damageToDeal = 1;
        } else {
          healToDeal = 1;
        }
      }
      break;
    case "h_nurture": // Hermit's Nurturance: Nếu là Neutral: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương)
      if (Alignment.NEUTRAL === target.character.alignment) {
        matches = true;
        if (target.currentHp === target.character.hp) {
          damageToDeal = 1;
        } else {
          healToDeal = 1;
        }
      }
      break;
    case "h_huddle": // Hermit's Huddle: Nếu là Shadow: Hồi 1 sát thương (nếu full HP thì nhận 1 sát thương)
      if (Alignment.SHADOW === target.character.alignment) {
        matches = true;
        if (target.currentHp === target.character.hp) {
          damageToDeal = 1;
        } else {
          healToDeal = 1;
        }
      }
      break;
    case "h_blackmail": // Hermit's Blackmail: Nếu là Neutral hoặc Hunter: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương
      if (Alignment.NEUTRAL === target.character.alignment || Alignment.HUNTER === target.character.alignment) {
        matches = true;
        if (target.equipments.length > 0) {
          const toGive = target.equipments[Math.floor(Math.random() * target.equipments.length)];
          target.equipments = target.equipments.filter(e => e !== toGive);
          source.equipments = [...source.equipments, toGive];
          const card = getCardById(toGive);
          const cardName = card ? card.name : "Trang bị";
          logs.push(createLog(`🤫 ${target.name} đã chuyển giao trang bị [${cardName}] cho ${source.name}.`, "action"));
        } else {
          damageToDeal = 1;
        }
      }
      break;
    case "h_anger": // Hermit's Anger: Nếu là Hunter hoặc Shadow: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương
      if (Alignment.HUNTER === target.character.alignment || Alignment.SHADOW === target.character.alignment) {
        matches = true;
        if (target.equipments.length > 0) {
          const toGive = target.equipments[Math.floor(Math.random() * target.equipments.length)];
          target.equipments = target.equipments.filter(e => e !== toGive);
          source.equipments = [...source.equipments, toGive];
          const card = getCardById(toGive);
          const cardName = card ? card.name : "Trang bị";
          logs.push(createLog(`🤫 ${target.name} đã chuyển giao trang bị [${cardName}] cho ${source.name}.`, "action"));
        } else {
          damageToDeal = 1;
        }
      }
      break;
    case "h_greed": // Hermit's Greed: Nếu là Neutral hoặc Shadow: Đưa 1 Equipment cho người đưa thẻ, hoặc nhận 1 sát thương
      if (Alignment.NEUTRAL === target.character.alignment || Alignment.SHADOW === target.character.alignment) {
        matches = true;
        if (target.equipments.length > 0) {
          const toGive = target.equipments[Math.floor(Math.random() * target.equipments.length)];
          target.equipments = target.equipments.filter(e => e !== toGive);
          source.equipments = [...source.equipments, toGive];
          const card = getCardById(toGive);
          const cardName = card ? card.name : "Trang bị";
          logs.push(createLog(`🤫 ${target.name} đã chuyển giao trang bị [${cardName}] cho ${source.name}.`, "action"));
        } else {
          damageToDeal = 1;
        }
      }
      break;
    case "h_slap": // Hermit's Slap: Nếu là Hunter: Nhận 1 sát thương
      if (Alignment.HUNTER === target.character.alignment) {
        damageToDeal = 1;
        matches = true;
      }
      break;
    case "h_spell": // Hermit's Spell: Nếu là Shadow: Nhận 1 sát thương
      if (Alignment.SHADOW === target.character.alignment) {
        damageToDeal = 1;
        matches = true;
      }
      break;
    case "h_exorcism": // Hermit's Exorcism: Nếu là Shadow: Nhận 2 sát thương
      if (Alignment.SHADOW === target.character.alignment) {
        damageToDeal = 2;
        matches = true;
      }
      break;
    case "h_bully": // Hermit's Bully: Nếu HP tối đa ≤ 11 (A, B, C, E, U...): Nhận 1 sát thương
      if (target.character.hp <= 11) {
        damageToDeal = 1;
        matches = true;
      }
      break;
    case "h_lesson": // Hermit's Tough Lesson: Nếu HP tối đa ≥ 12 (D, F, G, V, W...): Nhận 2 sát thương
      if (target.character.hp >= 12) {
        damageToDeal = 2;
        matches = true;
      }
      break;
    case "h_prediction": // Hermit's Prediction: Bắt buộc cho người đưa thẻ xem thân phận của bạn
      matches = true;
      hermitTargetIdentityShown = {
        viewerId: sourcePlayerId,
        targetId: targetPlayerId,
        characterName: target.character.name,
        alignment: target.character.alignment
      };
      logs.push(createLog(`🤫 ${target.name} buộc phải cho ${source.name} xem thân phận bí mật của mình.`, "action"));
      break;
  }

  // Unknown: nội tại NÓI DỐI - có thể bỏ qua hiệu ứng Hermit Card mà không cần lật thân phận
  const isUnknownTarget = target.character.name.startsWith("Unknown");
  if (isUnknownTarget && matches && (damageToDeal > 0 || healToDeal > 0)) {
    // Unknown nói dối: bỏ qua hiệu ứng tiêu cực/tích cực mà không ai biết
    logs.push(createLog(`🎭 [Nói Dối Unknown] ${target.name} khéo léo đọc mật thư và âm thầm nói dối, bỏ qua mọi hiệu ứng mà không lộ thân phận!`, "action"));
  } else if (matches) {
    logs.push(createLog(`✉️ ${source.name} đã đưa một Hermit Card cho ${target.name}.`, "card"));
    if (damageToDeal > 0) {
      // Đầm sát thương
      target.currentHp = Math.max(0, target.currentHp - damageToDeal);
      logs.push(createLog(`🤫 Mật thư trừng phạt! ${target.name} âm thầm mất đi ${damageToDeal} HP do phản ứng tương khắc.`, "action"));
      if (target.currentHp <= 0) {
        target.isDead = true;
        target.alignmentRevealed = true;
        logs.push(createLog(`☠️ ${target.name} đã gục ngã vì mật thư Ẩn Sĩ hắc ám! Thân phận thực sự: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
      }
    } else if (healToDeal > 0) {
      target.currentHp = Math.min(target.character.hp, target.currentHp + healToDeal);
      logs.push(createLog(`💖 Mật thư chúc lành! ${target.name} âm thầm hồi lại ${healToDeal} HP.`, "action"));
    }
  } else {
    logs.push(createLog(`✉️ ${source.name} đã đưa một Hermit Card cho ${target.name}. Không có phản ứng đặc biệt.`, "action"));
  }

  // Check victory after damage
  const victoryResult = checkVictory(updatedPlayers);
  let newPhase = gameState.phase;
  let winnerAlignment = gameState.winnerAlignment;
  let winnerPlayerIds = gameState.winnerPlayerIds;

  if (null !== victoryResult) {
    newPhase = "game_over";
    winnerAlignment = victoryResult.winnerAlignment;
    winnerPlayerIds = victoryResult.winnerPlayerIds;
    updatedPlayers = updatedPlayers.map(p => ({ ...p, alignmentRevealed: true }));
    logs.push(createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Chiến thắng thuộc về phe: ${victoryResult.winnerAlignment.join(", ")}!`, "system"));
  }

  return {
    ...gameState,
    players: updatedPlayers,
    logs: [...logs, ...gameState.logs],
    phase: newPhase,
    winnerAlignment,
    winnerPlayerIds,
    selectedPlayerIdForHermit: null,
    hermitTargetIdentityShown
  };
}

/**
 * Sử dụng Thẻ bài Ánh Sáng / Bóng Tối dạng hành động hoặc trang bị
 */
export function useGameCard(
  gameState: GameState,
  cardId: string,
  sourcePlayerId: string,
  targetPlayerId: string | null = null
): GameState {
  let updatedPlayers = gameState.players.map(p => ({ ...p, character: { ...p.character } }));
  const source = updatedPlayers.find(p => p.id === sourcePlayerId)!;
  const logs: GameLog[] = [];

  const card = getCardById(cardId);
  if (!card) return gameState;

  logs.push(createLog(`🃏 ${source.name} sử dụng thẻ bài: [${card.name}]`, "card"));

  if (card.isEquipment) {
    if (true === source.equipments.includes(cardId)) {
      logs.push(createLog(`🎒 ${source.name} đã sở hữu trang bị [${card.name}] từ trước. Lá bài trang bị trùng lặp này bị loại bỏ mà không có thêm hiệu ứng.`, "action"));
    } else {
      // Gắn thẻ trang bị vào người chơi
      if (!source.isDead) {
        source.equipments = [...source.equipments, cardId];
        logs.push(createLog(`🎒 ${source.name} đã trang bị vật phẩm hộ thân: [${card.name}]`, "action"));
      }
    }
  } else {
    // Thẻ hành động tiêu dùng một lần
    switch (cardId) {
      case "l_advent": // Advent: Nếu là Hunter, có thể lật ngửa thân phận và hồi đầy HP
        if (Alignment.HUNTER === source.character.alignment) {
          source.alignmentRevealed = true;
          source.currentHp = source.character.hp;
          logs.push(createLog(`✨ [Lộ Diện Thần Thánh] Hunter [${source.name}] lật ngửa thân phận và được hồi phục đầy máu (HP)!`, "reveal"));
        } else {
          logs.push(createLog(`✨ [Lộ Diện Thần Thánh] được sử dụng nhưng do không phải là Hunter nên không có tác dụng đặc biệt xảy ra.`, "action"));
        }
        break;

      case "l_blessing": // Blessing: Chọn 1 người khác, hồi d6 HP
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          const roll = Math.floor(Math.random() * 6) + 1;
          target.currentHp = Math.min(target.character.hp, target.currentHp + roll);
          logs.push(createLog(`✨ [Ban Phước] ${source.name} lắc xúc xắc ra ${roll} chấm, hồi ${roll} máu cho ${target.name}.`, "action"));
        }
        break;

      case "l_chocolate": // Chocolate: Nhân vật bắt đầu bằng A, E, U có thể lật và full heal
        const firstLetter = source.character.name.charAt(0).toUpperCase();
        const startsWithAEU = "A" === firstLetter || "E" === firstLetter || "U" === firstLetter;
        if (startsWithAEU) {
          source.alignmentRevealed = true;
          source.currentHp = source.character.hp;
          logs.push(createLog(`🍫 [Chocolate] ${source.name} lật ngửa thân phận nhân vật [${source.character.name}] và được hồi phục đầy máu (HP)!`, "reveal"));
        } else {
          logs.push(createLog(`🍫 [Chocolate] được dùng nhưng nhân vật không bắt đầu bằng A, E, U nên không lật thân phận.`, "action"));
        }
        break;

      case "l_concealed": // Concealed Knowledge: Lượt phụ
        source.extraTurnCount = (source.extraTurnCount || 0) + 1;
        logs.push(createLog(`📖 [Tri Thức Che Giấu] sẽ cung cấp cho ${source.name} thêm một lượt phụ nữa ngay sau lượt hiện tại!`, "action"));
        break;

      case "l_disenchant": // Disenchant Mirror: Shadow bắt buộc lật ngửa
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          if (Alignment.SHADOW === target.character.alignment && !target.character.name.startsWith("Unknown")) {
            target.alignmentRevealed = true;
            logs.push(createLog(`🔮 [Gương Hóa Giải] Chiếu rọi ép buộc Shadow [${target.name}] tiết lộ danh tính thực sự là [${target.character.name}]!`, "reveal"));
          } else {
            logs.push(createLog(`🔮 [Gương Hóa Giải] Chiếu rọi lên ${target.name} nhưng không phát hiện dấu vết ma quỷ hắc ám nào.`, "action"));
          }
        }
        break;

      case "l_firstaid": // First Aid: Đặt sát thương về 7 (HP = HP tối đa - 7)
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          target.currentHp = target.character.hp - 7;
          logs.push(createLog(`🏥 [Sơ Cứu] điều chỉnh HP của ${target.name} về mức sát thương bằng 7 (HP hiện tại: ${target.currentHp} HP).`, "action"));
        }
        break;

      case "l_flare": // Flare of Judgement: Tất cả người chơi khác nhận 2 sát thương
        updatedPlayers.forEach(p => {
          if (p.id !== source.id && !p.isDead) {
            p.currentHp = Math.max(0, p.currentHp - 2);
            if (p.currentHp <= 0) {
              p.isDead = true;
              p.alignmentRevealed = true;
              logs.push(createLog(`☠️ ${p.name} tử trận do chịu ảnh hưởng từ Phán Quyết! Thân phận thực sự: [${p.character.name}] - Phe [${p.character.alignment}].`, "reveal"));
            }
          }
        });
        logs.push(createLog(`☀️ [Tia Sáng Phán Quyết] giáng xuống gây 2 sát thương cho toàn bộ người chơi khác!`, "action"));
        break;

      case "l_guardian_single": // Guardian Angel: Kháng sát thương attack của người khác cho tới lượt sau
        source.hasGuardianAngel = true;
        logs.push(createLog(`🛡️ [Thiên Thần Hộ Mệnh] giang cánh bảo vệ ${source.name} khỏi mọi đòn tấn công thường cho đến lượt tiếp theo!`, "action"));
        break;

      case "l_holywater1":
      case "l_holywater2": // Holy Water of Healing: Hồi 2 HP cho bản thân
        source.currentHp = Math.min(source.character.hp, source.currentHp + 2);
        logs.push(createLog(`🥛 [Nước Thánh Trị Liệu] giúp ${source.name} hồi phục 2 HP.`, "action"));
        break;

      case "s_banana": // Banana Peel: Đưa 1 trang bị cho người khác hoặc tự mất 1 HP
        if (targetPlayerId) {
          const parts = targetPlayerId.split(":");
          const actualTargetId = parts[0];
          const equipCardId = parts[1];
          const target = updatedPlayers.find(p => p.id === actualTargetId)!;
          
          if (equipCardId && source.equipments.includes(equipCardId)) {
            source.equipments = source.equipments.filter(e => e !== equipCardId);
            target.equipments = [...target.equipments, equipCardId];
            const eqCard = getCardById(equipCardId);
            const eqName = eqCard ? eqCard.name : "Trang bị";
            logs.push(createLog(`🍌 [Vỏ Chuối] ${source.name} đã chuyển giao trang bị [${eqName}] của mình cho ${target.name}!`, "action"));
          } else {
            source.currentHp = Math.max(0, source.currentHp - 1);
            logs.push(createLog(`🍌 [Vỏ Chuối] ${source.name} không có trang bị nào để chuyển giao, tự nhận 1 sát thương!`, "action"));
            if (source.currentHp <= 0) {
              source.isDead = true;
              source.alignmentRevealed = true;
              logs.push(createLog(`☠️ ${source.name} đã tử vong vì vỏ chuối! Thân phận thực sự: [${source.character.name}] - Phe [${source.character.alignment}].`, "reveal"));
            }
          }
        }
        break;

      case "s_spider": // Bloodthirsty Spider: Target mất 2 HP, source mất 2 HP
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          
          if (target.equipments.includes("l_talisman")) {
            logs.push(createLog(`🛡️ ${target.name} miễn nhiễm với Nhện Độc Khát Máu nhờ có [Bùa Hộ Mệnh]!`, "action"));
          } else {
            target.currentHp = Math.max(0, target.currentHp - 2);
            logs.push(createLog(`🕷️ [Nhện Độc Khát Máu] cắn ${target.name} mất 2 HP!`, "action"));
            if (target.currentHp <= 0) {
              target.isDead = true;
              target.alignmentRevealed = true;
              logs.push(createLog(`☠️ ${target.name} đã tử trận vì độc nhện! Thân phận thực sự: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
            }
          }
          
          source.currentHp = Math.max(0, source.currentHp - 2);
          logs.push(createLog(`🕷️ [Nhện Độc Khát Máu] cũng cắn ngược ${source.name} mất 2 HP!`, "action"));
          if (source.currentHp <= 0) {
            source.isDead = true;
            source.alignmentRevealed = true;
            logs.push(createLog(`☠️ ${source.name} tự vong do nhện độc cắn! Thân phận thực sự: [${source.character.name}] - Phe [${source.character.alignment}].`, "reveal"));
          }
        }
        break;

      case "s_ritual": // Diabolic Ritual: Phe Shadow lật ngửa thân phận và hồi đầy máu
        if (Alignment.SHADOW === source.character.alignment) {
          source.alignmentRevealed = true;
          source.currentHp = source.character.hp;
          logs.push(createLog(`😈 [Nghi Lễ Tà Ác] ${source.name} lộ diện thân phận ác quỷ [${source.character.name}] và được hồi phục đầy máu (HP)!`, "reveal"));
        } else {
          logs.push(createLog(`😈 [Nghi Lễ Tà Ác] được dùng nhưng ${source.name} không thuộc phe Bóng Tối nên không có tác dụng.`, "action"));
        }
        break;

      case "s_dynamite": // Dynamite: Tung 2 xúc xắc, gây 3 sát thương diện rộng khu vực tương ứng (Trừ 7)
        {
          const rollD6 = Math.floor(Math.random() * 6) + 1;
          const rollD4 = Math.floor(Math.random() * 4) + 1;
          const dynSum = rollD6 + rollD4;
          logs.push(createLog(`🧨 Lắc xúc xắc Thuốc Nổ: D6 = ${rollD6}, D4 = ${rollD4}. Tổng = ${dynSum}.`, "action"));
          
          if (7 === dynSum) {
            logs.push(createLog(`🧨 Thuốc nổ xịt! Tổng xúc xắc ra 7, không có vụ nổ nào xảy ra.`, "action"));
          } else {
            const matchedLoc = LOCATIONS.find(l => l.rollValues.includes(dynSum));
            if (matchedLoc) {
              logs.push(createLog(`🧨 Thuốc nổ kích nổ tại khu vực tương ứng của địa điểm [${matchedLoc.name}]!`, "action"));
              
              updatedPlayers.forEach(p => {
                if (!p.isDead && p.locationId) {
                  const inSameArea = areLocationsInSameArea(p.locationId, matchedLoc.id);
                  if (inSameArea) {
                    if (p.equipments.includes("l_talisman")) {
                      logs.push(createLog(`🛡️ ${p.name} được [Bùa Hộ Mệnh] bảo hộ khỏi vụ nổ thuốc nổ!`, "action"));
                    } else {
                      p.currentHp = Math.max(0, p.currentHp - 3);
                      logs.push(createLog(`💥 ${p.name} chịu 3 sát thương từ vụ nổ thuốc nổ!`, "action"));
                      if (p.currentHp <= 0) {
                        p.isDead = true;
                        p.alignmentRevealed = true;
                        logs.push(createLog(`☠️ ${p.name} tử nạn trong vụ nổ kinh hoàng! Thân phận thực sự: [${p.character.name}] - Phe [${p.character.alignment}].`, "reveal"));
                      }
                    }
                  }
                }
              });
            }
          }
        }
        break;

      case "s_goblin1":
      case "s_goblin2": // Moody Goblin: Cướp 1 trang bị của người khác
        if (targetPlayerId) {
          const parts = targetPlayerId.split(":");
          const actualTargetId = parts[0];
          const equipCardId = parts[1];
          const target = updatedPlayers.find(p => p.id === actualTargetId)!;
          
          if (equipCardId && target.equipments.includes(equipCardId)) {
            target.equipments = target.equipments.filter(e => e !== equipCardId);
            source.equipments = [...source.equipments, equipCardId];
            const eqCard = getCardById(equipCardId);
            const eqName = eqCard ? eqCard.name : "Trang bị";
            logs.push(createLog(`👹 [Yêu Tinh Cau Có] ${source.name} đã cướp lấy trang bị [${eqName}] từ tay ${target.name}!`, "action"));
          }
        }
        break;

      case "s_doll": // Spiritual Doll: Chọn 1 người, lắc D6. 1-4: Target nhận 3 sát thương, 5-6: Source nhận 3 sát thương
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          const rollD6 = Math.floor(Math.random() * 6) + 1;
          
          if (rollD6 <= 4) {
            if (target.equipments.includes("l_talisman")) {
              logs.push(createLog(`🛡️ ${target.name} kháng cự búp bê nguyền rủa bằng [Bùa Hộ Mệnh]!`, "action"));
            } else {
              target.currentHp = Math.max(0, target.currentHp - 3);
              logs.push(createLog(`🎎 [Búp Bê Nguyền Rủa] rung động! Kết quả xúc xắc: ${rollD6}. ${target.name} nhận 3 sát thương!`, "action"));
              if (target.currentHp <= 0) {
                target.isDead = true;
                target.alignmentRevealed = true;
                logs.push(createLog(`☠️ ${target.name} gục ngã vì nguyền rủa! Thân phận thực sự: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
              }
            }
          } else {
            source.currentHp = Math.max(0, source.currentHp - 3);
            logs.push(createLog(`🎎 [Búp Bê Nguyền Rủa] phản phệ! Kết quả xúc xắc: ${rollD6}. ${source.name} tự nhận 3 sát thương!`, "action"));
            if (source.currentHp <= 0) {
              source.isDead = true;
              source.alignmentRevealed = true;
              logs.push(createLog(`☠️ ${source.name} tự vong do phản lực nguyền rủa! Thân phận thực sự: [${source.character.name}] - Phe [${source.character.alignment}].`, "reveal"));
            }
          }
        }
        break;

      case "s_bat1":
      case "s_bat2":
      case "s_bat3": // Vampire Bat: Chọn 1 người gây 2 sát thương, bạn hồi 1 HP
        if (targetPlayerId) {
          const target = updatedPlayers.find(p => p.id === targetPlayerId)!;
          
          if (target.equipments.includes("l_talisman")) {
            logs.push(createLog(`🛡️ ${target.name} kháng cự Dơi Hút Máu bằng [Bùa Hộ Mệnh]!`, "action"));
          } else {
            target.currentHp = Math.max(0, target.currentHp - 2);
            logs.push(createLog(`🦇 [Dơi Hút Máu] tấn công gây 2 sát thương lên ${target.name}!`, "action"));
            if (target.currentHp <= 0) {
              target.isDead = true;
              target.alignmentRevealed = true;
              logs.push(createLog(`☠️ ${target.name} mất mạng do Dơi Hút Máu! Thân phận thực sự: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
            }
          }
          
          if (!source.isDead) {
            source.currentHp = Math.min(source.character.hp, source.currentHp + 1);
            logs.push(createLog(`🦇 ${source.name} được hồi phục 1 HP từ dơi hút máu.`, "action"));
          }
        }
        break;
    }
  }

  let nextDiscard = card.type === CardType.HERMIT
    ? [...(gameState.hermitDiscard || [])]
    : card.type === CardType.LIGHT
      ? [...(gameState.lightDiscard || [])]
      : [...(gameState.shadowDiscard || [])];

  if (!card.isEquipment) {
    nextDiscard.push(cardId);
  }

  // Check victory after actions
  const victoryResult = checkVictory(updatedPlayers);
  let newPhase = gameState.phase;
  let winnerAlignment = gameState.winnerAlignment;
  let winnerPlayerIds = gameState.winnerPlayerIds;

  if (null !== victoryResult) {
    newPhase = "game_over";
    winnerAlignment = victoryResult.winnerAlignment;
    winnerPlayerIds = victoryResult.winnerPlayerIds;
    updatedPlayers = updatedPlayers.map(p => ({ ...p, alignmentRevealed: true }));
    logs.push(createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Chiến thắng thuộc về phe: ${victoryResult.winnerAlignment.join(", ")}!`, "system"));
  }

  return {
    ...gameState,
    players: updatedPlayers,
    logs: [...logs, ...gameState.logs],
    phase: newPhase,
    winnerAlignment,
    winnerPlayerIds,
    selectedCard: null,
    hermitDiscard: CardType.HERMIT === card.type ? nextDiscard : gameState.hermitDiscard,
    lightDiscard: CardType.LIGHT === card.type ? nextDiscard : gameState.lightDiscard,
    shadowDiscard: CardType.SHADOW === card.type ? nextDiscard : gameState.shadowDiscard
  };
}

/**
 * Thực hiện kích hoạt kỹ năng đặc biệt của Nhân vật khi Tiết Lộ Danh Tính
 */
export function activateCharacterAbility(
  gameState: GameState,
  playerId: string,
  targetPlayerId: string | null = null
): GameState {
  let updatedPlayers = gameState.players.map(p => ({ ...p, character: { ...p.character } }));
  const player = updatedPlayers.find(p => p.id === playerId)!;
  const logs: GameLog[] = [];

  if (player.isDead) return gameState;

  const wasAlreadyRevealed = player.alignmentRevealed;

  // Tiết lộ thân phận nếu chưa lộ
  if (!player.alignmentRevealed) {
    player.alignmentRevealed = true;
    logs.push(createLog(`📣 TIẾT LỘ THÂN PHẬN! ${player.name} tiết lộ vai diễn là [${player.character.name}] thuộc phe [${player.character.alignment}]!`, "reveal"));
  }

  // Thực hiện kỹ năng tương ứng
  const charName = player.character.name;

  if (charName.startsWith("Allie")) {
    if (!player.hasUsedAbility) {
      player.currentHp = player.character.hp;
      player.hasUsedAbility = true;
      logs.push(createLog(`🌸 [Ước Nguyện Allie] giúp cô hồi lại 100% sinh lực (hồi phục đầy HP)!`, "action"));
    } else if (wasAlreadyRevealed) {
      logs.push(createLog(`⚠️ ${player.name} đã sử dụng tuyệt kỹ hồi máu trước đó rồi!`, "system"));
    }
  } else if (charName.startsWith("Franklin")) {
    if (!player.hasUsedAbility && !player.abilityDisabled) {
      if (targetPlayerId) {
        const target = updatedPlayers.find(p => p.id === targetPlayerId);
        if (target && !target.isDead) {
          const roll = Math.floor(Math.random() * 6) + 1;
          player.hasUsedAbility = true;
          target.currentHp = Math.max(0, target.currentHp - roll);
          logs.push(createLog(`⚡ [Phóng Sét Định Điểm] Franklin [${player.name}] phóng sét trúng ${target.name} gây ${roll} sát thương (D6 = ${roll})!`, "action"));
          if (target.currentHp <= 0) {
            target.isDead = true;
            target.alignmentRevealed = true;
            logs.push(createLog(`☠️ ${target.name} tử trận do sét đánh! Thân phận: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
          }
        }
      } else {
        logs.push(createLog(`⚠️ Franklin cần chọn mục tiêu để phóng sét!`, "system"));
      }
    } else if (player.abilityDisabled) {
      logs.push(createLog(`⚠️ Kỹ năng của ${player.name} đã bị phiếng ấn vĩnh viễn bởi Ellen!`, "system"));
    } else if (wasAlreadyRevealed) {
      logs.push(createLog(`⚠️ ${player.name} đã phóng sét 1 lần trước đó rồi!`, "system"));
    }
  } else if (charName.startsWith("George")) {
    if (!player.hasUsedAbility && !player.abilityDisabled) {
      if (targetPlayerId) {
        const target = updatedPlayers.find(p => p.id === targetPlayerId);
        if (target && !target.isDead) {
          const roll = Math.floor(Math.random() * 4) + 1;
          player.hasUsedAbility = true;
          target.currentHp = Math.max(0, target.currentHp - roll);
          logs.push(createLog(`🎯 [Phát Bắn Chính Nghĩa] George [${player.name}] nhắm bắn ${target.name} gây ${roll} sát thương (D4 = ${roll})!`, "action"));
          if (target.currentHp <= 0) {
            target.isDead = true;
            target.alignmentRevealed = true;
            player.killsCount = (player.killsCount || 0) + 1;
            logs.push(createLog(`☠️ ${target.name} gục ngã trước phát bắn của George! Thân phận: [${target.character.name}] - Phe [${target.character.alignment}].`, "reveal"));
          }
        }
      } else {
        logs.push(createLog(`⚠️ George cần chọn mục tiêu để bắn!`, "system"));
      }
    } else if (player.abilityDisabled) {
      logs.push(createLog(`⚠️ Kỹ năng của ${player.name} đã bị phiếng ấn vĩnh viễn bởi Ellen!`, "system"));
    } else {
      logs.push(createLog(`⚠️ ${player.name} đã sử dụng kỹ năng bắn của George rồi!`, "system"));
    }
  } else if (charName.startsWith("Ellen")) {
    if (!player.hasUsedAbility && !player.abilityDisabled) {
      if (targetPlayerId) {
        const target = updatedPlayers.find(p => p.id === targetPlayerId);
        if (target && !target.isDead) {
          target.abilityDisabled = true;
          player.hasUsedAbility = true;
          logs.push(createLog(`🔮 [Phiếng Ấn Vĩnh Cửu] Ellen [${player.name}] phiếng ấn vĩnh viễn kỹ năng của ${target.name} ([${target.character.name}])!`, "action"));
        }
      } else {
        logs.push(createLog(`⚠️ Ellen cần chọn mục tiêu để phiếng ấn!`, "system"));
      }
    } else if (player.abilityDisabled) {
      logs.push(createLog(`⚠️ Kỹ năng của ${player.name} đã bị phiếng ấn vĩnh viễn bởi Ellen!`, "system"));
    } else {
      logs.push(createLog(`⚠️ Ellen đã sử dụng phiếng ấn rồi!`, "system"));
    }
  } else if (charName.startsWith("Fuka")) {
    if (!player.hasUsedAbility && !player.abilityDisabled) {
      if (targetPlayerId) {
        const fukaTarget = updatedPlayers.find(p => p.id === targetPlayerId);
        player.hasUsedAbility = true;
        logs.push(createLog(`⏳ [Trì Hoãn Thần Thời] Fuka [${player.name}] chọn mục tiêu ${fukaTarget?.name || targetPlayerId}. Đầu lượt sau của họ, sát thương sẽ bị đặt về 7!`, "action"));
        const victoryResult = checkVictory(updatedPlayers);
        return {
          ...gameState,
          players: updatedPlayers,
          logs: [...logs, ...gameState.logs],
          fukaTargetId: targetPlayerId,
          phase: victoryResult ? "game_over" : gameState.phase,
          winnerAlignment: victoryResult ? victoryResult.winnerAlignment : gameState.winnerAlignment,
          winnerPlayerIds: victoryResult ? victoryResult.winnerPlayerIds : gameState.winnerPlayerIds
        };
      } else {
        logs.push(createLog(`⚠️ Fuka cần chọn mục tiêu!`, "system"));
      }
    } else if (player.abilityDisabled) {
      logs.push(createLog(`⚠️ Kỹ năng của ${player.name} đã bị phiếng ấn vĩnh viễn bởi Ellen!`, "system"));
    } else {
      logs.push(createLog(`⚠️ Fuka đã sử dụng kỹ năng rồi!`, "system"));
    }
  } else if (charName.startsWith("Gregor")) {
    if (!player.hasUsedAbility && !player.abilityDisabled) {
      player.hasUsedAbility = true;
      player.hasGregorShield = true;
      logs.push(createLog(`🛡️ [Áo Giáp Thép] Gregor [${player.name}] kích hoạt lá chắn thép! Không nhận bất kỳ sát thương nào cho đến đầu lượt sau.`, "action"));
    } else if (player.abilityDisabled) {
      logs.push(createLog(`⚠️ Kỹ năng của ${player.name} đã bị phiếng ấn vĩnh viễn bởi Ellen!`, "system"));
    } else {
      logs.push(createLog(`⚠️ Gregor đã sử dụng áo giáp thép rồi!`, "system"));
    }
  } else if (charName.startsWith("Agnes")) {
    if (!player.hasUsedAbility) {
      player.hasUsedAbility = true;
      const myIndex = updatedPlayers.findIndex(p => p.id === player.id);
      const targetPlayer = updatedPlayers[(myIndex + 1) % updatedPlayers.length];
      player.agnesTargetPlayerId = targetPlayer.id;
      logs.push(createLog(`🎭 [Đảo Chiều Số Phận] Agnes [${player.name}] kích hoạt đổi điều kiện thắng! Mục tiêu mới: hỗ trợ ${targetPlayer.name} giành chiến thắng!`, "action"));
    } else {
      logs.push(createLog(`⚠️ Agnes đã đảo chiều số phận trước đó rồi!`, "system"));
    }
  } else if (charName.startsWith("David")) {
    if (!player.hasUsedAbility) {
      if (targetPlayerId) {
        const parts = targetPlayerId.split(":");
        const deadPlayerId = parts[0];
        const equipId = parts[1];
        
        const deadPlayer = updatedPlayers.find(p => p.id === deadPlayerId && p.isDead);
        if (deadPlayer && deadPlayer.equipments.includes(equipId)) {
          deadPlayer.equipments = deadPlayer.equipments.filter(e => e !== equipId);
          player.equipments = [...player.equipments, equipId];
          player.hasUsedAbility = true;
          
          const card = getCardById(equipId);
          const cardName = card ? card.name : "Trang bị";
          logs.push(createLog(`🪦 [Đào Mộ Thánh Tích] David [${player.name}] kích hoạt đặc kỹ đào mộ, cướp trang bị [${cardName}] từ thi thể của ${deadPlayer.name}!`, "action"));
        } else {
          logs.push(createLog(`⚠️ Không tìm thấy trang bị hợp lệ trên thi thể người chết!`, "system"));
        }
      } else {
        logs.push(createLog(`⚠️ David cần chọn mục tiêu để cướp trang bị!`, "system"));
      }
    } else {
      logs.push(createLog(`⚠️ David đã sử dụng tuyệt kỹ đào mộ trước đó rồi!`, "system"));
    }
  } else if (charName.startsWith("Wight")) {
    // Wight: một lần trong game - thêm số lượt = số người đã chết
    if (!player.hasUsedAbility) {
      const deadCount = updatedPlayers.filter(p => p.isDead).length;
      if (0 < deadCount) {
        player.extraTurnCount = (player.extraTurnCount || 0) + deadCount;
        player.hasUsedAbility = true;
        logs.push(createLog(`👻 [Lượt Bổ Sung Wight] ${player.name} triệu hồi sức mạnh từ ${deadCount} linh hồn đã khuất, nhận thêm ${deadCount} lượt chơi!`, "action"));
      } else {
        logs.push(createLog(`⚠️ [Wight] Chưa có ai chết để triệu hồi lượt bổ sung!`, "system"));
      }
    } else {
      logs.push(createLog(`⚠️ ${player.name} đã sử dụng kỹ năng lượt bổ sung rồi!`, "system"));
    }
  } else {
    // Các nhân vật có nội tại tự động (Vampire, Werewolf, Valkyrie, Ultrasoul, Charles, Bob, Unknown, Emi, Daniel, Bryan, Catherine, George)
    if (!wasAlreadyRevealed) {
      logs.push(createLog(`✨ Kỹ năng [${player.character.abilityName}] của ${player.character.name} chính thức kích hoạt/lộ diện!`, "action"));
    }
  }

  // Check victory after ability usage
  const victoryResult = checkVictory(updatedPlayers);
  let newPhase = gameState.phase;
  let winnerAlignment = gameState.winnerAlignment;
  let winnerPlayerIds = gameState.winnerPlayerIds;

  if (null !== victoryResult) {
    newPhase = "game_over";
    winnerAlignment = victoryResult.winnerAlignment;
    winnerPlayerIds = victoryResult.winnerPlayerIds;
    updatedPlayers = updatedPlayers.map(p => ({ ...p, alignmentRevealed: true }));
    logs.push(createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Chiến thắng thuộc về phe: ${victoryResult.winnerAlignment.join(", ")}!`, "system"));
  }

  return {
    ...gameState,
    players: updatedPlayers,
    logs: [...logs, ...gameState.logs],
    phase: newPhase,
    winnerAlignment,
    winnerPlayerIds
  };
}

/**
 * Trí Tuệ Nhân Tạo (Bot) Tự Động Quyết Định Lượt Đi
 */
export function executeBotTurn(gameState: GameState, botId: string): GameState {
  let updatedState = { ...gameState };
  const currentBot = updatedState.players.find(p => p.id === botId);

  if (!currentBot || currentBot.isDead) return gameState;

  const botName = currentBot.name;
  const botChar = currentBot.character.name;
  const botAlignment = currentBot.character.alignment;

  // 1. GIAI ĐOẠN ĐỔ XÚC XẮC DI CHUYỂN
  if (updatedState.phase === "roll") {
    // Ultrasoul: đầu lượt gây 3 sát thương cho người ở Underworld Gate (loc_fountain)
    if (currentBot.alignmentRevealed && botChar.startsWith("Ultrasoul")) {
      const gateVictims = updatedState.players.filter(p =>
        p.id !== botId && !p.isDead && p.locationId === "loc_fountain"
      );
      gateVictims.forEach(victim => {
        updatedState.players = updatedState.players.map(p => {
          if (p.id !== victim.id) return p;
          const newHp = Math.max(0, p.currentHp - 3);
          const isDead = newHp <= 0;
          updatedState.logs = [
            createLog(`👻 [Hào Quang Địa Ngục] Ultrasoul [${botName}] gây 3 sát thương lên ${p.name} đang đứng ở Underworld Gate!`, "attack"),
            ...updatedState.logs
          ];
          if (isDead) {
            updatedState.logs = [
              createLog(`☠️ ${p.name} bị thiêu đốt bởi Hào Quang Địa Ngục! Thân phận: [${p.character.name}] - Phe [${p.character.alignment}].`, "reveal"),
              ...updatedState.logs
            ];
          }
          return { ...p, currentHp: newHp, isDead, alignmentRevealed: isDead ? true : p.alignmentRevealed };
        });
      });
      if (0 === gateVictims.length) {
        updatedState.logs = [
          createLog(`👻 [Hào Quang Địa Ngục] Không có ai đứng ở Underworld Gate, Ultrasoul [${botName}] không gây sát thương.`, "info"),
          ...updatedState.logs
        ];
      }
    }

    // Unknown: Bot không di chuyển (Nói dối - ẩn danh hoàn toàn, không cần lật thân phận)
    const canUseUnknown = botChar.startsWith("Unknown");
    const shouldMove = !canUseUnknown || Math.random() > 0.4;
    
    if (shouldMove) {
      // Emi có thể tự chọn di chuyển kề bên (chỉ áp dụng khi đã tiết lộ thân phận)
      let rollResult = rollForMovement();
      let chosenLocId = "";

      if (botChar.startsWith("Emi") && currentBot.alignmentRevealed && currentBot.locationId) {
        // Emi chọn di chuyển kề bên thay vì tung xúc xắc (50% cơ hội)
        if (Math.random() > 0.5) {
          const adjLocations: { [key: string]: string } = {
            loc_hermit: "loc_fountain",
            loc_fountain: "loc_hermit",
            loc_church: "loc_cemetery",
            loc_cemetery: "loc_church",
            loc_anvil: "loc_woods",
            loc_woods: "loc_anvil"
          };
          chosenLocId = adjLocations[currentBot.locationId];
          updatedState.logs = [
            createLog(`🏃 Bot Emi [${botName}] kích hoạt Dịch Chuyển Kề Bên, tự chọn sang ô cùng khu vực!`, "action"),
            ...updatedState.logs
          ];
        }
      }

      if (!chosenLocId) {
        if (rollResult.total === 7) {
          // Thích đi đâu thì đi, loại trừ ô hiện tại
          const otherLocs = LOCATIONS.filter(l => l.id !== currentBot.locationId);
          const chosen = otherLocs[Math.floor(Math.random() * otherLocs.length)];
          chosenLocId = chosen.id;
          updatedState.logs = [
            createLog(`🎲 Bot [${botName}] đổ ra số 7 may mắn! Tự chọn di chuyển đến ${chosen.name}.`, "action"),
            ...updatedState.logs
          ];
        } else {
          // Đi đến ô theo tổng
          let loc = getLocationByRoll(rollResult.total);
          // Reroll nếu trùng địa điểm cũ (theo luật boardgame)
          let attempts = 0;
          while (loc && loc.id === currentBot.locationId && attempts < 5) {
            rollResult = rollForMovement();
            loc = getLocationByRoll(rollResult.total);
            attempts++;
          }
          chosenLocId = loc ? loc.id : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].id;
        }
      }

      // Thực hiện di chuyển
      const finalLoc = LOCATIONS.find(l => l.id === chosenLocId)!;
      updatedState.players = updatedState.players.map(p => 
        p.id === botId ? { ...p, locationId: chosenLocId } : p
      );
      
      updatedState.rolledDice = rollResult;
    } else {
      updatedState.logs = [
        createLog(`🎭 Bot Unknown [${botName}] kích hoạt Nói Dối, ẩn mình tại chỗ mà không cần lộ thân phận!`, "action"),
        ...updatedState.logs
      ];
    }

    updatedState.phase = "action";
  }

  // 2. GIAI ĐOẠN HÀNH ĐỘNG ĐỊA ĐIỂM
  if (updatedState.phase === "action") {
    const locId = updatedState.players.find(p => p.id === botId)!.locationId;
    
    // Nếu chưa có vị trí (ví dụ lượt 1 không di chuyển), bỏ qua
    if (locId) {
      if ("loc_hermit" === locId) {
        const nonBotPlayers = updatedState.players.filter(p => !p.isBot && !p.isDead);
        const target = nonBotPlayers.length > 0 
          ? nonBotPlayers[Math.floor(Math.random() * nonBotPlayers.length)]
          : updatedState.players.filter(p => p.id !== botId && !p.isDead)[0];

        if (target) {
          const drawRes = drawCardFromDeck(updatedState, CardType.HERMIT);
          updatedState = drawRes.state;
          if (drawRes.cardId) {
            updatedState = applyHermitCard(updatedState, target.id, drawRes.cardId, botId);
          }
        }
      } 
      else if ("loc_fountain" === locId) {
        // Cổng Âm Phủ: Bot chọn 1 trong 3 bộ bài ngẫu nhiên để rút
        const rand = Math.random();
        const chosenDeckType = rand < 0.33 ? CardType.HERMIT : rand < 0.66 ? CardType.LIGHT : CardType.SHADOW;
        const drawRes = drawCardFromDeck(updatedState, chosenDeckType);
        updatedState = drawRes.state;
        if (drawRes.cardId) {
          if (CardType.HERMIT === chosenDeckType) {
            const nonBotPlayers = updatedState.players.filter(p => !p.isBot && !p.isDead);
            const target = nonBotPlayers.length > 0 
              ? nonBotPlayers[Math.floor(Math.random() * nonBotPlayers.length)]
              : updatedState.players.filter(p => p.id !== botId && !p.isDead)[0];
            if (target) {
              updatedState = applyHermitCard(updatedState, target.id, drawRes.cardId, botId);
            }
          } else {
            const card = getCardById(drawRes.cardId);
            if (card) {
              if (card.isEquipment) {
                updatedState = useGameCard(updatedState, card.id, botId);
              } else {
                let targetId: string | null = botId;
                if ("l_blessing" === card.id) {
                  const otherPlayers = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                  if (otherPlayers.length > 0) {
                    targetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
                  }
                } else if ("l_disenchant" === card.id || "l_firstaid" === card.id) {
                  const others = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                  if (others.length > 0) {
                    targetId = others[Math.floor(Math.random() * others.length)].id;
                  }
                } else if ("s_spider" === card.id || "s_doll" === card.id || card.id.startsWith("s_bat")) {
                  const enemies = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                  targetId = enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)].id : null;
                } else if ("s_banana" === card.id) {
                  const enemies = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                  if (enemies.length > 0) {
                    const victim = enemies[Math.floor(Math.random() * enemies.length)];
                    const myEquips = currentBot.equipments;
                    if (myEquips.length > 0) {
                      const toGive = myEquips[Math.floor(Math.random() * myEquips.length)];
                      targetId = `${victim.id}:${toGive}`;
                    } else {
                      targetId = victim.id;
                    }
                  }
                } else if (card.id.startsWith("s_goblin")) {
                  const enemiesWithEquips = updatedState.players.filter(p => p.id !== botId && !p.isDead && p.equipments.length > 0);
                  if (enemiesWithEquips.length > 0) {
                    const victim = enemiesWithEquips[Math.floor(Math.random() * enemiesWithEquips.length)];
                    const stolen = victim.equipments[Math.floor(Math.random() * victim.equipments.length)];
                    targetId = `${victim.id}:${stolen}`;
                  }
                }
                updatedState = useGameCard(updatedState, card.id, botId, targetId);
              }
            }
          }
        }
      } 
      else if ("loc_church" === locId) {
        // Rút lá Light
        const drawRes = drawCardFromDeck(updatedState, CardType.LIGHT);
        updatedState = drawRes.state;
        if (drawRes.cardId) {
          const card = getCardById(drawRes.cardId);
          if (card) {
            if (card.isEquipment) {
              updatedState = useGameCard(updatedState, card.id, botId);
            } else {
              let targetId: string | null = botId;
              if ("l_blessing" === card.id) {
                const otherPlayers = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                if (otherPlayers.length > 0) {
                  targetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
                }
              } else if ("l_disenchant" === card.id || "l_firstaid" === card.id) {
                const others = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                if (others.length > 0) {
                  targetId = others[Math.floor(Math.random() * others.length)].id;
                }
              }
              updatedState = useGameCard(updatedState, card.id, botId, targetId);
            }
          }
        }
      } 
      else if ("loc_cemetery" === locId) {
        // Rút lá Shadow
        const drawRes = drawCardFromDeck(updatedState, CardType.SHADOW);
        updatedState = drawRes.state;
        if (drawRes.cardId) {
          const card = getCardById(drawRes.cardId);
          if (card) {
            if (card.isEquipment) {
              updatedState = useGameCard(updatedState, card.id, botId);
            } else {
              let targetId: string | null = null;
              if ("s_spider" === card.id || "s_doll" === card.id || card.id.startsWith("s_bat")) {
                const enemies = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                targetId = enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)].id : null;
              } else if ("s_banana" === card.id) {
                const enemies = updatedState.players.filter(p => p.id !== botId && !p.isDead);
                if (enemies.length > 0) {
                  const victim = enemies[Math.floor(Math.random() * enemies.length)];
                  const myEquips = currentBot.equipments;
                  if (myEquips.length > 0) {
                    const toGive = myEquips[Math.floor(Math.random() * myEquips.length)];
                    targetId = `${victim.id}:${toGive}`;
                  } else {
                    targetId = victim.id;
                  }
                }
              } else if (card.id.startsWith("s_goblin")) {
                const enemiesWithEquips = updatedState.players.filter(p => p.id !== botId && !p.isDead && p.equipments.length > 0);
                if (enemiesWithEquips.length > 0) {
                  const victim = enemiesWithEquips[Math.floor(Math.random() * enemiesWithEquips.length)];
                  const stolen = victim.equipments[Math.floor(Math.random() * victim.equipments.length)];
                  targetId = `${victim.id}:${stolen}`;
                }
              }
              updatedState = useGameCard(updatedState, card.id, botId, targetId);
            }
          }
        }
      } 
      else if ("loc_anvil" === locId) {
        // Bàn Thờ Cổ: Bot cướp 1 trang bị ngẫu nhiên từ đối thủ ngẫu nhiên có trang bị
        const targetPlayers = updatedState.players.filter(p => p.id !== botId && !p.isDead && p.equipments.length > 0);
        if (targetPlayers.length > 0) {
          const victim = targetPlayers[Math.floor(Math.random() * targetPlayers.length)];
          const stolenCardId = victim.equipments[Math.floor(Math.random() * victim.equipments.length)];
          
          updatedState.players = updatedState.players.map(p => {
            if (p.id === victim.id) {
              return { ...p, equipments: p.equipments.filter(eqId => eqId !== stolenCardId) };
            }
            if (p.id === botId) {
              return { ...p, equipments: [...p.equipments, stolenCardId] };
            }
            return p;
          });

          const card = getCardById(stolenCardId);
          const cardName = card ? card.name : "Trang bị";
          updatedState.logs = [
            createLog(`🎒 [Bàn Thờ Cổ] Bot [${botName}] đã cướp trang bị [${cardName}] từ tay ${victim.name}!`, "action"),
            ...updatedState.logs
          ];
        } else {
          updatedState.logs = [
            createLog(`🎒 [Bàn Thờ Cổ] Không có ai sở hữu trang bị để Bot [${botName}] cướp!`, "info"),
            ...updatedState.logs
          ];
        }
      } 
      else if ("loc_woods" === locId) {
        // Rừng Rậm Kỳ Dị: Chọn hồi 1 HP hoặc gây 2 sát thương
        const currentHp = currentBot.currentHp;
        if (currentHp <= currentBot.character.hp - 3) {
          // Bot tự hồi máu cho mình
          updatedState.players = updatedState.players.map(p => 
            p.id === botId ? { ...p, currentHp: p.currentHp + 1 } : p
          );
          updatedState.logs = [
            createLog(`🌲 Rừng Rậm Kỳ Dị: Bot [${botName}] chọn HỒI 1 HP cứu chữa cho chính mình!`, "action"),
            ...updatedState.logs
          ];
        } else {
          // Gây 2 sát thương cho kẻ thù ngẫu nhiên
          const enemies = updatedState.players.filter(p => p.id !== botId && !p.isDead);
          if (enemies.length > 0) {
            const victim = enemies[Math.floor(Math.random() * enemies.length)];
            
            // Tìm vị trí của nạn nhân để trừ HP
            updatedState.players = updatedState.players.map(p => {
              if (p.id === victim.id) {
                if (p.equipments.includes("l_fortune")) {
                  updatedState.logs = [
                    createLog(`🛡️ [Cài Áo May Mắn] giúp ${p.name} kháng cự hoàn toàn sát thương Rừng Quái Dị từ Bot [${botName}]!`, "action"),
                    ...updatedState.logs
                  ];
                  return p;
                }
                const targetHp = Math.max(0, p.currentHp - 2);
                const isDead = targetHp <= 0;
                let logMsg = `🌲 Rừng Rậm Kỳ Dị: Bot [${botName}] triệu hồi gai độc tấn công gây 2 sát thương lên ${p.name}!`;
                
                if (isDead) {
                  logMsg += ` ☠️ ${p.name} đã chết vì gai độc! Thân phận: [${p.character.name}].`;
                }
                
                updatedState.logs = [createLog(logMsg, isDead ? "reveal" : "attack"), ...updatedState.logs];
                return { 
                  ...p, 
                  currentHp: targetHp, 
                  isDead, 
                  alignmentRevealed: isDead ? true : p.alignmentRevealed 
                };
              }
              return p;
            });
          }
        }
      }
    }

    // Tự động kích hoạt Allie cứu nguy nếu HP rất thấp và chưa dùng skill
    if (botChar.startsWith("Allie") && 3 >= currentBot.currentHp && !currentBot.hasUsedAbility && !currentBot.abilityDisabled) {
      updatedState = activateCharacterAbility(updatedState, botId);
    }
    // Tự động kích hoạt Franklin: D6 vào kẻ yếu nhất
    if (botChar.startsWith("Franklin") && !currentBot.hasUsedAbility && !currentBot.abilityDisabled) {
      const weakest = updatedState.players
        .filter(p => p.id !== botId && !p.isDead)
        .sort((a, b) => a.currentHp - b.currentHp)[0];
      if (weakest) {
        updatedState = activateCharacterAbility(updatedState, botId, weakest.id);
      }
    }
    // Tự động kích hoạt George: D4 vào kẻ yếu nhất
    if (botChar.startsWith("George") && !currentBot.hasUsedAbility && !currentBot.abilityDisabled) {
      const weakest = updatedState.players
        .filter(p => p.id !== botId && !p.isDead)
        .sort((a, b) => a.currentHp - b.currentHp)[0];
      if (weakest) {
        updatedState = activateCharacterAbility(updatedState, botId, weakest.id);
      }
    }
    // Tự động kích hoạt Ellen: phiếng ấn kỹ năng Shadow mạnh nhất
    if (botChar.startsWith("Ellen") && !currentBot.hasUsedAbility && !currentBot.abilityDisabled) {
      const shadowTarget = updatedState.players
        .filter(p => p.id !== botId && !p.isDead && p.character.alignment === Alignment.SHADOW && !p.abilityDisabled)
        .sort((a, b) => b.character.hp - a.character.hp)[0];
      const anyTarget = shadowTarget || updatedState.players.filter(p => p.id !== botId && !p.isDead && !p.abilityDisabled)[0];
      if (anyTarget) {
        updatedState = activateCharacterAbility(updatedState, botId, anyTarget.id);
      }
    }
    // Tự động kích hoạt Fuka: chọn Shadow HP cao nhất để phạt lượt sau
    if (botChar.startsWith("Fuka") && !currentBot.hasUsedAbility && !currentBot.abilityDisabled) {
      const shadowFoe = updatedState.players
        .filter(p => p.id !== botId && !p.isDead && p.character.alignment === Alignment.SHADOW)
        .sort((a, b) => b.currentHp - a.currentHp)[0];
      const anyFoe = shadowFoe || updatedState.players.filter(p => p.id !== botId && !p.isDead)[0];
      if (anyFoe) {
        updatedState = activateCharacterAbility(updatedState, botId, anyFoe.id);
      }
    }
    // Tự động kích hoạt Gregor: kích hoạt áo giáp nếu HP thấp
    if (botChar.startsWith("Gregor") && !currentBot.hasUsedAbility && !currentBot.abilityDisabled && currentBot.currentHp <= currentBot.character.hp - 4) {
      updatedState = activateCharacterAbility(updatedState, botId);
    }
    // Tự động kích hoạt Agnes đảo chiều thắng nếu HP thấp hoặc muộn vòng chơi
    if (botChar.startsWith("Agnes") && !currentBot.hasUsedAbility) {
      if (currentBot.currentHp <= 5 || (updatedState.roundNumber && updatedState.roundNumber >= 3)) {
        updatedState = activateCharacterAbility(updatedState, botId);
      }
    }
    // Tự động kích hoạt David đào mộ thánh tích từ thi thể người chết
    if (botChar.startsWith("David") && !currentBot.hasUsedAbility) {
      const deadWithEquips = updatedState.players.filter(p => p.isDead && p.equipments.length > 0);
      if (deadWithEquips.length > 0) {
        const victim = deadWithEquips[Math.floor(Math.random() * deadWithEquips.length)];
        const equip = victim.equipments[Math.floor(Math.random() * victim.equipments.length)];
        updatedState = activateCharacterAbility(updatedState, botId, `${victim.id}:${equip}`);
      }
    }
    // Tự động kích hoạt Wight lượt bổ sung nếu đã có người chết và chưa dùng skill
    if (botChar.startsWith("Wight") && !currentBot.hasUsedAbility) {
      const deadCount = updatedState.players.filter(p => p.isDead).length;
      if (0 < deadCount) {
        updatedState = activateCharacterAbility(updatedState, botId);
      }
    }

    updatedState.phase = "attack";
  }

  // 3. GIAI ĐOẠN TẤN CÔNG ĐỐI THỦ
  if (updatedState.phase === "attack") {
      const currentLoc = updatedState.players.find(p => p.id === botId)!.locationId;
      
      const hasHandgun = currentBot.equipments.includes("s_handgun");
      const attackableTargets = updatedState.players.filter(p => {
        if (p.id === botId || p.isDead) return false;
        const inSame = areLocationsInSameArea(currentLoc, p.locationId);
        return hasHandgun ? !inSame : inSame;
      });

      if (0 < attackableTargets.length && 1 !== updatedState.roundNumber) {
        // Ưu tiên tấn công kẻ địch đã tiết lộ danh tính tương khắc hoặc tấn công bừa nếu chưa biết vai trò
        let bestTarget = attackableTargets[0];
        
        const distinctEnemies = attackableTargets.filter(p => {
          if (!p.alignmentRevealed) return false;
          // Shadow muốn đánh Hunter, Hunter muốn đánh Shadow
          if (botAlignment === Alignment.SHADOW) return p.character.alignment === Alignment.HUNTER;
          if (botAlignment === Alignment.HUNTER) return p.character.alignment === Alignment.SHADOW;
          return false;
        });

        if (0 < distinctEnemies.length) {
          bestTarget = distinctEnemies[0];
        } else {
          // Chọn mục tiêu có ít HP nhất để dứt điểm
          bestTarget = [...attackableTargets].sort((a, b) => a.currentHp - b.currentHp)[0];
        }

        // Thực hiện tấn công
        updatedState = performAttack(updatedState, botId, bestTarget.id);

        // Kỹ năng chém đôi của Charles Neutral: tự nhận 2 sát thương để chém tiếp cùng mục tiêu!
        if (botChar.startsWith("Charles") && currentBot.alignmentRevealed && !currentBot.isDead) {
          const targetPlayer = updatedState.players.find(p => p.id === bestTarget.id);
          if (targetPlayer && !targetPlayer.isDead && currentBot.currentHp >= 4) {
            // Tự chịu 2 sát thương
            updatedState.players = updatedState.players.map(p => 
              p.id === botId ? { ...p, currentHp: p.currentHp - 2, isDead: p.currentHp - 2 <= 0 } : p
            );
            updatedState.logs = [
              createLog(`⚔️ [Chém Đôi Charles] Bot Charles [${botName}] tự chịu 2 sát thương để tung thêm một kiếm!`, "action"),
              ...updatedState.logs
            ];
            
            const updatedBot = updatedState.players.find(p => p.id === botId)!;
            if (!updatedBot.isDead) {
              updatedState = performAttack(updatedState, botId, bestTarget.id);
            } else {
              updatedState.logs = [
                createLog(`☠️ Bot Charles [${botName}] đã tự sát vì phản phản kích kiếm pháp!`, "reveal"),
                ...updatedState.logs
              ];
            }
          }
        }
    }

    // Kết thúc lượt của Bot, chuyển turn sang người chơi kế tiếp
    if (updatedState.phase !== "game_over") {
      const currentBotPlayer = updatedState.players[updatedState.turnIndex];
      
      if (currentBotPlayer.extraTurnCount && currentBotPlayer.extraTurnCount > 0 && !currentBotPlayer.isDead) {
        updatedState.players = updatedState.players.map(p => 
          p.id === currentBotPlayer.id 
            ? { ...p, extraTurnCount: p.extraTurnCount! - 1 } 
            : p
        );
        updatedState.phase = "roll";
        updatedState.rolledDice = null;
        updatedState.selectedCard = null;
        updatedState.lastAttackDamage = null;
        updatedState.drawnCardId = null;
        updatedState.showGateSelection = false;
        updatedState.selectedGateDeck = null;
        
        // lượt phụ - no log
      } else {
        let nextIndex = (updatedState.turnIndex + 1) % updatedState.players.length;
        while (updatedState.players[nextIndex].isDead) {
          nextIndex = (nextIndex + 1) % updatedState.players.length;
        }
        
        if (nextIndex < updatedState.turnIndex) {
          updatedState.roundNumber = (updatedState.roundNumber || 1) + 1;
        }

        updatedState.turnIndex = nextIndex;
        updatedState.phase = "roll";
        updatedState.rolledDice = null;
        updatedState.selectedPlayerIdForHermit = null;
        updatedState.selectedPlayerIdForAttack = null;
        updatedState.selectedCard = null;
        updatedState.lastAttackDamage = null;
        updatedState.drawnCardId = null;
        updatedState.showGateSelection = false;
        updatedState.selectedGateDeck = null;

        let nextPlayer = updatedState.players[nextIndex];
        
        // Hết hiệu lực bảo hộ của Guardian Angel khi bắt đầu lượt mới của mình
        if (nextPlayer.hasGuardianAngel) {
          updatedState.players = updatedState.players.map(p => 
            p.id === nextPlayer.id ? { ...p, hasGuardianAngel: false } : p
          );
          nextPlayer = updatedState.players[nextIndex];
          updatedState.logs = [
            createLog(`🛡️ [Thiên Thần Hộ Mệnh] Hết thời gian tác dụng, lá chắn bảo vệ của ${nextPlayer.name} biến mất.`, "info"),
            ...updatedState.logs
          ];
        }

        // Hết hiệu lực Gregor Shield khi bắt đầu lượt mới của mình
        if (nextPlayer.hasGregorShield) {
          updatedState.players = updatedState.players.map(p =>
            p.id === nextPlayer.id ? { ...p, hasGregorShield: false } : p
          );
          nextPlayer = updatedState.players[nextIndex];
          updatedState.logs = [
            createLog(`🛡️ [Áo Giáp Thép Gregor] lá chắn của ${nextPlayer.name} tan biến khi bước vào lượt mới.`, "info"),
            ...updatedState.logs
          ];
        }

        // Fuka: đầu lượt của target, đặt HP về max-7
        if (updatedState.fukaTargetId === nextPlayer.id && !nextPlayer.isDead) {
          const newHp = Math.max(0, nextPlayer.character.hp - 7);
          updatedState.players = updatedState.players.map(p =>
            p.id === nextPlayer.id ? { ...p, currentHp: newHp } : p
          );
          updatedState.fukaTargetId = null;
          updatedState.logs = [
            createLog(`⏳ [Trì Hoãn Thần Thời Fuka] Hiệu ứng kích hoạt! Sát thương của ${nextPlayer.name} bị đặt về 7 (HP còn lại: ${newHp}).`, "action"),
            ...updatedState.logs
          ];
        }

        // Catherine tự động hồi 1 HP khi bắt đầu lượt mới
        if (nextPlayer.character.name.startsWith("Catherine") && !nextPlayer.isDead) {
          const targetHp = Math.min(nextPlayer.character.hp, nextPlayer.currentHp + 1);
          if (targetHp > nextPlayer.currentHp) {
            updatedState.players = updatedState.players.map(p => 
              p.id === nextPlayer.id ? { ...p, currentHp: targetHp } : p
            );
            updatedState.logs = [
              createLog(`🌸 [Thiền Định Catherine] Nhà Chiêm Tinh [${nextPlayer.name}] bắt đầu lượt chơi và tự hồi phục 1 HP!`, "action"),
              ...updatedState.logs
            ];
          }
        }

        // Ultrasoul: đầu lượt gây 3 sát thương cho người ở Underworld Gate (loc_fountain) - player turn
        if (nextPlayer.character.name.startsWith("Ultrasoul") && !nextPlayer.isDead && !nextPlayer.isBot) {
          // Với người chơi thật, Ultrasoul effect được xử lý ở App.tsx khi bắt đầu lượt
          // Với Bot đã được xử lý ở giai đoạn roll ở trên
        }

        // chuyển lượt - no log
      }
    }
  }

  return updatedState;
}
