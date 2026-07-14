import React, { useState, useEffect, useRef } from "react";
import { Alignment, CardType, GameState, Player, Character } from "../types";
import { LOCATIONS, areLocationsInSameArea } from "../data/locations";
import { CHARACTERS, DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, getCardById, GameCard } from "../data/cards";
import { updateRoomState } from "../firebase";
import {
  initGame,
  assignCharactersForPlayers,
  rollForMovement,
  performAttack,
  applyHermitCard,
  useGameCard,
  activateCharacterAbility,
  executeBotTurn,
  createLog,
  checkVictory,
  drawCardFromDeck,
  checkUltrasoulTrap
} from "../utils/gameEngine";

interface UseGameplayParams {
  view: "lobby" | "waiting_room" | "character_select" | "playing";
  gameMode: "solo" | "multiplayer" | null;
  setGameMode: React.Dispatch<React.SetStateAction<"solo" | "multiplayer" | null>>;
  roomId: string | null;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  playerId: string;
  playerName: string;
  activeGame: GameState | null;
  setActiveGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  setView: React.Dispatch<React.SetStateAction<"lobby" | "waiting_room" | "character_select" | "playing">>;
  setLobbyInitialView: React.Dispatch<React.SetStateAction<"home" | "start">>;
  markLeavingVoluntarily: () => void;
}

export function useGameplay({
  view,
  gameMode,
  setGameMode,
  roomId,
  setRoomId,
  playerId,
  playerName,
  activeGame,
  setActiveGame,
  setView,
  setLobbyInitialView,
  markLeavingVoluntarily
}: UseGameplayParams) {
  // Dialog/Modal Visibility States
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedPlayerForInfo, setSelectedPlayerForInfo] = useState<Player | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [compassChoices, setCompassChoices] = useState<string[] | null>(null);
  const [showAbilityTargetDialog, setShowAbilityTargetDialog] = useState(false);
  const [showCharacterList, setShowCharacterList] = useState(false);
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [showCardList, setShowCardList] = useState(false);
  const [showCardHistory, setShowCardHistory] = useState(false);

  // Bot execution loop effects
  useEffect(() => {
    if (gameMode === "solo" && activeGame && "playing" === view) {
      const activePlayer = activeGame.players[activeGame.turnIndex];
      if (activePlayer && activePlayer.isBot && activeGame.phase !== "game_over") {
        const timer = setTimeout(() => {
          const updated = executeBotTurn(activeGame, activePlayer.id);
          setActiveGame(updated);
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGame, gameMode]);

  useEffect(() => {
    if (gameMode === "multiplayer" && roomId && activeGame && "playing" === view) {
      const activePlayer = activeGame.players[activeGame.turnIndex];
      if (activePlayer && activePlayer.isBot && activeGame.phase !== "game_over") {
        const isHost = (activeGame.hostId || activeGame.players[0]?.id) === playerId;
        if (isHost) {
          const timer = setTimeout(() => {
            const updated = executeBotTurn(activeGame, activePlayer.id);
            updateRoomState(roomId, updated);
          }, 1800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeGame, gameMode, roomId, playerId]);

  // Cảnh báo rời trang
  useEffect(() => {
    if ("multiplayer" === gameMode && null !== roomId) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Bạn có chắc chắn muốn rời khỏi trận đấu? Trận đấu vẫn đang diễn ra.";
        return e.returnValue;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [gameMode, roomId]);



  // Help calculate turn index safe guard
  const getTurnIndex = () => (activeGame ? activeGame.turnIndex : 0);

  // 1. Khởi tạo Game Solo
  const handleStartSoloGame = (selectedCharName?: string, playerCount: number = 3, selectedAlignment?: Alignment | "RANDOM") => {
    const initialPlayers = [
      { id: playerId, name: playerName || "Chiến binh vô danh", isBot: false }
    ];
    const initialGame = initGame(initialPlayers, selectedCharName, playerCount, selectedAlignment);
    setGameMode("solo");
    setActiveGame(initialGame);
    setView("playing");
  };

  // Helper: gán 2 lựa chọn nhân vật cho mỗi player, đảm bảo không trùng
  const generateCharacterOptions = (state: GameState): Player[] => {
    const count = state.players.length;
    const shadows = CHARACTERS.filter(c => c.alignment === Alignment.SHADOW);
    const hunters = CHARACTERS.filter(c => c.alignment === Alignment.HUNTER);
    const neutrals = CHARACTERS.filter(c => c.alignment === Alignment.NEUTRAL);

    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    let shadowCount = 1;
    let hunterCount = 1;
    let neutralCount = 1;

    if (4 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 0; }
    else if (5 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 1; }
    else if (6 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 2; }
    else if (7 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 1; }
    else if (8 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 2; }
    else if (9 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 3; }
    else if (10 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 4; }
    else if (11 === count) { shadowCount = 4; hunterCount = 4; neutralCount = 3; }
    else if (12 <= count) { shadowCount = 4; hunterCount = 4; neutralCount = 4; }

    // 1. Tạo danh sách các phe theo đúng cấu trúc cân bằng
    const alignmentList: Alignment[] = [];
    for (let i = 0; i < shadowCount; i++) alignmentList.push(Alignment.SHADOW);
    for (let i = 0; i < hunterCount; i++) alignmentList.push(Alignment.HUNTER);
    for (let i = 0; i < neutralCount; i++) alignmentList.push(Alignment.NEUTRAL);

    // Xáo trộn danh sách các phe để gán ngẫu nhiên cho người chơi
    const shuffledAlignments = shuffle(alignmentList);

    // 2. Tạo pool nhân vật riêng cho từng phe và xáo trộn
    const shadowPool = shuffle(shadows.map(c => c.name));
    const hunterPool = shuffle(hunters.map(c => c.name));
    const neutralPool = shuffle(neutrals.map(c => c.name));

    // 3. Phân phát tùy chọn cho người chơi
    const playersWithOptions: Player[] = [];

    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      const assignedAlignment = shuffledAlignments[i] || Alignment.NEUTRAL;

      let options: string[] = [];
      if (assignedAlignment === Alignment.SHADOW) {
        options = [shadowPool.pop()!, shadowPool.pop()!];
      } else if (assignedAlignment === Alignment.HUNTER) {
        options = [hunterPool.pop()!, hunterPool.pop()!];
      } else {
        options = [neutralPool.pop()!, neutralPool.pop()!];
      }

      playersWithOptions.push({
        ...p,
        character: {
          name: "Ẩn danh",
          alignment: Alignment.NEUTRAL,
          hp: 10,
          abilityName: "",
          abilityDesc: "",
          winCondition: ""
        },
        currentHp: 10,
        locationId: null,
        alignmentRevealed: false,
        equipments: [],
        drawnCards: [],
        isDead: false,
        characterOptions: options,
        characterChoice: null
      });
    }

    return playersWithOptions;
  };

  // 2. Khai cuộc Multiplayer (Phát nhân vật ngẫu nhiên & Cân bằng phe)
  const handleStartMultiplayerGame = async () => {
    if (null === activeGame || null === roomId) return;
    if (3 > activeGame.players.length) return;

    const count = activeGame.players.length;
    const shadows = CHARACTERS.filter(c => c.alignment === Alignment.SHADOW);
    const hunters = CHARACTERS.filter(c => c.alignment === Alignment.HUNTER);
    const neutrals = CHARACTERS.filter(c => c.alignment === Alignment.NEUTRAL);

    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    let shadowCount = 1;
    let hunterCount = 1;
    let neutralCount = 1;

    if (4 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 0; }
    else if (5 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 1; }
    else if (6 === count) { shadowCount = 2; hunterCount = 2; neutralCount = 2; }
    else if (7 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 1; }
    else if (8 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 2; }
    else if (9 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 3; }
    else if (10 === count) { shadowCount = 3; hunterCount = 3; neutralCount = 4; }
    else if (11 === count) { shadowCount = 4; hunterCount = 4; neutralCount = 3; }
    else if (12 <= count) { shadowCount = 4; hunterCount = 4; neutralCount = 4; }

    // 1. Tạo danh sách các phe theo đúng cấu trúc cân bằng
    const alignmentList: Alignment[] = [];
    for (let i = 0; i < shadowCount; i++) alignmentList.push(Alignment.SHADOW);
    for (let i = 0; i < hunterCount; i++) alignmentList.push(Alignment.HUNTER);
    for (let i = 0; i < neutralCount; i++) alignmentList.push(Alignment.NEUTRAL);

    // Xáo trộn danh sách các phe để gán ngẫu nhiên cho người chơi
    const shuffledAlignments = shuffle(alignmentList);

    // 2. Tạo pool nhân vật riêng cho từng phe và xáo trộn
    const shadowPool = shuffle(shadows);
    const hunterPool = shuffle(hunters);
    const neutralPool = shuffle(neutrals);

    // 3. Gán ngẫu nhiên 1 nhân vật từ phe tương ứng cho mỗi người chơi
    let updatedPlayers = activeGame.players.map((p, idx) => {
      const assignedAlignment = shuffledAlignments[idx] || Alignment.NEUTRAL;
      let character: Character;

      if (assignedAlignment === Alignment.SHADOW) {
        character = shadowPool.pop()!;
      } else if (assignedAlignment === Alignment.HUNTER) {
        character = hunterPool.pop()!;
      } else {
        character = neutralPool.pop()!;
      }

      return {
        ...p,
        character: { ...character },
        currentHp: character.hp,
        locationId: null,
        alignmentRevealed: false,
        equipments: [],
        drawnCards: [],
        isDead: false,
        characterOptions: undefined,
        characterChoice: undefined
      };
    });

    // Xáo trộn thứ tự người chơi để randomize turn order
    updatedPlayers = shuffle(updatedPlayers);

    const logs = [
      createLog("🔀 Thứ tự lượt chơi đã được xáo trộn ngẫu nhiên!", "system"),
      createLog("🎯 Trận đấu trực tuyến chính thức khai hỏa! Thân phận đã phân phát bí mật, trò chơi bắt đầu.", "system")
    ];

    const shuffleIds = (arr: GameCard[]): string[] => {
      return arr.map(c => c.id).sort(() => Math.random() - 0.5);
    };

    const nextState = {
      ...activeGame,
      players: updatedPlayers,
      logs,
      phase: "roll" as const,
      turnIndex: 0,
      hermitDeck: shuffleIds(DECK_HERMIT),
      hermitDiscard: [],
      lightDeck: shuffleIds(DECK_LIGHT),
      lightDiscard: [],
      shadowDeck: shuffleIds(DECK_SHADOW),
      shadowDiscard: [],
      drawnCardId: null,
      showGateSelection: false,
      selectedGateDeck: null,
      winnerAlignment: null,
      winnerPlayerIds: null
    };

    await updateRoomState(roomId, nextState);
  };

  // Helper: khởi tạo game thật sự sau khi tất cả đã chọn nhân vật
  const finalizeGameStart = async (state: GameState) => {
    if (!roomId) return;

    // Xác định nhân vật thực tế từ lựa chọn
    let updatedPlayers = state.players.map(p => {
      const charName = p.characterChoice || p.characterOptions![0];
      const character = CHARACTERS.find(c => c.name === charName)!;
      return {
        ...p,
        character: { ...character },
        currentHp: character.hp,
        locationId: null,
        alignmentRevealed: false,
        equipments: [],
        drawnCards: [],
        isDead: false,
        characterOptions: undefined,
        characterChoice: undefined
      };
    });

    // Xáo trộn thứ tự người chơi để randomize turn order
    updatedPlayers = [...updatedPlayers].sort(() => Math.random() - 0.5);

    const logs = [
      createLog("🔀 Thứ tự lượt chơi đã được xáo trộn ngẫu nhiên!", "system"),
      createLog("🎯 Trận đấu trực tuyến chính thức khai hỏa! Thân phận đã phân phát bí mật, trò chơi bắt đầu.", "system")
    ];

    const shuffleIds = (arr: GameCard[]): string[] => {
      return arr.map(c => c.id).sort(() => Math.random() - 0.5);
    };

    const nextState = {
      ...state,
      players: updatedPlayers,
      logs,
      phase: "roll" as const,
      turnIndex: 0,
      hermitDeck: shuffleIds(DECK_HERMIT),
      hermitDiscard: [],
      lightDeck: shuffleIds(DECK_LIGHT),
      lightDiscard: [],
      shadowDeck: shuffleIds(DECK_SHADOW),
      shadowDiscard: [],
      drawnCardId: null,
      showGateSelection: false,
      selectedGateDeck: null,
      winnerAlignment: null,
      winnerPlayerIds: null
    };

    await updateRoomState(roomId, nextState);
  };

  // Hàm xác nhận chọn nhân vật
  const handleConfirmCharacter = async (characterName: string) => {
    if (!activeGame || !roomId) return;

    const nextState = {
      ...activeGame,
      players: activeGame.players.map(p =>
        p.id === playerId
          ? { ...p, characterChoice: characterName }
          : p
      ),
    };

    // Kiểm tra nếu tất cả đã chọn (kể cả bot)
    const allChosen = nextState.players.every(p => p.characterChoice !== null && p.characterChoice !== undefined);
    if (allChosen) {
      await finalizeGameStart(nextState);
    } else {
      await updateRoomState(roomId, nextState);
    }
  };

  // Bot tự động chọn nhân vật
  useEffect(() => {
    if (gameMode === "multiplayer" && roomId && activeGame && "character_select" === activeGame.phase) {
      const isHost = (activeGame.hostId || activeGame.players[0]?.id) === playerId;
      const botsUnchosen = activeGame.players.filter(p => p.isBot && (p.characterChoice === null || p.characterChoice === undefined));
      if (isHost && botsUnchosen.length > 0) {
        const timer = setTimeout(async () => {
          let nextState = { ...activeGame };
          for (const bot of botsUnchosen) {
            const options = bot.characterOptions || [];
            const pick = options[Math.floor(Math.random() * options.length)] || null;
            nextState = {
              ...nextState,
              players: nextState.players.map(p =>
                p.id === bot.id ? { ...p, characterChoice: pick } : p
              ),
            };
          }
          const allChosen = nextState.players.every(p => p.characterChoice !== null && p.characterChoice !== undefined);
          if (allChosen) {
            await finalizeGameStart(nextState);
          } else {
            await updateRoomState(roomId, nextState);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGame, gameMode, roomId, playerId]);

  // 3. Đổ xúc xắc di chuyển
  const handleRollMove = () => {
    if (null === activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];

    nextState.diceAnimState = null;

    // Emi: Dịch chuyển tức thời khi đã lộ diện và không bị khóa kỹ năng (Yoda style)
    if (currentPlayer.character.name.startsWith("Emi") && true === currentPlayer.alignmentRevealed && true !== currentPlayer.abilityDisabled) {
      const rollResult = { total: 7, d6: 4, d4: 3 };
      nextState.rolledDice = rollResult;

      setShowLocationChoice(true);
      setCompassChoices(null);

      nextState.logs = [
        createLog(`🎲 Emi [${currentPlayer.name}] kích hoạt Nữ Thần Không Gian! Tung xúc xắc luôn ra số 7 may mắn, tự do chọn địa điểm di chuyển.`, "action"),
        ...nextState.logs
      ];

      if ("solo" === gameMode) {
        setActiveGame(nextState);
      } else if (null !== roomId) {
        updateRoomState(roomId, nextState);
      }
      return;
    }

    if (currentPlayer.equipments.includes("l_compass")) {
      const roll1 = rollForMovement();
      let roll2 = rollForMovement();
      while (roll2.total === roll1.total) {
        roll2 = rollForMovement();
      }

      let loc1 = LOCATIONS.find(l => l.rollValues.includes(roll1.total)) || null;
      let targetLocId1 = loc1 ? loc1.id : LOCATIONS[0].id;
      if (targetLocId1 === currentPlayer.locationId) {
        let attempts = 0;
        let finalRoll = roll1;
        while (loc1 && loc1.id === currentPlayer.locationId && attempts < 5) {
          finalRoll = rollForMovement();
          loc1 = LOCATIONS.find(l => l.rollValues.includes(finalRoll.total)) || null;
          attempts++;
        }
        targetLocId1 = loc1 ? loc1.id : LOCATIONS[0].id;
        roll1.total = finalRoll.total;
      }

      let loc2 = LOCATIONS.find(l => l.rollValues.includes(roll2.total)) || null;
      let targetLocId2 = loc2 ? loc2.id : LOCATIONS[0].id;
      if (targetLocId2 === currentPlayer.locationId) {
        let attempts = 0;
        let finalRoll = roll2;
        while (loc2 && loc2.id === currentPlayer.locationId && attempts < 5) {
          finalRoll = rollForMovement();
          loc2 = LOCATIONS.find(l => l.rollValues.includes(finalRoll.total)) || null;
          attempts++;
        }
        targetLocId2 = loc2 ? loc2.id : LOCATIONS[0].id;
        roll2.total = finalRoll.total;
      }

      setCompassChoices([targetLocId1, targetLocId2]);
      setShowLocationChoice(true);

      const locName1 = LOCATIONS.find(l => l.id === targetLocId1)?.name;
      const locName2 = LOCATIONS.find(l => l.id === targetLocId2)?.name;

      nextState.logs = [
        createLog(`🧭 [La Bàn Thần Bí] của ${currentPlayer.name} kích hoạt! Vui lòng chọn di chuyển giữa [${locName1}] (xúc xắc: ${roll1.total}) hoặc [${locName2}] (xúc xắc: ${roll2.total}).`, "action"),
        ...nextState.logs
      ];

      if ("solo" === gameMode) {
        setActiveGame(nextState);
      } else if (null !== roomId) {
        updateRoomState(roomId, nextState);
      }
      return;
    }

    const rollResult = rollForMovement();
    if (7 === rollResult.total) {
      nextState.rolledDice = rollResult;
      nextState.logs = [
        createLog(`🎲 ${currentPlayer.name} đã tung xúc xắc ra số 7 may mắn! Vui lòng chọn địa điểm di chuyển tự do.`, "action"),
        ...nextState.logs
      ];
      setShowLocationChoice(true);

      if ("solo" === gameMode) {
        setActiveGame(nextState);
      } else if (null !== roomId) {
        updateRoomState(roomId, nextState);
      }
    } else {
      let loc = LOCATIONS.find(l => l.rollValues.includes(rollResult.total)) || null;
      let targetLocId = loc ? loc.id : LOCATIONS[0].id;

      if (targetLocId === currentPlayer.locationId) {
        let attempts = 0;
        let finalRoll = rollResult;
        while (loc && loc.id === currentPlayer.locationId && attempts < 5) {
          finalRoll = rollForMovement();
          loc = LOCATIONS.find(l => l.rollValues.includes(finalRoll.total)) || null;
          attempts++;
        }
        targetLocId = loc ? loc.id : LOCATIONS[0].id;
        rollResult.total = finalRoll.total;
        rollResult.d6 = finalRoll.d6;
        rollResult.d4 = finalRoll.d4;
      }

      const finalLoc = LOCATIONS.find(l => l.id === targetLocId)!;

      nextState.players = nextState.players.map(p =>
        p.id === currentPlayer.id ? { ...p, locationId: targetLocId } : p
      );
      nextState = checkUltrasoulTrap(nextState, currentPlayer.id, targetLocId);
      nextState.rolledDice = rollResult;
      nextState.phase = "action";
      nextState.drawnCardId = null;
      nextState.showGateSelection = false;

      let drawnCardId: string | null = null;
      let deckType: CardType | null = null;

      if ("loc_hermit" === targetLocId) {
        deckType = CardType.HERMIT;
        const drawRes = drawCardFromDeck(nextState, CardType.HERMIT);
        nextState = drawRes.state;
        drawnCardId = drawRes.cardId;
      } else if ("loc_fountain" === targetLocId) {
        nextState.showGateSelection = true;
      } else if ("loc_church" === targetLocId) {
        deckType = CardType.LIGHT;
        const drawRes = drawCardFromDeck(nextState, CardType.LIGHT);
        nextState = drawRes.state;
        drawnCardId = drawRes.cardId;
      } else if ("loc_cemetery" === targetLocId) {
        deckType = CardType.SHADOW;
        const drawRes = drawCardFromDeck(nextState, CardType.SHADOW);
        nextState = drawRes.state;
        drawnCardId = drawRes.cardId;
      }

      if (null !== drawnCardId && null !== deckType) {
        nextState.drawnCardId = drawnCardId;
        nextState.players = nextState.players.map(p =>
          p.id === currentPlayer.id
            ? { ...p, drawnCards: [...(p.drawnCards || []), drawnCardId] }
            : p
        );
        const card = getCardById(drawnCardId);
        const cardName = card ? card.name : "thẻ bài";
        if (CardType.HERMIT === deckType) {
          nextState.logs = [
            createLog(`🏃 ${currentPlayer.name} di chuyển đến [${finalLoc.name}].`, "info"),
            ...nextState.logs
          ];
        } else {
          nextState.logs = [
            createLog(`🗃️ ${currentPlayer.name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.LIGHT === deckType ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
            createLog(`🏃 ${currentPlayer.name} di chuyển đến [${finalLoc.name}].`, "info"),
            ...nextState.logs
          ];
        }
      } else {
        nextState.logs = [
          createLog(`🏃 ${currentPlayer.name} di chuyển đến [${finalLoc.name}].`, "info"),
          ...nextState.logs
        ];
      }

      if ("solo" === gameMode) {
        setActiveGame(nextState);
      } else if (null !== roomId) {
        updateRoomState(roomId, nextState);
      }
    }
  };

  // 4. Lựa chọn địa điểm (Compass / 7 / s5 / Emi)
  const handleLocationChoice = (locId: string) => {
    if (null === activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    const finalLoc = LOCATIONS.find(l => l.id === locId)!;

    nextState.players = nextState.players.map(p =>
      p.id === currentPlayer.id ? { ...p, locationId: locId } : p
    );
    nextState = checkUltrasoulTrap(nextState, currentPlayer.id, locId);

    nextState.phase = "action";
    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    let drawnCardId: string | null = null;
    let deckType: CardType | null = null;

    if ("loc_hermit" === locId) {
      deckType = CardType.HERMIT;
      const drawRes = drawCardFromDeck(nextState, CardType.HERMIT);
      nextState = drawRes.state;
      drawnCardId = drawRes.cardId;
    } else if ("loc_fountain" === locId) {
      nextState.showGateSelection = true;
    } else if ("loc_church" === locId) {
      deckType = CardType.LIGHT;
      const drawRes = drawCardFromDeck(nextState, CardType.LIGHT);
      nextState = drawRes.state;
      drawnCardId = drawRes.cardId;
    } else if ("loc_cemetery" === locId) {
      deckType = CardType.SHADOW;
      const drawRes = drawCardFromDeck(nextState, CardType.SHADOW);
      nextState = drawRes.state;
      drawnCardId = drawRes.cardId;
    }

    const isCompassMove = null !== compassChoices;
    const isEmiTeleport = currentPlayer.character.name.startsWith("Emi") && true === currentPlayer.alignmentRevealed && true !== currentPlayer.abilityDisabled;

    let logAction = `🏃 ${currentPlayer.name} quyết định di chuyển đến [${finalLoc.name}].`;
    if (isCompassMove) {
      logAction = `🧭 ${currentPlayer.name} sử dụng La Bàn Thần Bí di chuyển đến [${finalLoc.name}].`;
    } else if (isEmiTeleport) {
      logAction = `🔮 ${currentPlayer.name} kích hoạt Dịch Chuyển Tức Thời, di chuyển đến [${finalLoc.name}].`;
    }

    if (null !== drawnCardId && null !== deckType) {
      nextState.drawnCardId = drawnCardId;
      nextState.players = nextState.players.map(p =>
        p.id === currentPlayer.id
          ? { ...p, drawnCards: [...(p.drawnCards || []), drawnCardId] }
          : p
      );
      const card = getCardById(drawnCardId);
      const cardName = card ? card.name : "thẻ bài";
      if (CardType.HERMIT === deckType) {
        nextState.logs = [
          createLog(logAction, "info"),
          ...nextState.logs
        ];
      } else {
        nextState.logs = [
          createLog(`🗃️ ${currentPlayer.name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.LIGHT === deckType ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
          createLog(logAction, "info"),
          ...nextState.logs
        ];
      }
    } else {
      nextState.logs = [
        createLog(logAction, "info"),
        ...nextState.logs
      ];
    }

    setShowLocationChoice(false);
    setCompassChoices(null);

    if ("solo" === gameMode) {
      setActiveGame(nextState);
    } else if (null !== roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 5. Chọn cọc bài tại Cổng Bóng Tối
  const handleSelectGateDeck = (type: CardType) => {
    if (!activeGame) return;
    const drawRes = drawCardFromDeck(activeGame, type);
    let nextState = drawRes.state;
    const drawnCardId = drawRes.cardId;

    if (drawnCardId) {
      const card = getCardById(drawnCardId);
      const cardName = card ? card.name : "thẻ bài";
      nextState.drawnCardId = drawnCardId;
      nextState.players = nextState.players.map(p =>
        p.id === activeGame.players[activeGame.turnIndex].id
          ? { ...p, drawnCards: [...(p.drawnCards || []), drawnCardId] }
          : p
      );
      nextState.selectedGateDeck = type;
      nextState.logs = [
        createLog(`🗃️ [Cổng Bóng Tối] ${activeGame.players[activeGame.turnIndex].name} rút thẻ bài [${cardName}] thuộc bộ bài ${type === CardType.HERMIT ? "Ẩn Sĩ" : type === CardType.LIGHT ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
        ...nextState.logs
      ];
    }

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 6. Tấn công người chơi
  const handleAttackPlayer = (targetId: string, georgeAbility?: boolean) => {
    if (!activeGame) return;
    const currentPlayer = activeGame.players[getTurnIndex()];
    let nextState = { ...activeGame };

    const isCharles = currentPlayer.character.name.startsWith("Charles") && currentPlayer.alignmentRevealed && !currentPlayer.abilityDisabled;
    const hasAlreadyAttackedThisTurn = activeGame.lastAttackDamage !== null;

    if (isCharles && hasAlreadyAttackedThisTurn) {
      nextState.players = nextState.players.map(p => {
        if (p.id === currentPlayer.id) {
          const nextHp = Math.max(0, p.currentHp - 2);
          const isDead = nextHp <= 0;
          return {
            ...p,
            currentHp: nextHp,
            isDead
          };
        }
        return p;
      });
      nextState.logs = [
        createLog(`⚔️ [Chém Đôi Charles] Charles [${currentPlayer.name}] tự nhận 2 sát thương để tung thêm một kiếm!`, "action"),
        ...nextState.logs
      ];

      const updatedCharles = nextState.players.find(p => p.id === currentPlayer.id)!;
      if (updatedCharles.isDead) {
        nextState.logs = [
          createLog(`☠️ Charles [${currentPlayer.name}] đã gục ngã vì phản lực kiếm pháp!`, "reveal"),
          ...nextState.logs
        ];
        if (nextState.phase !== "game_over") {
          nextState = endTurnTransition(nextState);
        }
        if (gameMode === "solo") {
          setActiveGame(nextState);
        } else if (roomId) {
          updateRoomState(roomId, nextState);
        }
        return;
      }
    }

    if (georgeAbility) {
      nextState = activateCharacterAbility(nextState, currentPlayer.id, targetId);
    }
    nextState = performAttack(nextState, currentPlayer.id, targetId);

    const checkCharles = nextState.players.find(p => p.id === currentPlayer.id)!;
    const canCharlesStrikeAgain = checkCharles.character.name.startsWith("Charles") && checkCharles.alignmentRevealed && !checkCharles.isDead && !checkCharles.abilityDisabled;

    if (canCharlesStrikeAgain && "game_over" !== nextState.phase) {
      nextState.logs = [
        createLog(`⚔️ [Chém Đôi Charles] Bạn có thể chọn tấn công tiếp mục tiêu bằng cách tự chịu 2 sát thương, hoặc click KẾT THÚC LƯỢT.`, "action"),
        ...nextState.logs
      ];
    } else {
      if (nextState.phase !== "game_over") {
        nextState = endTurnTransition(nextState);
      }
    }

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 7. Sử dụng Thẻ bài vừa rút
  const handleUseCard = (cardId: string, targetPlayerId: string | null) => {
    if (!activeGame) return;
    const currentPlayer = activeGame.players[activeGame.turnIndex];
    let nextState = { ...activeGame };

    if (cardId.startsWith("h")) {
      nextState = applyHermitCard(nextState, targetPlayerId!, cardId, currentPlayer.id);
    } else {
      nextState = useGameCard(nextState, cardId, currentPlayer.id, targetPlayerId);
    }

    if (cardId === "s5") {
      setShowLocationChoice(true);
    } else {
      if (nextState.phase !== "game_over") {
        if (hasAttackableTargets(nextState)) {
          nextState.phase = "attack" as const;
        } else {
          nextState = endTurnTransition(nextState);
        }
      }
    }

    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 8. Bỏ qua sử dụng thẻ bài
  const handleCancelCard = () => {
    if (!activeGame) return;
    let nextState = { ...activeGame };

    if (nextState.drawnCardId) {
      const card = getCardById(nextState.drawnCardId);
      if (card) {
        if (CardType.HERMIT === card.type) {
          nextState.hermitDiscard = [...(nextState.hermitDiscard || []), card.id];
        } else if (CardType.LIGHT === card.type) {
          nextState.lightDiscard = [...(nextState.lightDiscard || []), card.id];
        } else if (CardType.SHADOW === card.type) {
          nextState.shadowDiscard = [...(nextState.shadowDiscard || []), card.id];
        }
      }
    }

    if (hasAttackableTargets(nextState)) {
      nextState.phase = "attack" as const;
    } else {
      nextState = endTurnTransition(nextState);
    }

    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 9. Sử dụng Rừng Rậm Kỳ Dị
  const handleUseWeirdWoods = (targetId: string, action: "heal" | "damage") => {
    if (!activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    const target = nextState.players.find(p => p.id === targetId)!;

    if (action === "heal") {
      nextState.players = nextState.players.map(p =>
        p.id === targetId ? { ...p, currentHp: Math.min(p.character.hp, p.currentHp + 1) } : p
      );
      nextState.logs = [
        createLog(`🌲 Rừng Rậm Kỳ Dị: ${currentPlayer.name} triệu hồi thảo dược hồi phục 1 HP cứu chữa cho ${target.name}!`, "action"),
        ...nextState.logs
      ];
    } else {
      if (target.equipments.includes("l_fortune")) {
        nextState.logs = [
          createLog(`🛡️ [Cài Áo May Mắn] giúp ${target.name} kháng cự hoàn toàn sát thương từ Rừng Quái Dị!`, "action"),
          ...nextState.logs
        ];
      } else {
        nextState.players = nextState.players.map(p => {
          if (p.id === targetId) {
            const nextHp = Math.max(0, p.currentHp - 2);
            const isDead = nextHp <= 0;
            let logMsg = `🌲 Rừng Rậm Kỳ Dị: ${currentPlayer.name} điều khiển gai rừng tấn công gây 2 sát thương lên ${p.name}!`;
            if (isDead) {
              logMsg += ` ☠️ ${p.name} đã tử vong! Thân phận thật: [${p.character.name}].`;
            }
            nextState.logs = [createLog(logMsg, isDead ? "reveal" : "attack"), ...nextState.logs];
            return {
              ...p,
              currentHp: nextHp,
              isDead,
              alignmentRevealed: isDead ? true : p.alignmentRevealed
            };
          }
          return p;
        });
      }
    }

    if (hasAttackableTargets(nextState)) {
      nextState.phase = "attack" as const;
    } else {
      nextState = endTurnTransition(nextState);
    }

    const victoryResult = checkVictory(nextState.players);
    if (null !== victoryResult) {
      nextState.phase = "game_over" as const;
      nextState.winnerAlignment = victoryResult.winnerAlignment;
      nextState.winnerPlayerIds = victoryResult.winnerPlayerIds;
      nextState.players = nextState.players.map(p => ({ ...p, alignmentRevealed: true }));
      nextState.logs = [
        createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Chiến thắng thuộc về phe: ${victoryResult.winnerAlignment.join(", ")}!`, "system"),
        ...nextState.logs
      ];
    }

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 10. Kích hoạt Kỹ năng David
  const handleActivateDavidAbility = (targetId: string, cardId: string) => {
    if (!activeGame) return;
    const next = activateCharacterAbility(activeGame, playerId, `${targetId}:${cardId}`);

    if (gameMode === "solo") {
      setActiveGame(next);
    } else if (roomId) {
      updateRoomState(roomId, next);
    }
  };

  // 11. Tiết lộ danh tính / kích hoạt kỹ năng
  const handleRevealIdentity = (targetPlayerId?: string) => {
    if (null === activeGame) {
      return;
    }
    const currentPlayer = activeGame.players[getTurnIndex()];
    const charName = currentPlayer.character.name;

    const needsTarget = charName.startsWith("Fuka") || charName.startsWith("Franklin") || charName.startsWith("Ellen") || charName.startsWith("George") || charName.startsWith("Mganga") || charName.startsWith("Helen");
    
    if (needsTarget && !targetPlayerId && !currentPlayer.hasUsedAbility && !currentPlayer.abilityDisabled) {
      setShowAbilityTargetDialog(true);
      return;
    }

    let nextState = activateCharacterAbility(activeGame, currentPlayer.id, targetPlayerId);

    if ("solo" === gameMode) {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 12. Cướp trang bị ở Bàn Thờ Cổ
  const handleStealEquipment = (targetPlayerId: string, cardId: string) => {
    if (!activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    const targetPlayer = nextState.players.find(p => p.id === targetPlayerId);

    if (!targetPlayer) return;

    const targetEquipments = targetPlayer.equipments.filter(id => id !== cardId);
    const currentEquipments = [...currentPlayer.equipments, cardId];

    nextState.players = nextState.players.map(p => {
      if (p.id === targetPlayer.id) {
        return { ...p, equipments: targetEquipments };
      }
      if (p.id === currentPlayer.id) {
        return { ...p, equipments: currentEquipments };
      }
      return p;
    });

    const card = getCardById(cardId);
    const cardName = card ? card.name : "Trang bị";

    nextState.logs = [
      createLog(`🎒 [Bàn Thờ Cổ] ${currentPlayer.name} đã cướp trang bị [${cardName}] từ tay ${targetPlayer.name}!`, "action"),
      ...nextState.logs
    ];

    if (hasAttackableTargets(nextState)) {
      nextState.phase = "attack" as const;
    } else {
      nextState = endTurnTransition(nextState);
    }

    if ("solo" === gameMode) {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 13. Kết thúc lượt chơi
  const handleEndTurn = () => {
    if (!activeGame) return;
    let nextState = { ...activeGame };
    nextState = endTurnTransition(nextState);

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 14. Đóng thẻ xem trộm
  const handleCloseIdentityShown = () => {
    if (!activeGame) return;
    const nextState = {
      ...activeGame,
      hermitTargetIdentityShown: null
    };
    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // 15. Quay trở lại từ màn hình kết thúc game
  const handleReturnFromGameOver = async () => {
    if (!activeGame) return;

    if ("solo" === gameMode) {
      setView("lobby");
      setLobbyInitialView("home");
      setGameMode(null);
      setRoomId(null);
      setActiveGame(null);
    } else if ("multiplayer" === gameMode && roomId) {
      const isHost = playerId === (activeGame.hostId || activeGame.players[0]?.id);
      if (isHost) {
        const resetPlayers = activeGame.players.map(p => ({
          id: p.id,
          name: p.name,
          isBot: p.isBot,
          color: p.color,
          character: {
            name: "Ẩn danh",
            alignment: Alignment.NEUTRAL,
            hp: 10,
            abilityName: "",
            abilityDesc: "",
            winCondition: ""
          },
          currentHp: 10,
          locationId: null,
          alignmentRevealed: false,
          equipments: [],
          drawnCards: [],
          isDead: false
        }));

        const lobbyState: GameState = {
          ...activeGame,
          phase: "lobby" as const,
          rolledDice: null,
          drawnCardId: null,
          showGateSelection: false,
          selectedGateDeck: null,
          winnerAlignment: null,
          winnerPlayerIds: null,
          players: resetPlayers,
          logs: [
            createLog("🔄 Trận đấu kết thúc. Trở lại phòng chờ trực tuyến!"),
          ]
        };
        await updateRoomState(roomId, lobbyState);
      }
      setView("waiting_room");
    }
  };

  // 16. Hủy phòng bởi Host
  const handleCancelRoomByHost = async () => {
    if ("multiplayer" === gameMode && null !== roomId && null !== activeGame) {
      const cancelledGame = {
        ...activeGame,
        phase: "cancelled" as const,
        logs: [
          createLog(`🚨 Chủ phòng ${playerName} đã hủy phòng / kết thúc trận đấu.`),
          ...activeGame.logs
        ]
      };
      await updateRoomState(roomId, cancelledGame);
    }

    setView("lobby");
    setLobbyInitialView("start");
    setGameMode(null);
    setRoomId(null);
    setActiveGame(null);
  };

  // 17. Thoát khỏi phòng
  const handleLeaveGame = async () => {
    const isSolo = "solo" === gameMode;
    if ("multiplayer" === gameMode && null !== roomId && null !== activeGame) {
      const isHost = playerId === (activeGame.hostId || activeGame.players[0]?.id);
      if (true === isHost) {
        await handleCancelRoomByHost();
        return;
      }

      const updatedPlayers = activeGame.players.filter(p => p.id !== playerId);
      if (0 < updatedPlayers.length) {
        markLeavingVoluntarily();
        const nextState = {
          ...activeGame,
          players: updatedPlayers,
          logs: [
            createLog(`👋 ${playerName} đã rời khỏi phòng chơi.`),
            ...activeGame.logs
          ]
        };
        await updateRoomState(roomId, nextState);
      }
    }

    setView("lobby");
    setLobbyInitialView(isSolo ? "home" : "start");
    setGameMode(null);
    setRoomId(null);
    setActiveGame(null);
  };

  // Helper cho kiểm tra mục tiêu tấn công được
  const hasAttackableTargets = (state: GameState): boolean => {
    const player = state.players[state.turnIndex];
    if (state.roundNumber === 1 || !player.locationId) return false;
    const hasHandgun = player.equipments.includes("s_handgun");
    return state.players.some(p => {
      if (p.id === player.id || p.isDead || !p.locationId) return false;
      const inSame = areLocationsInSameArea(player.locationId, p.locationId);
      return hasHandgun ? !inSame : inSame;
    });
  };

  // Helper kết thúc lượt chơi
  const endTurnTransition = (state: GameState): GameState => {
    const nextState = { ...state };
    const currentPlayer = nextState.players[nextState.turnIndex];

    if (currentPlayer.extraTurnCount && currentPlayer.extraTurnCount > 0 && !currentPlayer.isDead) {
      nextState.players = nextState.players.map(p =>
        p.id === currentPlayer.id
          ? { ...p, extraTurnCount: p.extraTurnCount! - 1 }
          : p
      );
      nextState.phase = "roll" as const;
      nextState.rolledDice = null;
      nextState.selectedCard = null;
      nextState.lastAttackDamage = null;
      nextState.lastAttackDice = null;
      nextState.drawnCardId = null;
      nextState.showGateSelection = false;
      nextState.selectedGateDeck = null;

      return nextState;
    }

    let nextIndex = (nextState.turnIndex + 1) % nextState.players.length;

    while (nextState.players[nextIndex].isDead) {
      nextIndex = (nextIndex + 1) % nextState.players.length;
    }

    if (nextIndex < nextState.turnIndex) {
      nextState.roundNumber = (nextState.roundNumber || 1) + 1;

      // Mganga poison ticks each round
      const poisonedPlayers = nextState.players.filter(p => p.mgangaPoisoned && !p.isDead);
      poisonedPlayers.forEach(victim => {
        const newHp = Math.max(0, victim.currentHp - 1);
        const isDead = newHp <= 0;
        nextState.players = nextState.players.map(p =>
          p.id === victim.id ? { ...p, currentHp: newHp, isDead, alignmentRevealed: isDead ? true : p.alignmentRevealed } : p
        );
        nextState.logs = [
          createLog(`☠️ [Độc Dược Mganga] ${victim.name} chịu 1 sát thương từ độc!${isDead ? ` 💀 ${victim.name} tử trận! Thân phận: [${victim.character.name}] - Phe [${victim.character.alignment}].` : ""}`, "attack"),
          ...nextState.logs
        ];
      });

      if (poisonedPlayers.some(p => {
        const newHp = Math.max(0, p.currentHp - 1);
        return newHp <= 0;
      })) {
        const victoryResult = checkVictory(nextState.players);
        if (null !== victoryResult) {
          nextState.phase = "game_over";
          nextState.winnerAlignment = victoryResult.winnerAlignment;
          nextState.winnerPlayerIds = victoryResult.winnerPlayerIds;
          nextState.players = nextState.players.map(p => ({ ...p, alignmentRevealed: true }));
          nextState.logs = [
            createLog(`🏆 TRẬN ĐẤU KẾT THÚC! Chiến thắng thuộc về phe: ${victoryResult.winnerAlignment.join(", ")}!`, "system"),
            ...nextState.logs
          ];
        }
      }
    }

    nextState.turnIndex = nextIndex;
    nextState.phase = "roll" as const;
    nextState.rolledDice = null;
    nextState.selectedCard = null;
    nextState.lastAttackDamage = null;
    nextState.lastAttackDice = null;

    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    const nextPlayer = nextState.players[nextIndex];

    if (nextPlayer.hasGuardianAngel) {
      nextState.players = nextState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, hasGuardianAngel: false } : p
      );
      nextState.logs = [
        createLog(`🛡️ [Thiên Thần Hộ Mệnh] Hết thời gian tác dụng, lá chắn bảo vệ của ${nextPlayer.name} biến mất.`, "info"),
        ...nextState.logs
      ];
    }

    if (nextPlayer.hasGregorShield) {
      nextState.players = nextState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, hasGregorShield: false } : p
      );
      nextState.logs = [
        createLog(`🛡️ [Áo Giáp Thép Gregor] lá chắn của ${nextPlayer.name} tan biến khi bước vào lượt mới.`, "info"),
        ...nextState.logs
      ];
    }



    if (nextPlayer.alignmentRevealed && nextPlayer.character.name.startsWith("Catherine") && !nextPlayer.isDead) {
      const targetHp = Math.min(nextPlayer.character.hp, nextPlayer.currentHp + 1);
      if (targetHp > nextPlayer.currentHp) {
        nextState.players = nextState.players.map(p =>
          p.id === nextPlayer.id ? { ...p, currentHp: targetHp } : p
        );
        nextState.logs = [
          createLog(`🌸 [Thiền Định Catherine] Nhà Chiêm Tinh [${nextPlayer.name}] bắt đầu lượt chơi và tự hồi phục 1 HP!`, "action"),
          ...nextState.logs
        ];
      }
    }

    if (nextPlayer.alignmentRevealed && nextPlayer.character.name.startsWith("Volkath") && !nextPlayer.isDead && !nextPlayer.abilityDisabled) {
      const aliveShadows = nextState.players.filter(p => !p.isDead && p.character.alignment === Alignment.SHADOW).length;
      const healAmount = aliveShadows + 2;
      const targetHp = Math.min(nextPlayer.character.hp, nextPlayer.currentHp + healAmount);
      if (targetHp > nextPlayer.currentHp) {
        nextState.players = nextState.players.map(p =>
          p.id === nextPlayer.id ? { ...p, currentHp: targetHp } : p
        );
        nextState.logs = [
          createLog(`💀 [Bất Tử Volkath] Ma vương [${nextPlayer.name}] hồi ${healAmount} máu nhờ sức mạnh bóng tối! (${targetHp}/${nextPlayer.character.hp})`, "action"),
          ...nextState.logs
        ];
      }
    }

    if (nextPlayer.character.name.startsWith("George") || nextPlayer.character.name.startsWith("David") || nextPlayer.character.name.startsWith("Mganga") || nextPlayer.character.name.startsWith("Helen")) {
      nextState.players = nextState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, hasUsedAbility: false } : p
      );
    }

    return nextState;
  };

  return {
    isRulesOpen,
    setIsRulesOpen,
    selectedPlayerForInfo,
    setSelectedPlayerForInfo,
    showSettingsMenu,
    setShowSettingsMenu,
    showHistoryDialog,
    setShowHistoryDialog,
    showLocationChoice,
    setShowLocationChoice,
    compassChoices,
    handleStartSoloGame,
    handleStartMultiplayerGame,
    handleConfirmCharacter,
    handleRollMove,
    handleLocationChoice,
    handleSelectGateDeck,
    handleAttackPlayer,
    handleUseCard,
    handleCancelCard,
    handleUseWeirdWoods,
    handleActivateDavidAbility,
    showAbilityTargetDialog,
    setShowAbilityTargetDialog,
    showCharacterList,
    setShowCharacterList,
    showEquipmentList,
    setShowEquipmentList,
    showCardList,
    setShowCardList,
    showCardHistory,
    setShowCardHistory,
    handleRevealIdentity,
    handleStealEquipment,
    handleEndTurn,
    handleCloseIdentityShown,
    handleReturnFromGameOver,
    handleLeaveGame
  };
}
