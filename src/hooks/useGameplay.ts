import React, { useState, useEffect, useRef } from "react";
import { Alignment, CardType, GameState, Player } from "../types";
import { LOCATIONS, areLocationsInSameArea } from "../data/locations";
import { DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, getCardById, GameCard } from "../data/cards";
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
  drawCardFromDeck
} from "../utils/gameEngine";

interface UseGameplayParams {
  view: "lobby" | "waiting_room" | "playing";
  gameMode: "solo" | "multiplayer" | null;
  setGameMode: React.Dispatch<React.SetStateAction<"solo" | "multiplayer" | null>>;
  roomId: string | null;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  playerId: string;
  playerName: string;
  activeGame: GameState | null;
  setActiveGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  setView: React.Dispatch<React.SetStateAction<"lobby" | "waiting_room" | "playing">>;
  setLobbyInitialView: React.Dispatch<React.SetStateAction<"home" | "start">>;
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
  setLobbyInitialView
}: UseGameplayParams) {
  // Dialog/Modal Visibility States
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedPlayerForInfo, setSelectedPlayerForInfo] = useState<Player | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [compassChoices, setCompassChoices] = useState<string[] | null>(null);
  const [showAbilityTargetDialog, setShowAbilityTargetDialog] = useState(false);

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
        const isHost = activeGame.players[0].id === playerId;
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

  // Hủy phòng khi Host tắt tab khi đang ở PHÒNG CHỜ
  useEffect(() => {
    if ("multiplayer" === gameMode && null !== roomId && null !== activeGame && "waiting_room" === view) {
      const isHost = playerId === activeGame.players[0]?.id;
      if (isHost) {
        const handleBeforeUnload = () => {
          const cancelledGame = {
            ...activeGame,
            phase: "cancelled" as const,
            logs: [
              createLog(`🚨 Chủ phòng đã đóng trình duyệt hoặc hủy phòng chờ.`),
              ...activeGame.logs
            ]
          };
          updateRoomState(roomId, cancelledGame);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    }
  }, [gameMode, roomId, activeGame, playerId]);

  // Help calculate turn index safe guard
  const getTurnIndex = () => (activeGame ? activeGame.turnIndex : 0);

  // 1. Khởi tạo Game Solo
  const handleStartSoloGame = () => {
    const initialPlayers = [
      { id: playerId, name: playerName || "Chiến binh vô danh", isBot: false }
    ];
    const initialGame = initGame(initialPlayers);
    setGameMode("solo");
    setActiveGame(initialGame);
    setView("playing");
  };

  // 2. Khai cuộc Multiplayer (Host phân phát bài)
  const handleStartMultiplayerGame = async () => {
    if (null === activeGame || null === roomId) return;
    if (3 > activeGame.players.length) return;

    const assignedCharacters = assignCharactersForPlayers(activeGame.players.length);

    const updatedPlayers = activeGame.players.map((p, idx) => {
      const character = assignedCharacters[idx];
      return {
        ...p,
        character: { ...character },
        currentHp: character.hp,
        locationId: null,
        alignmentRevealed: false,
        equipments: [],
        isDead: false
      };
    });

    const newLog = createLog("🎯 Trận đấu trực tuyến chính thức khai hỏa! Thân phận đã phân phát bí mật, trò chơi bắt đầu.", "system");

    const shuffleIds = (arr: GameCard[]): string[] => {
      return arr.map(c => c.id).sort(() => Math.random() - 0.5);
    };

    const nextState = {
      ...activeGame,
      players: updatedPlayers,
      logs: [newLog],
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

  // 3. Đổ xúc xắc di chuyển
  const handleRollMove = () => {
    if (null === activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];

    nextState.diceAnimState = null;

    // Emi: Dịch chuyển tức thời khi đã lộ diện và không bị khóa kỹ năng (Yoda style)
    if (currentPlayer.character.name.startsWith("Emi") && true === currentPlayer.alignmentRevealed && false === currentPlayer.abilityDisabled) {
      setShowLocationChoice(true);
      setCompassChoices(null);

      nextState.logs = [
        createLog(`🔮 ${currentPlayer.name} kích hoạt Dịch Chuyển Tức Thời! Vui lòng chọn địa điểm di chuyển tự do.`, "action"),
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

  // 4. Lựa chọn địa điểm (Compass / 7 / s5)
  const handleLocationChoice = (locId: string) => {
    if (null === activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    const finalLoc = LOCATIONS.find(l => l.id === locId)!;

    nextState.players = nextState.players.map(p =>
      p.id === currentPlayer.id ? { ...p, locationId: locId } : p
    );

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

    if (null !== drawnCardId && null !== deckType) {
      nextState.drawnCardId = drawnCardId;
      const card = getCardById(drawnCardId);
      const cardName = card ? card.name : "thẻ bài";
      if (CardType.HERMIT === deckType) {
        nextState.logs = [
          createLog(
            isCompassMove
              ? `🧭 ${currentPlayer.name} sử dụng La Bàn Thần Bí di chuyển đến [${finalLoc.name}].`
              : `🏃 ${currentPlayer.name} quyết định di chuyển đến [${finalLoc.name}].`,
            "info"
          ),
          ...nextState.logs
        ];
      } else {
        nextState.logs = [
          createLog(`🗃️ ${currentPlayer.name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.LIGHT === deckType ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
          createLog(
            isCompassMove
              ? `🧭 ${currentPlayer.name} sử dụng La Bàn Thần Bí di chuyển đến [${finalLoc.name}].`
              : `🏃 ${currentPlayer.name} quyết định di chuyển đến [${finalLoc.name}].`,
            "info"
          ),
          ...nextState.logs
        ];
      }
    } else {
      nextState.logs = [
        createLog(
          isCompassMove
            ? `🧭 ${currentPlayer.name} sử dụng La Bàn Thần Bí di chuyển đến [${finalLoc.name}].`
            : `🏃 ${currentPlayer.name} quyết định di chuyển đến [${finalLoc.name}].`,
          "info"
        ),
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

    const needsTarget = charName.startsWith("Fuka") || charName.startsWith("Franklin") || charName.startsWith("Ellen");
    
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
      setLobbyInitialView("start");
      setGameMode(null);
      setRoomId(null);
      setActiveGame(null);
    } else if ("multiplayer" === gameMode && roomId) {
      const isHost = playerId === activeGame.players[0].id;
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
    if ("multiplayer" === gameMode && null !== roomId && null !== activeGame) {
      const isHost = playerId === activeGame.players[0]?.id;
      if (true === isHost) {
        await handleCancelRoomByHost();
        return;
      }

      const updatedPlayers = activeGame.players.filter(p => p.id !== playerId);
      if (0 < updatedPlayers.length) {
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
    setLobbyInitialView("start");
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

    if (nextState.fukaTargetId === nextPlayer.id && !nextPlayer.isDead) {
      const newHp = Math.max(0, nextPlayer.character.hp - 7);
      nextState.players = nextState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, currentHp: newHp } : p
      );
      nextState.fukaTargetId = null;
      nextState.logs = [
        createLog(`⏳ [Trì Hoãn Thần Thời Fuka] Hiệu ứng kích hoạt! Sát thương của ${nextPlayer.name} bị đặt về 7 (HP còn lại: ${newHp}).`, "action"),
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
    handleRevealIdentity,
    handleStealEquipment,
    handleEndTurn,
    handleCloseIdentityShown,
    handleReturnFromGameOver,
    handleLeaveGame
  };
}
