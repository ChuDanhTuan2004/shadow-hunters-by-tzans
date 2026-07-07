import React, { useState, useEffect, useRef } from "react";
import { Alignment, CardType, GameState, Player, GameLog } from "./types";
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
} from "./utils/gameEngine";
import { LOCATIONS, areLocationsInSameArea } from "./data/locations";
import { CHARACTERS, DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, GameCard, getCardById, updateCardDecksFromFirebase } from "./data/cards";
import { listenToRoom, updateRoomState, db, syncLocalCardsToFirebase, fetchCardsFromFirebase } from "./firebase";

import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import GameLogs from "./components/GameLogs";
import RulesModal from "./components/RulesModal";

import { Shield, BookOpen, Bot, LogOut, RefreshCw, Users, Globe, Lock, ArrowLeft, Play, UserPlus, User, Settings, History, Dices, Sparkles, Eye, Skull, ArrowRight } from "lucide-react";

export default function App() {
  // 1. Tạo Player ID ngẫu nhiên và lưu trữ trong sessionStorage (cho từng tab riêng biệt)
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem("sh_player_id");
    if (null !== saved && "" !== saved) return saved;
    const newId = "user_" + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("sh_player_id", newId);
    return newId;
  });

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("sh_player_name") || "Chiến binh vô danh";
  });

  useEffect(() => {
    localStorage.setItem("sh_player_name", playerName);
  }, [playerName]);

  // Đồng bộ hóa danh sách thẻ bài với Firebase Firestore
  useEffect(() => {
    const initCards = async () => {
      try {
        const localCards = [...DECK_HERMIT, ...DECK_LIGHT, ...DECK_SHADOW];
        await syncLocalCardsToFirebase(localCards);
        
        const fbCards = await fetchCardsFromFirebase();
        if (fbCards.length > 0) {
          const hermit = fbCards.filter(c => CardType.HERMIT === c.type);
          const light = fbCards.filter(c => CardType.LIGHT === c.type);
          const shadow = fbCards.filter(c => CardType.SHADOW === c.type);
          updateCardDecksFromFirebase(hermit, light, shadow);
          console.log("Dynamically synced card database from Firestore:", fbCards.length);
        }
      } catch (err) {
        console.error("Failed to sync cards database from Firebase:", err);
      }
    };
    initCards();
  }, []);

  // 2. Trạng thái cấu hình game
  const [view, setView] = useState<"lobby" | "waiting_room" | "playing">("lobby");
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer" | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // States cho dialog thông tin người chơi, cài đặt và lịch sử
  const [selectedPlayerForInfo, setSelectedPlayerForInfo] = useState<Player | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // States tạm thời cho thao tác lựa chọn mục tiêu của người chơi
  const [activeAttackTargetId, setActiveAttackTargetId] = useState("");
  const [activeWoodsTargetId, setActiveWoodsTargetId] = useState("");
  const [activeWoodsAction, setActiveWoodsAction] = useState<"heal" | "damage">("damage");
  const [activeAltarTargetId, setActiveAltarTargetId] = useState("");
  const [activeAltarCardId, setActiveAltarCardId] = useState("");
  const [activeDavidTargetId, setActiveDavidTargetId] = useState("");
  const [activeDavidCardId, setActiveDavidCardId] = useState("");
  const [activeGeorgeAbility, setActiveGeorgeAbility] = useState(false);

  // Modal lựa chọn di chuyển tự do khi tung xúc xắc ra 7 hoặc dùng Cổng bóng tối
  const [showLocationChoice, setShowLocationChoice] = useState(false);

  // States cho bốc bài tự động và Cổng Bóng Tối
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedEquipId, setSelectedEquipId] = useState<string>("");
  const [compassChoices, setCompassChoices] = useState<string[] | null>(null);

  // Ref để tránh việc gọi rút bài nhiều lần liên tục do bất đồng bộ Firestore
  const drawInitiatedRef = useRef<string>("");

  const activeDrawnCard = activeGame?.drawnCardId ? getCardById(activeGame.drawnCardId) || null : null;
  const showGateSelection = activeGame?.showGateSelection || false;
  const selectedGateDeck = activeGame?.selectedGateDeck || null;



  // Reset các trạng thái bài rút tạm thời khi chuyển lượt hoặc chuyển phase
  useEffect(() => {
    if (activeGame) {
      setSelectedTargetId("");
      setSelectedEquipId("");
      setActiveAttackTargetId("");
      setActiveWoodsTargetId("");
      setActiveWoodsAction("damage");
      setActiveAltarTargetId("");
      setActiveAltarCardId("");
      setActiveDavidTargetId("");
      setActiveDavidCardId("");
      setActiveGeorgeAbility(false);
    }
  }, [activeGame?.turnIndex, activeGame?.phase]);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSelectGateDeck = (type: CardType) => {
    if (!activeGame) return;
    const drawRes = drawCardFromDeck(activeGame, type);
    const nextState = drawRes.state;
    const drawnCardId = drawRes.cardId;

    if (drawnCardId) {
      const card = getCardById(drawnCardId);
      const cardName = card ? card.name : "thẻ bài";
      nextState.selectedGateDeck = type;
      nextState.drawnCardId = drawnCardId;
      nextState.logs = [
        createLog(`🗃️ ${nextState.players[nextState.turnIndex].name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.HERMIT === type ? "Ẩn Sĩ" : CardType.LIGHT === type ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
        ...nextState.logs
      ];
    }

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Đăng ký lắng nghe cập nhật Firebase nếu chơi Multiplayer
  useEffect(() => {
    if ("multiplayer" === gameMode && null !== roomId && ("playing" === view || "waiting_room" === view)) {
      const unsubscribe = listenToRoom(roomId, (updatedState: GameState) => {
        if (null === updatedState || undefined === updatedState) return;

        // Nếu phòng bị chủ phòng hủy / kết thúc
        if ("cancelled" === updatedState.phase) {
          alert("⚠️ Chủ phòng đã hủy phòng / kết thúc trận đấu. Tất cả người chơi trở về trang chủ.");
          setView("lobby");
          setGameMode(null);
          setRoomId(null);
          setActiveGame(null);
          return;
        }

        // Nếu bản thân bị đuổi khỏi phòng
        if (false === updatedState.players.some(p => p.id === playerId)) {
          alert("Bạn đã bị chủ phòng đuổi ra khỏi phòng.");
          setView("lobby");
          setGameMode(null);
          setRoomId(null);
          setActiveGame(null);
          return;
        }

        setActiveGame(updatedState);
        if ("waiting_room" === view && "lobby" !== updatedState.phase) {
          setView("playing");
        }
        if ("playing" === view && "lobby" === updatedState.phase) {
          setView("waiting_room");
        }
      });
      return () => unsubscribe();
    }
  }, [roomId, gameMode, view, playerId]);

  // Xử lý khi Chủ phòng tắt hoặc tải lại tab trình duyệt
  useEffect(() => {
    if ("multiplayer" === gameMode && null !== roomId && null !== activeGame && "lobby" !== view) {
      const isHost = playerId === activeGame.players[0]?.id;
      if (true === isHost) {
        const handleBeforeUnload = () => {
          const cancelledGame = {
            ...activeGame,
            phase: "cancelled" as const,
            logs: [
              createLog(`🚨 Chủ phòng đã đóng trình duyệt. Phòng chơi bị hủy.`),
              ...activeGame.logs
            ]
          };
          updateRoomState(roomId, cancelledGame);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    }
  }, [gameMode, roomId, activeGame, view, playerId]);



  // Tự động xử lý lượt chơi của Bot nếu đến lượt của Bot
  // 1. Đối với chế độ Chơi Đơn (Solo)
  useEffect(() => {
    if (gameMode === "solo" && activeGame && view === "playing") {
      const activePlayer = activeGame.players[activeGame.turnIndex];
      if (activePlayer && activePlayer.isBot && activeGame.phase !== "game_over") {
        const timer = setTimeout(() => {
          const updated = executeBotTurn(activeGame, activePlayer.id);
          setActiveGame(updated);
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGame, gameMode, view]);

  // 2. Đối với chế độ Multiplayer (Chỉ Host của phòng game mới thực thi Bot và cập nhật lên Firebase)
  useEffect(() => {
    if (gameMode === "multiplayer" && roomId && activeGame && view === "playing") {
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
  }, [activeGame, gameMode, roomId, playerId, view]);

  // 3. Khởi tạo Game Solo
  const handleStartSoloGame = () => {
    const initialPlayers = [
      { id: playerId, name: playerName || "Chiến binh vô danh", isBot: false }
    ];
    const initialGame = initGame(initialPlayers);
    setGameMode("solo");
    setActiveGame(initialGame);
    setView("playing");
  };

  // 4. Vào phòng chờ Online
  const handleEnterRoom = (enteredRoomId: string) => {
    setRoomId(enteredRoomId);
    setGameMode("multiplayer");
    setView("waiting_room");
  };

  // 5. Thêm Bot thủ công khi ở phòng chờ Online (Chỉ Host mới có quyền)
  const handleAddBotInLobby = async () => {
    if (!activeGame || !roomId) return;
    if (activeGame.players.length >= 8) return;

    const botColors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280"];
    const botNames = ["Hắc Long Bot", "Bạch Hổ Bot", "Ẩn Sĩ Bot", "Bóng Ma Bot", "Thợ Săn Bot", "Dân Thường Bot"];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];
    const uniqueName = `${randomName} #${Math.floor(Math.random() * 900) + 100}`;

    const newBotPlayer = {
      id: "bot_" + Math.random().toString(36).substr(2, 9),
      name: uniqueName,
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
      isBot: true,
      isDead: false,
      color: botColors[activeGame.players.length % botColors.length]
    };

    const updatedPlayers = [...activeGame.players, newBotPlayer];

    const nextState = {
      ...activeGame,
      players: updatedPlayers
    };

    await updateRoomState(roomId, nextState);
  };

  const handleRemovePlayerInLobby = async (pId: string) => {
    if (null === activeGame || null === roomId) return;
    const updatedPlayers = activeGame.players.filter(p => p.id !== pId);
    
    const nextState = {
      ...activeGame,
      players: updatedPlayers
    };

    await updateRoomState(roomId, nextState);
  };

  // 7. Bắt đầu trận đấu Multiplayer (Host lật bài vai trò và kích hoạt bản đồ)
  const handleStartMultiplayerGame = async () => {
    if (null === activeGame || null === roomId) return;
    if (3 > activeGame.players.length) return;

    // Phân bổ nhân vật ngẫu nhiên chuẩn phe Shadow Hunters
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
      phase: "roll",
      turnIndex: 0,
      hermitDeck: shuffleIds(DECK_HERMIT),
      hermitDiscard: [],
      lightDeck: shuffleIds(DECK_LIGHT),
      lightDiscard: [],
      shadowDeck: shuffleIds(DECK_SHADOW),
      shadowDiscard: []
    };

    await updateRoomState(roomId, nextState);
    setView("playing");
  };

  // ==================== CÁC HÀNH ĐỘNG TRONG GAME ====================

  // Thao tác 1: Đổ xúc xắc di chuyển
  const handleRollMove = () => {
    if (null === activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];

    nextState.diceAnimState = null;

    // Kiểm tra La bàn Thần Bí (Mystic Compass): lắc xúc xắc 2 lần và chọn kết quả mong muốn
    if (currentPlayer.equipments.includes("l_compass")) {
      const roll1 = rollForMovement();
      let roll2 = rollForMovement();
      while (roll2.total === roll1.total) {
        roll2 = rollForMovement();
      }

      // Xác định địa điểm cho roll1
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

      // Xác định địa điểm cho roll2
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

      // Lưu 2 lựa chọn và hiển thị để chọn
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
        nextState.logs = [
          createLog(`🗃️ ${currentPlayer.name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.HERMIT === deckType ? "Ẩn Sĩ" : CardType.LIGHT === deckType ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
          createLog(`🏃 ${currentPlayer.name} di chuyển đến [${finalLoc.name}].`, "info"),
          ...nextState.logs
        ];
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

  // Thao tác 2: Di chuyển tự do (Khi ra số 7 hoặc dùng Cổng Dịch Chuyển Bóng Tối)
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
      nextState.logs = [
        createLog(`🗃️ ${currentPlayer.name} đã rút thẻ [${cardName}] thuộc Bộ bài ${CardType.HERMIT === deckType ? "Ẩn Sĩ" : CardType.LIGHT === deckType ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
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

  // Thao tác 3: Rút một lá bài (Gửi thông báo và chuyển phase)
  const handleDrawCard = (deckType: CardType) => {
    // Chỉ ghi nhận sự kiện rút bài lên log, action cụ thể sẽ diễn ra khi click Xác nhận/Sử dụng ở CardDecks
    if (!activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    
    nextState.logs = [
      createLog(`🗃️ ${currentPlayer.name} đang xem xét rút một thẻ thuộc Bộ bài ${deckType === CardType.HERMIT ? "Ẩn Sĩ" : deckType === CardType.LIGHT ? "Ánh Sáng" : "Bóng Tối"}.`, "info"),
      ...nextState.logs
    ];

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 4: Sử dụng Thẻ bài vừa rút
  const handleUseCard = (cardId: string, targetPlayerId: string | null) => {
    if (!activeGame) return;
    const currentPlayer = activeGame.players[activeGame.turnIndex];
    
    let nextState = { ...activeGame };

    if (cardId.startsWith("h")) {
      // Ẩn sĩ
      nextState = applyHermitCard(nextState, targetPlayerId!, cardId, currentPlayer.id);
    } else {
      // Light / Shadow
      nextState = useGameCard(nextState, cardId, currentPlayer.id, targetPlayerId);
    }

    // Sau khi dùng bài xong, chuyển thẳng sang giai đoạn tấn công (trừ phi dùng thẻ s5)
    if (cardId === "s5") {
      setShowLocationChoice(true);
      // Giữ nguyên nextState.phase là "action" để người chơi tự chọn địa điểm di chuyển tự do
    } else {
      if (nextState.phase !== "game_over") {
        if (hasAttackableTargets(nextState)) {
          nextState.phase = "attack";
        } else {
          nextState = endTurnTransition(nextState);
        }
      }
    }

    // Dọn sạch trạng thái rút bài sau khi dùng xong
    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 5: Bỏ qua rút bài
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
      nextState.phase = "attack";
    } else {
      nextState = endTurnTransition(nextState);
    }
    
    // Dọn sạch trạng thái rút bài sau khi bỏ qua
    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 6: Sử dụng Rừng Rậm Kỳ Dị
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
      // Kiểm tra Cài Áo May Mắn của target (Kháng sát thương Weird Woods)
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

    // Sau khi dùng Weird Woods xong, chuyển sang phase tấn công
    if (hasAttackableTargets(nextState)) {
      nextState.phase = "attack";
    } else {
      nextState = endTurnTransition(nextState);
    }

    // Check game over
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

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 7: Tấn công người chơi
  const handleAttackPlayer = (targetId: string) => {
    if (!activeGame) return;
    const currentPlayer = activeGame.players[gameStateTurnIndex()];
    let nextState = { ...activeGame };
    
    // Nếu Charles đã tấn công trước đó trong lượt này, tự nhận 2 sát thương để chém tiếp
    const isCharles = currentPlayer.character.name.startsWith("Charles") && currentPlayer.alignmentRevealed;
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
    
    // Thực hiện tấn công
    if (activeGeorgeAbility) {
      nextState = activateCharacterAbility(nextState, currentPlayer.id, targetId);
    }
    nextState = performAttack(nextState, currentPlayer.id, targetId);
    
    // Đánh dấu George đã kích hoạt skill
    if (activeGeorgeAbility) {
      setActiveGeorgeAbility(false);
    }
    
    // Chém đôi của Charles: giữ nguyên phase attack để tự chọn chém tiếp hoặc kết thúc lượt chơi
    const checkCharles = nextState.players.find(p => p.id === currentPlayer.id)!;
    const canCharlesStrikeAgain = checkCharles.character.name.startsWith("Charles") && checkCharles.alignmentRevealed && !checkCharles.isDead;
    
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

  // Thao tác quay trở lại khi Game Over
  const handleReturnFromGameOver = async () => {
    if (!activeGame) return;

    if ("solo" === gameMode) {
      setView("lobby");
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
          phase: "lobby",
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

  // Thao tác cướp trang bị tại Bàn Thờ Cổ
  const handleStealEquipment = (targetPlayerId: string, cardId: string) => {
    if (!activeGame) return;
    let nextState = { ...activeGame };
    const currentPlayer = nextState.players[nextState.turnIndex];
    const targetPlayer = nextState.players.find(p => p.id === targetPlayerId);
    
    if (!targetPlayer) return;

    // Loại bỏ trang bị khỏi nạn nhân
    const targetEquipments = targetPlayer.equipments.filter(id => id !== cardId);
    // Thêm trang bị vào người chơi hiện tại
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

    // Chuyển sang giai đoạn tấn công
    if (hasAttackableTargets(nextState)) {
      nextState.phase = "attack";
    } else {
      nextState = endTurnTransition(nextState);
    }

    if ("solo" === gameMode) {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 8: Tiết lộ thân phận chủ động
  const handleRevealIdentity = () => {
    if (!activeGame) return;
    const currentPlayer = activeGame.players[gameStateTurnIndex()];

    let nextState = activateCharacterAbility(activeGame, currentPlayer.id);

    if (gameMode === "solo") {
      setActiveGame(nextState);
    } else if (roomId) {
      updateRoomState(roomId, nextState);
    }
  };

  // Thao tác 9: Kết thúc lượt chuyển sang người chơi mới
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

  // Hàm phụ trợ hỗ trợ chuyển turn sạch sẽ
  const endTurnTransition = (state: GameState): GameState => {
    const nextState = { ...state };
    const currentPlayer = nextState.players[nextState.turnIndex];

    // Kiểm tra nếu người chơi hiện tại có lượt phụ (Extra turn) và chưa chết
    if (currentPlayer.extraTurnCount && currentPlayer.extraTurnCount > 0 && !currentPlayer.isDead) {
      nextState.players = nextState.players.map(p => 
        p.id === currentPlayer.id 
          ? { ...p, extraTurnCount: p.extraTurnCount! - 1 } 
          : p
      );
      nextState.phase = "roll";
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
    
    // Bỏ qua những người đã chết
    while (nextState.players[nextIndex].isDead) {
      nextIndex = (nextIndex + 1) % nextState.players.length;
    }

    if (nextIndex < nextState.turnIndex) {
      nextState.roundNumber = (nextState.roundNumber || 1) + 1;
    }

    nextState.turnIndex = nextIndex;
    nextState.phase = "roll";
    nextState.rolledDice = null;
    nextState.selectedCard = null;
    nextState.lastAttackDamage = null;
    nextState.lastAttackDice = null;
    
    // Dọn sạch trạng thái rút bài cho lượt tiếp theo
    nextState.drawnCardId = null;
    nextState.showGateSelection = false;
    nextState.selectedGateDeck = null;

    const nextPlayer = nextState.players[nextIndex];

    // Hết hiệu lực bảo hộ của Guardian Angel khi bắt đầu lượt mới của mình
    if (nextPlayer.hasGuardianAngel) {
      nextState.players = nextState.players.map(p => 
        p.id === nextPlayer.id ? { ...p, hasGuardianAngel: false } : p
      );
      nextState.logs = [
        createLog(`🛡️ [Thiên Thần Hộ Mệnh] Hết thời gian tác dụng, lá chắn bảo vệ của ${nextPlayer.name} biến mất.`, "info"),
        ...nextState.logs
      ];
    }

    // Hết hiệu lực Gregor Shield khi bắt đầu lượt mới của mình
    if (nextPlayer.hasGregorShield) {
      nextState.players = nextState.players.map(p =>
        p.id === nextPlayer.id ? { ...p, hasGregorShield: false } : p
      );
      nextState.logs = [
        createLog(`🛡️ [Áo Giáp Thép Gregor] lá chắn của ${nextPlayer.name} tan biến khi bước vào lượt mới.`, "info"),
        ...nextState.logs
      ];
    }

    // Fuka: đầu lượt của target, đặt HP về max-7
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

    // Catherine tự động hồi 1 HP khi bắt đầu lượt mới
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

    // Ultrasoul: đầu lượt gây 3 sát thương cho bất kỳ người nào đang đứng ở Underworld Gate (loc_fountain)
    if (nextPlayer.alignmentRevealed && nextPlayer.character.name.startsWith("Ultrasoul") && !nextPlayer.isDead) {
      const gateVictims = nextState.players.filter(p =>
        p.id !== nextPlayer.id && !p.isDead && p.locationId === "loc_fountain"
      );
      gateVictims.forEach(victim => {
        nextState.players = nextState.players.map(p => {
          if (p.id !== victim.id) return p;
          const newHp = Math.max(0, p.currentHp - 3);
          const isDead = newHp <= 0;
          nextState.logs = [
            createLog(`👻 [Hào Quang Địa Ngục] Ultrasoul [${nextPlayer.name}] gây 3 sát thương lên ${p.name} đang đứng ở Underworld Gate!`, "attack"),
            ...nextState.logs
          ];
          if (isDead) {
            nextState.logs = [
              createLog(`☠️ ${p.name} bị thiêu đốt bởi Hào Quang Địa Ngục! Thân phận: [${p.character.name}] - Phe [${p.character.alignment}].`, "reveal"),
              ...nextState.logs
            ];
          }
          return { ...p, currentHp: newHp, isDead, alignmentRevealed: isDead ? true : p.alignmentRevealed };
        });
      });
      if (0 === gateVictims.length) {
        nextState.logs = [
          createLog(`👻 [Hào Quang Địa Ngục] Không có ai đứng ở Underworld Gate, Ultrasoul [${nextPlayer.name}] không gây sát thương.`, "info"),
          ...nextState.logs
        ];
      }
    }

    return nextState;
  };

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

  const gameStateTurnIndex = (): number => {
    return activeGame ? activeGame.turnIndex : 0;
  };

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
    setGameMode(null);
    setRoomId(null);
    setActiveGame(null);
  };

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
    setGameMode(null);
    setRoomId(null);
    setActiveGame(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 flex flex-col selection:bg-rose-500/30 selection:text-white">
      
      {/* HEADER TOPBAR */}
      {"playing" !== view && (
        <header className={`sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors duration-300 ${
          "lobby" === view 
            ? "bg-transparent border-b border-white/5" 
            : "bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all duration-300 border ${
              "lobby" === view 
                ? "bg-[#4437ac]/15 border-[#7ba2be]/25 text-[#7ba2be] shadow-[0_0_10px_rgba(123,162,190,0.1)]" 
                : "bg-rose-600/10 border-rose-500/20 text-rose-500"
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase sm:text-base">
                Shadow Hunters
              </h1>
              <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                "lobby" === view ? "text-[#7ba2be]" : "text-rose-500"
              }`}>
                Bản Sắc Việt Hóa 🇻🇳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="px-3.5 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/90 text-xs font-semibold rounded-lg text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors border border-white/5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Luật Chơi
            </button>

            {"lobby" !== view && (
              <button
                onClick={handleLeaveGame}
                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-[11px] font-bold rounded-lg text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors border border-rose-900/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                {"multiplayer" === gameMode && null !== activeGame && playerId === activeGame.players[0]?.id
                  ? "🔥 Hủy & Kết Thúc Trận"
                  : "Thoát Phòng"}
              </button>
            )}
          </div>
        </header>
      )}

      {/* CHÍNH DIỆN TRANG CHỦ */}
      <main className={"playing" === view ? "flex-1 w-full p-4 sm:p-6 flex flex-col justify-center" : "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center"}>
        
        {/* VIEW 1: LOBBY */}
        {view === "lobby" && (
          <Lobby
            playerId={playerId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            onStartSoloGame={handleStartSoloGame}
            onEnterRoom={handleEnterRoom}
          />
        )}

        {/* VIEW 2: ROOM WAITING ONLINE */}
        {view === "waiting_room" && activeGame && (
          <div className="max-w-2xl w-full mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                Phòng Chờ Trực Tuyến
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                MÃ PHÒNG: <span className="text-rose-500 font-mono select-all bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">{roomId}</span>
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Hãy chia sẻ mã phòng 5 chữ cái trên cho bạn bè để họ nhập gia nhập phòng chơi. Cần tối thiểu 3 người chơi (bạn có thể thêm Bot) để khai cuộc!
              </p>
            </div>

            {/* Danh sách người chơi kết nối */}
            <div className="bg-neutral-950 rounded-2xl border border-neutral-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Anh Hùng Gia Nhập ({activeGame.players.length}/8)
                </span>
                <span className="text-[10px] text-neutral-500">Giới hạn tối đa 8</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGame.players.map((p, idx) => (
                  <div 
                    key={p.id}
                    className="p-3 bg-neutral-900/60 border border-neutral-800/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                      <span className="text-xs text-white font-bold">
                        {p.name} {p.isBot ? "(Bot)" : p.id === playerId ? "(Bạn - Host)" : ""}
                      </span>
                    </div>

                    {/* Cho phép Host đuổi người chơi khác hoặc xóa Bot */}
                    {activeGame.players[0].id === playerId && p.id !== playerId && (
                      <button
                        onClick={() => handleRemovePlayerInLobby(p.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/60 transition-all cursor-pointer"
                      >
                        {p.isBot ? "Xóa Bot" : "Đuổi / Kick"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action thêm Bot */}
              {activeGame.players[0].id === playerId && activeGame.players.length < 8 && (
                <button
                  onClick={handleAddBotInLobby}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-rose-500" />
                  Mời Thêm AI Bot Gia Nhập (+1 Bot)
                </button>
              )}
            </div>

            {/* Điều khiển Bắt đầu */}
            <div className="flex gap-3">
              <button
                onClick={handleLeaveGame}
                className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 rounded-2xl text-xs font-bold text-neutral-300 transition-all flex items-center justify-center gap-1 border border-neutral-700/40"
              >
                <ArrowLeft className="w-4 h-4" />
                Hủy Phòng
              </button>

              {activeGame.players[0].id === playerId ? (
                <button
                  onClick={handleStartMultiplayerGame}
                  disabled={activeGame.players.length < 3}
                  className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 rounded-2xl text-white font-bold text-xs shadow-xl shadow-rose-950/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  KHAI CHIẾN TRẬN ĐẤU
                </button>
              ) : (
                <div className="flex-1 py-3.5 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-xs text-neutral-500 italic flex items-center justify-center">
                  Đợi Host bắt đầu trận đấu...
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: TRONG TRẬN ĐẤU (PLAYING) - GIAO DIỆN MỚI THEO HÌNH ẢNH MOCKUP */}
        {"playing" === view && activeGame && (
          <div className="flex flex-col items-stretch w-full flex-1 gap-6">
            
            {/* TOP BAR */}
            <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-4 w-full">
              {/* Left Logo Title */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-extrabold tracking-tight text-white uppercase sm:text-base">
                  Shadow Hunters
                </span>
                <span className="hidden sm:inline text-[9px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                  Bản Sắc Việt Hóa 🇻🇳
                </span>
              </div>

              {/* Right: Rules, History & Settings links matching mockup */}
              <div className="flex items-center gap-3 text-[11px] sm:text-xs font-bold text-neutral-300 shrink-0">
                {/* Rules button */}
                <button
                  onClick={() => setIsRulesOpen(true)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden xs:inline">Luật chơi</span>
                </button>
                <span className="text-neutral-850">|</span>

                {/* History button */}
                <button
                  onClick={() => setShowHistoryDialog(true)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                >
                  <History className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden xs:inline">Lịch sử</span>
                </button>
                <span className="text-neutral-850">|</span>

                {/* Settings button container */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                  >
                    <Settings className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cài đặt</span>
                  </button>
                  {showSettingsMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 w-44 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn text-left">
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            handleLeaveGame();
                          }}
                          className="w-full text-left py-2 px-3 hover:bg-rose-950/30 text-rose-450 rounded-lg text-xs font-bold transition-all border border-rose-900/30 flex items-center gap-1.5 cursor-pointer animate-fadeIn"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          {playerId === activeGame.players[0]?.id ? "Hủy phòng chơi" : "Thoát phòng"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Player List (Horizontal scroll row) */}
            <div className="lg:hidden w-full overflow-x-auto scrollbar-none py-1 mb-0">
              <div className="flex gap-2 min-w-max px-1">
                {activeGame.players.map((p) => {
                  const isSelf = playerId === p.id;
                  const isRevealed = isSelf || p.alignmentRevealed || p.isDead;
                  const maxHp = p.character.hp;
                  const lostHp = maxHp - p.currentHp;
                  const isCurrentTurn = activeGame.players[activeGame.turnIndex]?.id === p.id && !p.isDead;
                  
                  return (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedPlayerForInfo(p)}
                      className={`flex flex-col items-center text-center cursor-pointer transition-all duration-300 p-1 rounded-xl border ${
                        isCurrentTurn 
                          ? "bg-rose-950/15 border-rose-500/50 scale-105 shadow-[0_0_10px_rgba(244,63,94,0.15)]" 
                          : "border-transparent hover:bg-neutral-900/40"
                      }`}
                    >
                      {/* Avatar with damage badge */}
                      <div className="relative">
                        <div 
                          className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shadow ${
                            p.isDead 
                              ? "bg-neutral-800 border-neutral-700 text-neutral-500" 
                              : "bg-neutral-900 text-white"
                          }`}
                          style={p.isDead ? {} : { borderColor: p.color }}
                        >
                          {p.isDead ? (
                            <Skull className="w-3.5 h-3.5 text-neutral-500" />
                          ) : p.isBot ? (
                            <Bot className="w-3.5 h-3.5" style={{ color: p.color }} />
                          ) : (
                            <User className="w-3.5 h-3.5" style={{ color: p.color }} />
                          )}
                        </div>
                        <div 
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-0.5 py-0 rounded text-[7px] font-extrabold border shadow-sm whitespace-nowrap leading-none ${
                            p.isDead
                              ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                              : isRevealed
                                ? "bg-rose-950 border-rose-900 text-rose-400"
                                : "bg-neutral-950 border-neutral-800 text-neutral-400"
                          }`}
                        >
                          {isRevealed ? `${lostHp}/${maxHp}` : `${lostHp}`}
                        </div>
                      </div>
                      <div className="mt-1.5 space-y-0 max-w-[55px]">
                        <div className="text-[8px] font-extrabold text-white truncate">
                          {p.name} {isSelf && <span className="text-[6.5px] text-rose-450 font-bold bg-rose-500/10 px-0.5 rounded">(Bạn)</span>}
                        </div>
                        <div className="text-[6.5px] text-neutral-450 font-bold truncate uppercase tracking-tight">
                          {false === isRevealed
                            ? "???"
                            : Alignment.SHADOW === p.character.alignment 
                              ? "Bóng Tối" 
                              : Alignment.HUNTER === p.character.alignment 
                                ? "Thợ Săn" 
                                : "Trung Lập"}
                        </div>
                        {isRevealed && (
                          <div className="text-[6.5px] text-neutral-550 font-medium truncate">
                            {p.character.name}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main view container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-6 items-stretch w-full flex-1">
              
              {/* Latest Log Display (col-span-12) */}
              {(() => {
                const latestLog = 0 < activeGame.logs.length ? activeGame.logs[0] : null;
                if (null === latestLog) return null;
                const logTypeStyles = {
                  reveal: "bg-amber-950/20 border-l border-amber-500 text-amber-200 hover:bg-amber-950/30 transition-colors",
                  attack: "bg-rose-950/20 border-l border-rose-500 text-rose-200 hover:bg-rose-950/30 transition-colors",
                  card: "bg-blue-950/20 border-l border-blue-500 text-blue-200 hover:bg-blue-950/30 transition-colors",
                  action: "bg-emerald-950/20 border-l border-emerald-500 text-emerald-200 hover:bg-emerald-950/30 transition-colors",
                };
                const logIcons = {
                  reveal: "📣",
                  attack: "⚔️",
                  card: "🃏",
                  action: "📌",
                  system: "🔔",
                  info: "ℹ️"
                };
                return (
                  <div className="col-span-full w-full">
                    <div 
                      onClick={() => setShowHistoryDialog(true)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-[10px] sm:text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer ${logTypeStyles[latestLog.type] || "bg-neutral-950/60 border-l border-neutral-800 text-neutral-300 hover:bg-neutral-900/60 transition-colors"}`}
                    >
                      <span className="shrink-0">{logIcons[latestLog.type] || "📄"}</span>
                      <span className="truncate" title={latestLog.message}>{latestLog.message}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Left Column (3/12): Player list */}
              <div className="hidden lg:flex lg:col-span-3 flex-col h-full">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 flex-1 flex flex-col h-full">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1 border-b border-neutral-850 pb-2">
                    Danh Sách Anh Hùng
                  </h4>
                  <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin flex-1 max-h-[70vh]">
                    {(() => { const turnId = activeGame.players[activeGame.turnIndex]?.id; return activeGame.players.map((p) => {
                      const isSelf = p.id === playerId;
                      const isRevealed = isSelf || p.alignmentRevealed || p.isDead;
                      const maxHp = p.character.hp;
                      const lostHp = maxHp - p.currentHp;
                      const isCurrentTurn = p.id === turnId && !p.isDead;
                      
                      return (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedPlayerForInfo(p)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            p.isDead 
                              ? "bg-neutral-950/20 border-neutral-900 opacity-60 hover:bg-neutral-900/20" 
                              : isCurrentTurn
                                ? "bg-neutral-800/60 border-rose-500/50 ring-1 ring-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] hover:bg-neutral-700/60"
                              : isSelf 
                                ? "bg-neutral-900/60 border-neutral-700 hover:bg-neutral-800/60" 
                                : "bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60"
                          }`}
                        >
                          {/* Avatar Area */}
                          <div className="relative shrink-0">
                            <div 
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-xs shadow ${
                                p.isDead 
                                  ? "bg-neutral-800 border-neutral-700 text-neutral-500" 
                                  : "bg-neutral-900 text-white"
                              }`}
                              style={p.isDead ? {} : { borderColor: p.color }}
                            >
                              {p.isDead ? (
                                <Skull className="w-5 h-5 text-neutral-500" />
                              ) : p.isBot ? (
                                <Bot className="w-5 h-5" style={{ color: p.color }} />
                              ) : (
                                <User className="w-5 h-5" style={{ color: p.color }} />
                              )}
                            </div>
                            
                            {/* Damage Taken Badge */}
                            <div 
                              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[11px] font-extrabold border shadow-sm whitespace-nowrap leading-none ${
                                p.isDead
                                  ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                                  : isRevealed
                                    ? "bg-rose-950 border-rose-905 text-rose-400"
                                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                              }`}
                            >
                              {isRevealed ? `${lostHp}/${maxHp}` : `${lostHp}`}
                            </div>
                          </div>

                          {/* Player Details */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold truncate ${p.isDead ? "text-neutral-600 line-through font-normal" : "text-white"}`}>
                                {p.name} {p.isBot ? "(Bot)" : ""} {isSelf && <span className="text-[8px] text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20 ml-0.5">Bạn</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                p.isDead
                                  ? "text-neutral-600 bg-neutral-950 border-neutral-900"
                                  : !isRevealed
                                    ? "text-neutral-500 bg-neutral-950 border-neutral-800"
                                    : p.character.alignment === Alignment.SHADOW 
                                      ? "text-red-400 bg-red-950/20 border-red-900/30" 
                                      : p.character.alignment === Alignment.HUNTER 
                                        ? "text-blue-400 bg-blue-950/20 border-blue-900/30" 
                                        : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                              }`}>
                                {!isRevealed
                                  ? "???"
                                  : p.character.alignment === Alignment.SHADOW 
                                    ? "Bóng Tối" 
                                    : p.character.alignment === Alignment.HUNTER 
                                      ? "Thợ Săn" 
                                      : "Trung Lập"}
                              </span>
                              <span className={`text-[10px] font-semibold truncate ${p.isDead ? "text-neutral-600 line-through font-normal" : "text-neutral-300"}`}>
                                {!isRevealed ? "???" : p.character.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })})()}
                  </div>
                </div>
              </div>

              {/* Center/Right Column (9/12): Map & Action Area */}
              <div className="lg:col-span-9 flex flex-col gap-6 h-full">
                
                {/* Game Board / Map */}
                <div className="flex-1 bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-4 flex flex-col items-stretch">
                  <GameBoard
                    locations={LOCATIONS}
                    players={activeGame.players}
                    currentPlayerId={playerId}
                  />
                </div>

                {/* 1. Context Controls (Tấn công, cướp trang bị, đào mộ, dùng rừng...) */}
                {(() => {
                  const currentTurnPlayer = activeGame.players[activeGame.turnIndex];
                  const isMyTurn = playerId === currentTurnPlayer.id;
                  
                  if (isMyTurn && "game_over" !== activeGame.phase) {
                    if ("attack" === activeGame.phase) {
                      const hasHandgun = currentTurnPlayer.equipments.includes("s_handgun");
                      const attackableTargets = activeGame.players.filter((p) => {
                        if (playerId === p.id || p.isDead) return false;
                        const inSame = areLocationsInSameArea(currentTurnPlayer.locationId, p.locationId);
                        return hasHandgun ? !inSame : inSame;
                      });
                      
                      return (
                        <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                            ⚔️ Khai Chiến Tấn Công
                          </span>
                          {1 === activeGame.roundNumber ? (
                            <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg text-center">
                              <p className="text-[10px] text-amber-400 font-bold">🛡️ VÒNG CHƠI ĐẦU TIÊN: HÒA BÌNH</p>
                              <p className="text-[9px] text-neutral-400 mt-0.5">Không thể giao chiến trong vòng này.</p>
                            </div>
                          ) : 0 === attackableTargets.length ? (
                            <p className="text-[10px] text-neutral-500 italic text-center py-1">
                              Không tìm thấy đối thủ cùng khu vực để tấn công.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <select
                                value={activeAttackTargetId}
                                onChange={(e) => setActiveAttackTargetId(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Chọn đối thủ cùng khu vực --</option>
                                {attackableTargets.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.isBot ? "(Bot)" : ""} ({p.alignmentRevealed ? `Máu: ${p.currentHp} HP` : "Máu: ??"})
                                  </option>
                                ))}
                              </select>
                              {currentTurnPlayer.character.name.startsWith("George") && currentTurnPlayer.alignmentRevealed && !currentTurnPlayer.hasUsedAbility && (
                                <label className="flex items-center gap-2 cursor-pointer py-1 text-xs text-amber-400 select-none">
                                  <input
                                    type="checkbox"
                                    checked={activeGeorgeAbility}
                                    onChange={(e) => setActiveGeorgeAbility(e.target.checked)}
                                    className="rounded border-neutral-800 accent-amber-550"
                                  />
                                  💥 Phát Bắn Chính Nghĩa (+D4 sát thương)
                                </label>
                              )}
                              <button
                                onClick={() => {
                                  if (activeAttackTargetId) {
                                    handleAttackPlayer(activeAttackTargetId);
                                    setActiveAttackTargetId("");
                                  }
                                }}
                                disabled={!activeAttackTargetId}
                                className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer"
                              >
                                Xác Nhận Tấn Công
                              </button>
                            </div>
                          )}
                          
                          {activeGame.lastAttackDice && (
                            <div className="pt-2 border-t border-neutral-800/60 mt-2">
                              <div className="bg-neutral-900/60 rounded-lg p-2.5 flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-6 h-6 rounded flex items-center justify-center bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[10px] font-bold">D6</span>
                                  <span className="text-sm font-bold text-white font-mono">{activeGame.lastAttackDice.d6}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold">D4</span>
                                  <span className="text-sm font-bold text-white font-mono">{activeGame.lastAttackDice.d4}</span>
                                </div>
                                <div className="w-px h-6 bg-neutral-800" />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Sát thương</span>
                                  <span className={`text-sm font-bold font-mono ${activeGame.lastAttackDice.damage > 0 ? "text-rose-400" : "text-neutral-500"}`}>
                                    {activeGame.lastAttackDice.damage > 0 ? `${activeGame.lastAttackDice.damage}` : "HỤT"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    if ("action" === activeGame.phase && "loc_anvil" === currentTurnPlayer.locationId) {
                      const otherPlayersWithEquipments = activeGame.players.filter(
                        p => p.id !== currentTurnPlayer.id && !p.isDead && p.equipments.length > 0
                      );

                      return (
                        <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left">
                          <span className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
                            🎒 Cướp Trang Bị (Bàn Thờ Cổ)
                          </span>
                          {0 === otherPlayersWithEquipments.length ? (
                            <div className="space-y-2">
                              <p className="text-[11px] text-neutral-400">
                                Không có ai sở hữu trang bị để cướp.
                              </p>
                              <button
                                onClick={() => {
                                  let nextState = { ...activeGame };
                                  nextState.phase = "attack";
                                  if ("solo" === gameMode) {
                                    setActiveGame(nextState);
                                  } else if (roomId) {
                                    updateRoomState(roomId, nextState);
                                  }
                                }}
                                className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                              >
                                Bỏ Qua & Tiếp Tục
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <select
                                value={activeAltarTargetId}
                                onChange={(e) => {
                                  setActiveAltarTargetId(e.target.value);
                                  setActiveAltarCardId("");
                                }}
                                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Chọn nạn nhân --</option>
                                {otherPlayersWithEquipments.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.equipments.length} trang bị)
                                  </option>
                                ))}
                              </select>

                              {activeAltarTargetId && (
                                <select
                                  value={activeAltarCardId}
                                  onChange={(e) => setActiveAltarCardId(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer animate-fadeIn"
                                >
                                  <option value="">-- Chọn trang bị để cướp --</option>
                                  {activeGame.players
                                    .find(p => activeAltarTargetId === p.id)
                                    ?.equipments.map((eqId) => {
                                      const card = getCardById(eqId);
                                      return card ? (
                                        <option key={eqId} value={eqId}>
                                          {card.name} ({CardType.LIGHT === card.type ? "Ánh Sáng" : "Bóng Tối"})
                                        </option>
                                      ) : null;
                                    })}
                                </select>
                              )}

                              <button
                                onClick={() => {
                                  if (activeAltarTargetId && activeAltarCardId) {
                                    handleStealEquipment(activeAltarTargetId, activeAltarCardId);
                                    setActiveAltarTargetId("");
                                    setActiveAltarCardId("");
                                  }
                                }}
                                disabled={!activeAltarTargetId || !activeAltarCardId}
                                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer"
                              >
                                Xác Nhận Cướp
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if ("action" === activeGame.phase && "loc_woods" === currentTurnPlayer.locationId) {
                      return (
                        <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left">
                          <span className="text-[10px] font-bold text-purple-400 uppercase block tracking-wider">
                            🌲 Ma Lực Rừng Rậm Kỳ Dị
                          </span>
                          <div className="space-y-2">
                            <select
                              value={activeWoodsTargetId}
                              onChange={(e) => setActiveWoodsTargetId(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Chọn anh hùng tác dụng --</option>
                              {activeGame.players.filter(p => !p.isDead).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {playerId === p.id ? `Bản thân (${p.name})` : p.name} ({playerId === p.id || p.alignmentRevealed ? `Máu: ${p.currentHp} HP` : "Máu: ??"})
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => setActiveWoodsAction("damage")}
                                className={`py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                                  "damage" === activeWoodsAction 
                                    ? "bg-rose-950/40 text-rose-400 border-rose-500/30" 
                                    : "bg-neutral-900 border-neutral-800 text-neutral-500"
                                }`}
                              >
                                Gây 2 Sát Thương
                              </button>
                              <button
                                onClick={() => setActiveWoodsAction("heal")}
                                className={`py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                                  "heal" === activeWoodsAction 
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" 
                                    : "bg-neutral-900 border-neutral-800 text-neutral-500"
                                }`}
                              >
                                Hồi 1 Máu
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                if (activeWoodsTargetId) {
                                  handleUseWeirdWoods(activeWoodsTargetId, activeWoodsAction);
                                  setActiveWoodsTargetId("");
                                }
                              }}
                              disabled={!activeWoodsTargetId}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer"
                            >
                              Kích Hoạt Ma Lực
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isDavid = currentTurnPlayer.character.name.startsWith("David") && currentTurnPlayer.alignmentRevealed && !currentTurnPlayer.hasUsedAbility;
                    const deadPlayersWithEquips = activeGame.players.filter(p => p.isDead && p.equipments.length > 0);
                    
                    if (isDavid && deadPlayersWithEquips.length > 0) {
                      return (
                        <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left animate-fadeIn">
                          <span className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
                            🪦 Kỹ năng: Đào Mộ Thánh Tích
                          </span>
                          <div className="space-y-2">
                            <select
                              value={activeDavidTargetId}
                              onChange={(e) => {
                                  setActiveDavidTargetId(e.target.value);
                                  setActiveDavidCardId("");
                              }}
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Chọn thi thể người chết --</option>
                              {deadPlayersWithEquips.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.equipments.length} trang bị)
                                </option>
                              ))}
                            </select>

                            {activeDavidTargetId && (
                              <select
                                value={activeDavidCardId}
                                onChange={(e) => setActiveDavidCardId(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer animate-fadeIn"
                              >
                                <option value="">-- Chọn thánh tích cướp về --</option>
                                {activeGame.players
                                  .find(p => activeDavidTargetId === p.id)
                                  ?.equipments.map((eqId) => {
                                    const card = getCardById(eqId);
                                    return card ? (
                                      <option key={eqId} value={eqId}>
                                        {card.name}
                                      </option>
                                    ) : null;
                                  })}
                              </select>
                            )}

                            <button
                              onClick={() => {
                                if (activeDavidTargetId && activeDavidCardId) {
                                  const next = activateCharacterAbility(activeGame, playerId, `${activeDavidTargetId}:${activeDavidCardId}`);
                                  if (gameMode === "solo") {
                                    setActiveGame(next);
                                  } else if (roomId) {
                                    updateRoomState(roomId, next);
                                  }
                                  setActiveDavidTargetId("");
                                  setActiveDavidCardId("");
                                }
                              }}
                              disabled={!activeDavidTargetId || !activeDavidCardId}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer"
                            >
                              Xác Nhận Đào Mộ
                            </button>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {/* 2. Unified Responsive Control Panel (Trạng thái, Logs và Nút Tròn) */}
                {(() => {
                  const currentTurnPlayer = activeGame.players[activeGame.turnIndex];
                  const isMyTurn = playerId === currentTurnPlayer.id;
                  const isGameOver = "game_over" === activeGame.phase;
                  
                  // Button 1: Reveal / Active Skill
                  let isLeftButtonActive = false;
                  let leftButtonLabel = "LỘ DIỆN";
                  let leftButtonAction = null;
                  
                  if (isMyTurn && !isGameOver) {
                    if (!currentTurnPlayer.alignmentRevealed) {
                      const isDaniel = currentTurnPlayer.character.name.startsWith("Daniel");
                      isLeftButtonActive = !isDaniel;
                      leftButtonLabel = isDaniel ? "DANIEL: LỖI" : "LỘ DIỆN";
                      leftButtonAction = isDaniel ? null : handleRevealIdentity;
                    } else if (
                      (currentTurnPlayer.character.name.startsWith("Franklin") || 
                       currentTurnPlayer.character.name.startsWith("Allie") || 
                       currentTurnPlayer.character.name.startsWith("Agnes")) &&
                      !currentTurnPlayer.hasUsedAbility
                    ) {
                      isLeftButtonActive = true;
                      leftButtonLabel = "KỸ NĂNG";
                      leftButtonAction = handleRevealIdentity;
                    } else {
                      leftButtonLabel = "ĐÃ DÙNG";
                    }
                  }
                  
                  // Button 2: Roll / End Turn
                  let isRightButtonActive = false;
                  let rightButtonLabel = "CHỜ LƯỢT";
                  let rightButtonAction = null;
                  
                  if (isMyTurn && !isGameOver) {
                    isRightButtonActive = true;
                    if ("roll" === activeGame.phase) {
                      rightButtonLabel = "ĐỔ XÚC XẮC";
                      rightButtonAction = handleRollMove;
                    } else if ("action" === activeGame.phase) {
                      rightButtonLabel = "BỎ QUA";
                      rightButtonAction = handleEndTurn;
                    } else if ("attack" === activeGame.phase) {
                      const hasHandgun = currentTurnPlayer.equipments.includes("s_handgun");
                      const targets = activeGame.players.filter((p) => {
                        if (playerId === p.id || p.isDead) return false;
                        const inSame = areLocationsInSameArea(currentTurnPlayer.locationId, p.locationId);
                        return hasHandgun ? !inSame : inSame;
                      });
                      
                      if (currentTurnPlayer.equipments.includes("s_masamune") && targets.length > 0) {
                        rightButtonLabel = "TẤN CÔNG";
                        isRightButtonActive = false;
                      } else {
                        rightButtonLabel = "HẾT LƯỢT";
                        rightButtonAction = handleEndTurn;
                      }
                    }
                  }

                  return (
                    <div className="grid grid-cols-12 items-center gap-3 sm:gap-4 bg-neutral-900 border border-neutral-800 p-3 sm:p-5 rounded-2xl shrink-0">
                      
                      {/* Left: Status (Spans 7/12 columns on mobile, 8/12 on tablet+) */}
                      <div className="col-span-7 sm:col-span-8 flex flex-col text-left justify-center min-w-0">
                        <div>
                          <span className="text-[8px] sm:text-[10px] text-neutral-500 uppercase tracking-widest block font-bold mb-0.5">
                            Trạng thái
                          </span>
                          <span className="text-[10px] sm:text-xs text-neutral-300 font-extrabold truncate block">
                            {isGameOver
                              ? "Trận đấu đã khép lại."
                              : `Đang đợi ${activeGame.players[activeGame.turnIndex].name}...`}
                          </span>
                        </div>
                      </div>

                      {/* Right: Circular Action Buttons (Spans 5/12 columns on mobile, 4/12 on tablet+) */}
                      <div className="col-span-5 sm:col-span-4 flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
                        {/* Reveal / Skill Button */}
                        <button
                          onClick={() => leftButtonAction?.()}
                          disabled={!isLeftButtonActive}
                          className={`w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 text-center flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 shadow-lg ${
                            isLeftButtonActive
                              ? "bg-purple-950/15 border-purple-500 text-purple-300 hover:bg-purple-900/35 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer ring-1 ring-purple-500/20"
                              : "bg-neutral-900/30 border-neutral-850 text-neutral-600 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {leftButtonLabel === "KỸ NĂNG" ? (
                            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-purple-400" />
                          ) : (
                            <Eye className={`w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 ${isLeftButtonActive ? "text-purple-400" : "text-neutral-600"}`} />
                          )}
                          <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider leading-tight max-w-[45px] sm:max-w-[75px] truncate">{leftButtonLabel}</span>
                        </button>

                        {/* Roll / End Turn Button */}
                        <button
                          onClick={() => rightButtonAction?.()}
                          disabled={!isRightButtonActive}
                          className={`w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 text-center flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 shadow-lg ${
                            isRightButtonActive
                              ? "bg-rose-950/15 border-rose-500 text-rose-300 hover:bg-rose-900/35 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.2)] cursor-pointer ring-1 ring-rose-500/20"
                              : "bg-neutral-900/30 border-neutral-850 text-neutral-600 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {isRightButtonActive ? (
                            "roll" === activeGame.phase ? (
                              <Dices className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-rose-450" />
                            ) : (
                              <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-rose-400" />
                            )
                          ) : (
                            <Dices className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-neutral-600" />
                          )}
                          <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider leading-tight max-w-[45px] sm:max-w-[75px] truncate">{rightButtonLabel}</span>
                        </button>
                      </div>

                    </div>
                  );
                })()}
              </div>


            </div>
          </div>
        )}

        {/* MODAL BỐC BÀI TỰ ĐỘNG / CỔNG BÓNG TỐI (CHỈ HIỂN THỊ CHO NGƯỜI CHƠI ĐANG ĐẾN LƯỢT) */}
        {(null !== activeDrawnCard || true === showGateSelection) && null !== activeGame && playerId === activeGame.players[activeGame.turnIndex]?.id && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-5 overflow-hidden">
              
              {/* Thanh viền màu phát sáng theo loại bài */}
              <div 
                className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${
                  activeDrawnCard
                    ? activeDrawnCard.type === CardType.HERMIT 
                      ? "bg-emerald-500" 
                      : activeDrawnCard.type === CardType.LIGHT 
                        ? "bg-blue-500" 
                        : "bg-orange-500"
                    : "bg-purple-500"
                }`}
              />

              {/* TIÊU ĐỀ MODAL */}
              <div className="text-center space-y-1">
                <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  {showGateSelection && !selectedGateDeck ? "Cổng Bóng Tối (Underworld Gate)" : "Hành Động Địa Điểm"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
                  {showGateSelection && !selectedGateDeck 
                    ? "Rút Một Thẻ Bài Tùy Chọn" 
                    : ""}
                </h3>
                {showGateSelection && !selectedGateDeck && (
                  <p className="text-xs text-neutral-400">
                    Bạn được phép rút một lá bài bất kỳ từ 1 trong 3 chồng bài thần thoại.
                  </p>
                )}
              </div>

              {/* NỘI DUNG 1: CHƯA CHỌN CỌC BÀI Ở CỔNG BÓNG TỐI */}
              {showGateSelection && !selectedGateDeck && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  {/* Hermit */}
                  <button
                    onClick={() => handleSelectGateDeck(CardType.HERMIT)}
                    className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-14 bg-emerald-900/10 border-2 border-dashed border-emerald-500/30 group-hover:border-emerald-500/60 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm transition-all">
                      ?
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[11px]">Thẻ Ẩn Sĩ</h4>
                      <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Dò hỏi thân phận đối phương</p>
                    </div>
                  </button>

                  {/* Light */}
                  <button
                    onClick={() => handleSelectGateDeck(CardType.LIGHT)}
                    className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-blue-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-14 bg-blue-900/10 border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/60 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm transition-all">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[11px]">Thẻ Ánh Sáng</h4>
                      <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Hồi máu, gia tăng phòng ngự</p>
                    </div>
                  </button>

                  {/* Shadow */}
                  <button
                    onClick={() => handleSelectGateDeck(CardType.SHADOW)}
                    className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-orange-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-14 bg-orange-900/10 border-2 border-dashed border-orange-500/30 group-hover:border-orange-500/60 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm transition-all">
                      🔥
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[11px]">Thẻ Bóng Tối</h4>
                      <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Ma pháp tấn công hỏa lực</p>
                    </div>
                  </button>
                </div>
              )}

              {/* NỘI DUNG 2: ĐÃ CÓ THẺ BÀI RÚT ĐƯỢC (TỰ ĐỘNG HOẶC SAU KHI CHỌN CỔNG BÓNG TỐI) */}
              {activeDrawnCard && (
                <div className="space-y-4 animate-scaleUp">
                  {/* Giao diện thẻ tối giản */}
                  <div className={`p-5 rounded-2xl border bg-neutral-900/60 space-y-3.5 text-center relative ${
                    CardType.HERMIT === activeDrawnCard.type
                      ? "border-emerald-900/50"
                      : CardType.LIGHT === activeDrawnCard.type
                        ? "border-blue-900/50"
                        : "border-orange-900/50"
                  }`}>
                    {/* Tên thẻ */}
                    <h4 className="text-white font-extrabold text-base tracking-tight leading-none">
                      {activeDrawnCard.name}
                    </h4>

                    {/* Loại thẻ */}
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        CardType.HERMIT === activeDrawnCard.type
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : CardType.LIGHT === activeDrawnCard.type
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>
                        {CardType.HERMIT === activeDrawnCard.type ? "Thẻ Ẩn Sĩ" : CardType.LIGHT === activeDrawnCard.type ? "Thẻ Ánh Sáng" : "Thẻ Bóng Tối"}
                      </span>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 uppercase tracking-wider">
                        {activeDrawnCard.isEquipment ? "🎒 Trang bị vĩnh viễn" : "⚡ Vật phẩm dùng 1 lần"}
                      </span>
                    </div>

                    {/* Tác dụng thẻ */}
                    <div className="space-y-2 text-center text-neutral-300">
                      <p className="text-xs leading-relaxed font-semibold">
                        {activeDrawnCard.description}
                      </p>
                      {activeDrawnCard.effectText && activeDrawnCard.description !== activeDrawnCard.effectText && (
                        <p className="text-[10px] text-amber-400/90 font-medium italic border-t border-neutral-850/50 pt-2 leading-relaxed">
                          💡 {activeDrawnCard.effectText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CHỌN MỤC TIÊU (NẾU CẦN) */}
                  <div className="bg-neutral-900/40 p-4 border border-neutral-900 rounded-2xl space-y-3.5">
                    {activeDrawnCard.type === CardType.HERMIT ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-neutral-400">
                          Chọn 1 đối thủ để gửi mật thư Ẩn Sĩ:
                        </label>
                        <select
                          value={selectedTargetId}
                          onChange={(e) => setSelectedTargetId(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">-- Chọn một đối thủ --</option>
                          {activeGame.players
                            .filter((p) => p.id !== playerId && !p.isDead)
                            .map((p) => {
                              const showHp = p.alignmentRevealed;
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.isBot ? "(Bot)" : ""} (HP: {showHp ? `${p.currentHp}/${p.character.hp}` : "??/??"})
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    ) : "l_firstaid" === activeDrawnCard.id || "l_blessing" === activeDrawnCard.id || "l_disenchant" === activeDrawnCard.id || "s_spider" === activeDrawnCard.id || "s_doll" === activeDrawnCard.id || activeDrawnCard.id.startsWith("s_bat") ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-neutral-400">
                          Chọn 1 đối tượng để kích hoạt hiệu ứng:
                        </label>
                        <select
                          value={selectedTargetId}
                          onChange={(e) => setSelectedTargetId(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">-- Chọn đối tượng --</option>
                          {/* Có thể chọn chính mình nếu là bài hồi phục l_firstaid */}
                          {"l_firstaid" === activeDrawnCard.id && (
                            <option value={playerId}>Bản thân ({activeGame.players.find(p => playerId === p.id)?.name})</option>
                          )}
                          {activeGame.players
                            .filter((p) => p.id !== playerId && !p.isDead)
                            .map((p) => {
                              const showHp = p.alignmentRevealed;
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.isBot ? "(Bot)" : ""} (HP: {showHp ? `${p.currentHp}/${p.character.hp}` : "??/??"})
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    ) : activeDrawnCard.id === "s_banana" ? (
                      <div className="space-y-3">
                        {(() => {
                          const me = activeGame.players.find(p => p.id === playerId);
                          const myEquips = me ? me.equipments : [];
                          
                          if (myEquips.length > 0) {
                            return (
                              <>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-neutral-400">
                                    Chọn 1 trang bị của bạn để chuyển giao:
                                  </label>
                                  <select
                                    value={selectedEquipId}
                                    onChange={(e) => {
                                      const nextEquipId = e.target.value;
                                      setSelectedEquipId(nextEquipId);
                                      const targetPart = selectedTargetId.split(":")[0];
                                      if (targetPart) {
                                        setSelectedTargetId(`${targetPart}:${nextEquipId}`);
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                                  >
                                    <option value="">-- Chọn trang bị --</option>
                                    {myEquips.map((eqId) => {
                                      const eqCard = getCardById(eqId);
                                      return eqCard ? (
                                        <option key={eqId} value={eqId}>{eqCard.name}</option>
                                      ) : null;
                                    })}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-neutral-400">
                                    Chọn 1 đối thủ nhận trang bị:
                                  </label>
                                  <select
                                    value={selectedTargetId.split(":")[0]}
                                    onChange={(e) => {
                                      const chosenTarget = e.target.value;
                                      setSelectedTargetId(`${chosenTarget}:${selectedEquipId}`);
                                    }}
                                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                                  >
                                    <option value="">-- Chọn đối thủ --</option>
                                    {activeGame.players
                                      .filter((p) => p.id !== playerId && !p.isDead)
                                      .map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} {p.isBot ? "(Bot)" : ""}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <div className="space-y-2">
                                <p className="text-[11px] text-amber-400 font-bold">
                                  ⚠️ Bạn không có trang bị nào! Bạn sẽ nhận 1 sát thương khi xác nhận thẻ bài này.
                                </p>
                                <label className="block text-[11px] font-semibold text-neutral-400">
                                  Chọn bất kỳ 1 đối thủ để hoàn tất sử dụng thẻ bài:
                                </label>
                                <select
                                  value={selectedTargetId}
                                  onChange={(e) => setSelectedTargetId(e.target.value)}
                                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                  <option value="">-- Chọn đối thủ --</option>
                                  {activeGame.players
                                    .filter((p) => p.id !== playerId && !p.isDead)
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.isBot ? "(Bot)" : ""}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : activeDrawnCard.id.startsWith("s_goblin") ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-neutral-400">
                            Chọn đối thủ sở hữu trang bị để cướp:
                          </label>
                          <select
                            value={selectedTargetId.split(":")[0]}
                            onChange={(e) => {
                              const chosenTarget = e.target.value;
                              setSelectedTargetId(`${chosenTarget}:`);
                              setSelectedEquipId(""); // reset equip selection
                            }}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                          >
                            <option value="">-- Chọn đối thủ --</option>
                            {activeGame.players
                              .filter((p) => p.id !== playerId && !p.isDead && p.equipments.length > 0)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.isBot ? "(Bot)" : ""} ({p.equipments.length} trang bị)
                                </option>
                              ))}
                          </select>
                        </div>
                        {selectedTargetId.split(":")[0] && (
                          <div className="space-y-1 animate-fadeIn">
                            <label className="block text-[11px] font-semibold text-neutral-400">
                              Chọn trang bị muốn cướp từ họ:
                            </label>
                            <select
                              value={selectedEquipId}
                              onChange={(e) => {
                                const nextEquipId = e.target.value;
                                setSelectedEquipId(nextEquipId);
                                const targetPart = selectedTargetId.split(":")[0];
                                setSelectedTargetId(`${targetPart}:${nextEquipId}`);
                              }}
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                            >
                              <option value="">-- Chọn trang bị --</option>
                              {activeGame.players
                                .find(p => p.id === selectedTargetId.split(":")[0])
                                ?.equipments.map((eqId) => {
                                  const eqCard = getCardById(eqId);
                                  return eqCard ? (
                                    <option key={eqId} value={eqId}>{eqCard.name}</option>
                                  ) : null;
                                })}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 leading-relaxed justify-center text-center py-1">
                        <span>🎯 Thẻ này sẽ được kích hoạt áp dụng trực tiếp lên bản thân bạn.</span>
                      </div>
                    )}

                    {/* CÁC NÚT ĐIỀU KHIỂN */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          handleUseCard(activeDrawnCard.id, selectedTargetId || null);
                          setSelectedTargetId("");
                          setSelectedEquipId("");
                        }}
                        disabled={
                          (CardType.HERMIT === activeDrawnCard.type && !selectedTargetId) ||
                          (("l_firstaid" === activeDrawnCard.id || "l_blessing" === activeDrawnCard.id || "l_disenchant" === activeDrawnCard.id || "s_spider" === activeDrawnCard.id || "s_doll" === activeDrawnCard.id || activeDrawnCard.id.startsWith("s_bat")) && !selectedTargetId) ||
                          ("s_banana" === activeDrawnCard.id && (!selectedTargetId || (activeGame.players.find(p => playerId === p.id)?.equipments.length || 0) > 0 && !selectedEquipId)) ||
                          (activeDrawnCard.id.startsWith("s_goblin") && (!selectedTargetId.split(":")[0] || !selectedEquipId))
                        }
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 rounded-xl text-xs font-bold text-white transition-all shadow"
                      >
                        {activeDrawnCard.isEquipment ? "🎒 Xác Nhận Trang Bị" : "🔥 Kích Hoạt Thẻ Bài"}
                      </button>
                      <button
                        onClick={() => {
                          handleCancelCard();
                          setSelectedTargetId("");
                        }}
                        className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 transition-all"
                      >
                        Bỏ Qua
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* DIALOG CHỌN KHU VỰC DI CHUYỂN TỰ DO (KHI ĐỔ RA 7 HOẶC DÙNG CỔNG BÓNG TỐI) */}
      {true === showLocationChoice && null !== activeGame && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="text-center space-y-1">
              <span className={`text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                "action" === activeGame.phase
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {"action" === activeGame.phase ? "Cổng Dịch Chuyển Bóng Tối" : "Đổ Ra Số 7 May Mắn"}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight pt-1">
                {"action" === activeGame.phase ? "Dịch Chuyển Cổng Bóng Tối" : "Chọn Điểm Dịch Chuyển Tự Do"}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hãy click chọn 1 địa điểm bất kỳ dưới đây để dịch chuyển token đến đó! (Trừ vị trí hiện tại của bạn)
              </p>
            </div>

            {/* THÔNG TIN VỊ TRÍ HIỆN TẠI & NGƯỜI CHƠI CHƯA DI CHUYỂN */}
            {(() => {
              const currentLocId = activeGame.players.find(p => p.id === playerId)?.locationId;
              const currentLoc = currentLocId ? LOCATIONS.find(l => l.id === currentLocId) : null;
              const otherPlayersAtCurrentLoc = currentLocId ? activeGame.players.filter(
                p => p.id !== playerId && false === p.isDead && p.locationId === currentLocId
              ) : [];
              const unmovedPlayers = activeGame.players.filter(
                p => false === p.isDead && null === p.locationId
              );

              return (
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-[11px] space-y-2 text-left font-sans shadow-inner">
                  {null !== currentLoc && undefined !== currentLoc ? (
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-neutral-400 font-medium">
                        📍 Vị trí hiện tại của bạn: <strong className="text-rose-400">{currentLoc.name}</strong>
                      </span>
                      {0 < otherPlayersAtCurrentLoc.length ? (
                        <span className="text-amber-400 font-semibold">
                          (Đang đứng cùng: {otherPlayersAtCurrentLoc.map(p => p.name).join(", ")})
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic text-[10px]">(Không có ai đứng cùng)</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-amber-400 font-semibold flex items-center gap-1">
                      📍 Bạn chưa di chuyển đến vị trí nào trên bản đồ.
                    </div>
                  )}

                  {0 < unmovedPlayers.length && (
                    <div className="text-neutral-400 pt-1.5 border-t border-neutral-900 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-500">👥 Chưa di chuyển (chờ lượt 1):</span>
                      <span className="text-amber-300 font-bold text-[10px]">{unmovedPlayers.map(p => p.name).join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* LƯỚI 3 CỘT - GIỮ NGUYÊN CẤU TRÚC CẶP ĐÔI NHƯ BẢNG CHƠI */}
            {(() => {
              const currentLocId = activeGame.players.find(p => p.id === playerId)?.locationId;
              const areaGroups = [
                {
                  label: "Khu Vực A",
                  color: "text-violet-400 border-violet-500/30 bg-violet-500/5",
                  dot: "bg-violet-500",
                  ids: ["loc_hermit", "loc_fountain"]
                },
                {
                  label: "Khu Vực B",
                  color: "text-sky-400 border-sky-500/30 bg-sky-500/5",
                  dot: "bg-sky-500",
                  ids: ["loc_church", "loc_cemetery"]
                },
                {
                  label: "Khu Vực C",
                  color: "text-amber-400 border-amber-500/30 bg-amber-500/5",
                  dot: "bg-amber-500",
                  ids: ["loc_woods", "loc_anvil"]
                }
              ];

              return (
                <div className="grid grid-cols-3 gap-4">
                  {areaGroups.map(group => (
                    <div key={group.label} className={`rounded-xl border p-3 space-y-3 ${group.color}`}>
                      {/* Area header */}
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{group.label}</span>
                        <span className="text-[9px] opacity-60">(cùng tầm đánh)</span>
                      </div>

                      {/* Two locations in this area */}
                      <div className="space-y-2">
                        {group.ids.map(locId => {
                          const loc = LOCATIONS.find(l => l.id === locId)!;
                          const isCurrentLoc = locId === currentLocId;
                          const isFiltered = compassChoices ? !compassChoices.includes(locId) : false;

                          if (!loc || isFiltered) return null;

                          const otherStandingPlayers = activeGame.players.filter(
                            p => p.id !== playerId && false === p.isDead && p.locationId === locId
                          );

                          if (isCurrentLoc) {
                            return (
                              <div
                                key={locId}
                                className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-700 opacity-50 cursor-not-allowed space-y-1.5"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[11px] text-neutral-400 line-through">{loc.name}</span>
                                  <span className="text-[9px] text-neutral-600 font-mono bg-neutral-900 px-1.5 py-0.5 rounded">
                                    {loc.rollValues.join("/")}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-600 leading-relaxed">Vị trí hiện tại của bạn</p>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={locId}
                              onClick={() => handleLocationChoice(locId)}
                              className="w-full p-3 bg-neutral-950 hover:bg-rose-950/20 border border-neutral-800 hover:border-rose-500/40 rounded-lg text-left text-white transition-all space-y-1.5 group cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[11px] text-white group-hover:text-rose-400 transition-colors">
                                  {loc.name}
                                </span>
                                <span className="text-[9px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                                  {loc.rollValues.join("/")}
                                </span>
                              </div>

                              <p className="text-[10px] text-neutral-400 leading-relaxed font-normal">
                                {loc.description}
                              </p>

                              <div className="pt-1.5 border-t border-neutral-900/80 flex items-center justify-between text-[9px]">
                                <span className="text-neutral-500 font-medium">Đối thủ ở đây:</span>
                                {0 < otherStandingPlayers.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {otherStandingPlayers.map(p => (
                                      <span
                                        key={p.id}
                                        className="px-1.5 py-0.5 rounded font-bold text-white shadow-sm"
                                        style={{ backgroundColor: p.color + "30", border: `1px solid ${p.color}60` }}
                                      >
                                        {p.name}{p.isBot ? " (Bot)" : ""}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-neutral-600 italic">Trống</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DIALOG LỊCH SỬ TRẬN ĐẤU */}
      {showHistoryDialog && activeGame && (
        <div 
          onClick={() => setShowHistoryDialog(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
          >
            <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nhật Ký Trận Đấu</h3>
              <button
                onClick={() => setShowHistoryDialog(false)}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 transition-colors border border-neutral-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 max-h-[65vh]">
              <GameLogs logs={activeGame.logs} />
            </div>
          </div>
        </div>
      )}

      {/* DIALOG THÔNG TIN CHI TIẾT NGƯỜI CHƠI */}
      {selectedPlayerForInfo && activeGame && (
        <div 
          onClick={() => setSelectedPlayerForInfo(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-5 overflow-hidden text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-full shadow" 
                  style={{ backgroundColor: selectedPlayerForInfo.color }}
                />
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
                  Thông Tin: {selectedPlayerForInfo.name} {selectedPlayerForInfo.isBot ? "(Bot)" : ""}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlayerForInfo(null)}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 transition-colors border border-neutral-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Trạng thái sinh tử */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <span className="text-neutral-400 font-medium">Trạng thái:</span>
                {selectedPlayerForInfo.isDead ? (
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase">
                    ĐÃ TỬ VONG (Tử trận)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    ĐANG SINH TỒN
                  </span>
                )}
              </div>

              {/* Máu */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <span className="text-neutral-400 font-medium">Máu (HP):</span>
                <span className="font-mono text-white font-bold">
                  {selectedPlayerForInfo.id === playerId || selectedPlayerForInfo.alignmentRevealed || selectedPlayerForInfo.isDead
                    ? `${selectedPlayerForInfo.currentHp} / ${selectedPlayerForInfo.character.hp} HP`
                    : `??? (Số máu đã mất: ${selectedPlayerForInfo.character.hp - selectedPlayerForInfo.currentHp})`}
                </span>
              </div>

              {/* Phe phái */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <span className="text-neutral-400 font-medium">Phe phái:</span>
                {selectedPlayerForInfo.id === playerId || selectedPlayerForInfo.alignmentRevealed || selectedPlayerForInfo.isDead ? (
                  <span className={`font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                    selectedPlayerForInfo.character.alignment === Alignment.SHADOW 
                      ? "text-red-400 bg-red-950/20 border-red-900/30" 
                      : selectedPlayerForInfo.character.alignment === Alignment.HUNTER
                        ? "text-blue-400 bg-blue-950/20 border-blue-900/30" 
                        : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                  }`}>
                    {selectedPlayerForInfo.character.alignment === Alignment.SHADOW 
                      ? "Bóng Tối" 
                      : selectedPlayerForInfo.character.alignment === Alignment.HUNTER 
                        ? "Thợ Săn" 
                        : "Trung Lập"}
                  </span>
                ) : (
                  <span className="text-neutral-500 font-bold font-mono">???</span>
                )}
              </div>

              {/* Nhân vật */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
                <span className="text-neutral-400 font-medium">Nhân vật:</span>
                {selectedPlayerForInfo.id === playerId || selectedPlayerForInfo.alignmentRevealed || selectedPlayerForInfo.isDead ? (
                  <span className="text-white font-bold uppercase">{selectedPlayerForInfo.character.name}</span>
                ) : (
                  <span className="text-neutral-500 font-bold font-mono">???</span>
                )}
              </div>

              {/* Siêu năng lực */}
              {(selectedPlayerForInfo.id === playerId || selectedPlayerForInfo.alignmentRevealed || selectedPlayerForInfo.isDead) && (
                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-bold text-rose-400 uppercase tracking-wide text-[10px]">
                    ⚡ Siêu Năng Lực: {selectedPlayerForInfo.character.abilityName}
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    {selectedPlayerForInfo.character.abilityDesc}
                  </p>
                  <div className="text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-1 mt-1 leading-relaxed">
                    <strong>Điều kiện thắng:</strong> {selectedPlayerForInfo.character.winCondition}
                  </div>
                </div>
              )}

              {/* Trang bị */}
              <div className="space-y-2">
                <span className="text-neutral-400 font-medium block">Trang bị hiện có:</span>
                {selectedPlayerForInfo.equipments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlayerForInfo.equipments.map((eqId, eqIdx) => {
                      const card = getCardById(eqId);
                      return card ? (
                        <span 
                          key={eqIdx}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            card.type === CardType.LIGHT 
                              ? "bg-blue-950/10 text-blue-300 border-blue-900/30" 
                              : "bg-orange-950/10 text-orange-300 border-orange-900/30"
                          }`}
                        >
                          ⚔️ {card.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-neutral-600 italic">Không sở hữu trang bị nào.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG KẾT QUẢ TRẬN ĐẤU (GAME OVER) */}
      {"game_over" === activeGame?.phase && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative space-y-6 text-center overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* TIÊU ĐỀ */}
            <div className="space-y-1 shrink-0">
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">
                Trận Đấu Kết Thúc
              </span>
              <h3 className="text-xl font-extrabold text-white uppercase tracking-wider pt-1">
                🏆 BẢNG VÀNG CHIẾN THẮNG 🏆
              </h3>
            </div>

            {/* PHE THẮNG + ĐIỀU KIỆN THẮNG + DANH SÁCH NGƯỜI THẮNG */}
            {(() => {
              const winners = activeGame.players.filter(p => {
                return activeGame.winnerPlayerIds?.includes(p.id) || false;
              });
              const winnerNames = winners.map(p => p.name + (p.isBot ? " (Bot)" : ""));
              // Lấy điều kiện thắng từ nhân vật của người thắng đầu tiên
              const winCondition = winners.length > 0 ? winners[0].character.winCondition : null;

              return (
                <div className="bg-rose-950/15 border border-rose-900/30 p-4 rounded-2xl space-y-3 shrink-0 text-left">
                  {/* Tên phe */}
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-rose-400 uppercase tracking-widest font-black block">
                      Thế lực chiến thắng:
                    </span>
                    <div className="text-2xl font-black text-emerald-400 uppercase drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                      {Array.isArray(activeGame.winnerAlignment)
                        ? activeGame.winnerAlignment.join(" & ")
                        : String(activeGame.winnerAlignment)}
                    </div>
                  </div>

                  {/* Điều kiện thắng */}
                  {winCondition && (
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-3 py-2">
                      <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block mb-1">🎯 Điều kiện chiến thắng:</span>
                      <p className="text-[11px] text-amber-300 font-semibold leading-relaxed">{winCondition}</p>
                    </div>
                  )}

                  {/* Danh sách người thắng */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-2">
                    <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block mb-1.5">🏆 Người chiến thắng:</span>
                    {winnerNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {winnerNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold"
                          >
                            🏆 {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-[11px] italic">Không xác định được người thắng.</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* DANH SÁCH CHI TIẾT DANH TÍNH CỦA CÁC PLAYER */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left scrollbar-thin">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block mb-1">
                Chi tiết thân phận người chơi:
              </span>
              {activeGame.players.map((p) => {
                const maxHp = p.character.hp;
                const lostHp = maxHp - p.currentHp;
                const isWinner = activeGame.winnerPlayerIds?.includes(p.id) || false;
                
                return (
                  <div 
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isWinner
                        ? "bg-emerald-950/20 border-emerald-900/40"
                        : p.isDead 
                          ? "bg-neutral-950/20 border-neutral-900 opacity-60" 
                          : "bg-neutral-900/60 border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {isWinner && <span className="text-amber-400">🏆</span>}
                          {p.name} {p.isBot ? "(Bot)" : ""}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Nhân vật: <strong className="text-white uppercase">{p.character.name}</strong>
                        </div>
                        <div className="text-[9px] text-neutral-600 mt-0.5 leading-tight">
                          ĐK Thắng: <span className="text-neutral-500">{p.character.winCondition}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right leading-tight">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider block w-fit ml-auto ${
                        Alignment.SHADOW === p.character.alignment 
                          ? "text-red-400 bg-red-950/20 border-red-900/30" 
                          : Alignment.HUNTER === p.character.alignment
                            ? "text-blue-400 bg-blue-950/20 border-blue-900/30" 
                            : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                      }`}>
                        {p.character.alignment === Alignment.SHADOW 
                          ? "Bóng Tối" 
                          : p.character.alignment === Alignment.HUNTER 
                            ? "Thợ Săn" 
                            : "Trung Lập"}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                        {p.isDead ? "☠️ Tử trận" : `❤️ HP: ${p.currentHp}/${maxHp}`} (Mất {lostHp} HP)
                      </span>
                    </div>
                  </div>
                );
                  })}
                </div>

            {/* BUTTON QUAY TRỞ LẠI */}
            <div className="pt-2 shrink-0">
              <button
                onClick={handleReturnFromGameOver}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] rounded-2xl text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                QUAY TRỞ LẠI
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG XEM TRỘM THÂN PHẬN (DỰ ĐOÁN CỦA ẨN SĨ) */}
      {activeGame && activeGame.hermitTargetIdentityShown && activeGame.hermitTargetIdentityShown.viewerId === playerId && (
        <div 
          onClick={handleCloseIdentityShown}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-5 text-center relative overflow-hidden cursor-default"
          >
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">
              Dự Đoán Của Ẩn Sĩ
            </span>
            <div className="space-y-2">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
                BẢN TIN MẬT BÁO
              </h3>
              <p className="text-xs text-neutral-400">
                Thân phận của đối thủ <strong className="text-white">{activeGame.players.find(p => p.id === activeGame.hermitTargetIdentityShown?.targetId)?.name}</strong> đã bị hé lộ riêng cho bạn:
              </p>
            </div>

            <div className="bg-neutral-900/60 p-4 border border-neutral-800 rounded-2xl space-y-2 text-left">
              <div className="text-xs flex justify-between">
                <span className="text-neutral-400">Nhân vật:</span>
                <span className="text-white font-extrabold uppercase">{activeGame.hermitTargetIdentityShown.characterName}</span>
              </div>
              <div className="text-xs flex justify-between">
                <span className="text-neutral-400">Phe phái:</span>
                <span className={`font-bold uppercase tracking-wider ${
                  activeGame.hermitTargetIdentityShown.alignment === Alignment.SHADOW 
                    ? "text-red-400" 
                    : activeGame.hermitTargetIdentityShown.alignment === Alignment.HUNTER
                      ? "text-blue-400" 
                      : "text-amber-400"
                }`}>
                  {activeGame.hermitTargetIdentityShown.alignment === Alignment.SHADOW 
                    ? "Bóng Tối" 
                    : activeGame.hermitTargetIdentityShown.alignment === Alignment.HUNTER 
                      ? "Thợ Săn" 
                      : "Trung Lập"}
                </span>
              </div>
            </div>

            <button
              onClick={handleCloseIdentityShown}
              className="w-full py-2.5 bg-neutral-850 hover:bg-neutral-800 rounded-xl text-xs font-bold text-white transition-all shadow border border-neutral-800 cursor-pointer"
            >
              Đồng Ý / Đã Xem
            </button>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

    </div>
  );
}
