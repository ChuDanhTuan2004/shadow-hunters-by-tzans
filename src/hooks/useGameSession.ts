import { useState, useEffect, useRef } from "react";
import { Alignment, GameState } from "../types";
import { listenToRoom, updateRoomState } from "../firebase";

export function useGameSession() {
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem("sh_player_id");
    if (saved) return saved;
    const newId = "usr_" + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("sh_player_id", newId);
    return newId;
  });

  const [playerName, setPlayerNameState] = useState(() => {
    return localStorage.getItem("sh_player_name") || `Kẻ ẩn danh #${Math.floor(Math.random() * 900) + 100}`;
  });

  const setPlayerName = (name: string) => {
    const trimmed = name.slice(0, 50);
    setPlayerNameState(trimmed);
    localStorage.setItem("sh_player_name", trimmed);
  };

  const [view, setView] = useState<"lobby" | "waiting_room" | "character_select" | "playing">(() => {
    const saved = sessionStorage.getItem("sh_view");
    if (saved === "lobby" || saved === "waiting_room" || saved === "character_select" || saved === "playing") return saved;
    return "lobby";
  });

  const [lobbyInitialView, setLobbyInitialView] = useState<"home" | "start">("home");

  // Reset lobbyInitialView về home khi người chơi rời khỏi lobby
  useEffect(() => {
    if (view !== "lobby") {
      setLobbyInitialView("home");
    }
  }, [view]);

  const [gameMode, setGameMode] = useState<"solo" | "multiplayer" | null>(() => {
    const saved = sessionStorage.getItem("sh_game_mode");
    if (saved === "solo" || saved === "multiplayer") return saved;
    return null;
  });

  const [roomId, setRoomId] = useState<string | null>(() => {
    return sessionStorage.getItem("sh_room_id") || null;
  });

  const [activeGame, setActiveGame] = useState<GameState | null>(() => {
    const savedGameMode = sessionStorage.getItem("sh_game_mode");
    if ("solo" === savedGameMode) {
      const savedSoloGame = sessionStorage.getItem("sh_active_game_solo");
      if (savedSoloGame) {
        try {
          return JSON.parse(savedSoloGame);
        } catch (e) {
          console.error("Failed to parse saved solo game:", e);
        }
      }
    }
    return null;
  });

  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  const notificationCallbackRef = useRef<(() => void) | null>(null);
  const leavingVoluntarilyRef = useRef(false);

  const clearNotification = () => {
    notificationCallbackRef.current?.();
    notificationCallbackRef.current = null;
    setNotification(null);
  };

  const markLeavingVoluntarily = () => {
    leavingVoluntarilyRef.current = true;
  };

  // Đồng bộ hóa trạng thái phiên chơi vào sessionStorage
  useEffect(() => {
    sessionStorage.setItem("sh_view", view);
  }, [view]);

  useEffect(() => {
    if (gameMode) {
      sessionStorage.setItem("sh_game_mode", gameMode);
    } else {
      sessionStorage.removeItem("sh_game_mode");
    }
  }, [gameMode]);

  useEffect(() => {
    if (roomId) {
      sessionStorage.setItem("sh_room_id", roomId);
    } else {
      sessionStorage.removeItem("sh_room_id");
    }
  }, [roomId]);

  useEffect(() => {
    if ("solo" === gameMode && activeGame) {
      sessionStorage.setItem("sh_active_game_solo", JSON.stringify(activeGame));
    } else if (null === activeGame) {
      sessionStorage.removeItem("sh_active_game_solo");
    }
  }, [activeGame, gameMode]);

  // Đăng ký lắng nghe cập nhật Firebase nếu chơi Multiplayer
  useEffect(() => {
    if ("multiplayer" === gameMode && null !== roomId && ("playing" === view || "waiting_room" === view || "character_select" === view)) {
      const unsubscribe = listenToRoom(roomId, (updatedState: GameState) => {
        if (null === updatedState || undefined === updatedState) {
          const doReset = () => {
            setView("lobby");
            setLobbyInitialView("start");
            setGameMode(null);
            setRoomId(null);
            setActiveGame(null);
          };
          setNotification({ title: "Phòng không tồn tại", message: "Phòng không tồn tại hoặc đã bị hủy." });
          notificationCallbackRef.current = doReset;
          return;
        }

        // Nếu phòng bị chủ phòng hủy / kết thúc
        if ("cancelled" === updatedState.phase) {
          if (playerId !== (updatedState.hostId || updatedState.players[0]?.id)) {
            const doReset = () => {
              setView("lobby");
              setLobbyInitialView("start");
              setGameMode(null);
              setRoomId(null);
              setActiveGame(null);
            };
            setNotification({ title: "Phòng đã bị hủy", message: "⚠️ Chủ phòng đã hủy phòng / kết thúc trận đấu." });
            notificationCallbackRef.current = doReset;
          } else {
            setView("lobby");
            setLobbyInitialView("start");
            setGameMode(null);
            setRoomId(null);
            setActiveGame(null);
          }
          return;
        }

        // Nếu bản thân bị đuổi khỏi phòng
        if (false === updatedState.players.some(p => p.id === playerId)) {
          if (!leavingVoluntarilyRef.current) {
            const doReset = () => {
              setView("lobby");
              setLobbyInitialView("start");
              setGameMode(null);
              setRoomId(null);
              setActiveGame(null);
            };
            setNotification({ title: "Bị đuổi khỏi phòng", message: "Bạn đã bị chủ phòng đuổi ra khỏi phòng." });
            notificationCallbackRef.current = doReset;
          } else {
            leavingVoluntarilyRef.current = false;
            setView("lobby");
            setLobbyInitialView("start");
            setGameMode(null);
            setRoomId(null);
            setActiveGame(null);
          }
          return;
        }

        setActiveGame(updatedState);

        if (("waiting_room" === view || "character_select" === view) && updatedState.phase === "character_select") {
          setView("character_select");
          return;
        }

        // Chuyển trực tiếp sang màn hình chơi từ phòng chờ hoặc màn hình chọn nhân vật khi game bắt đầu
        if (("waiting_room" === view || "character_select" === view) && updatedState.phase !== "lobby" && updatedState.phase !== "character_select") {
          setView("playing");
        }
      });
      return () => unsubscribe();
    }
  }, [gameMode, roomId, view, playerId]);

  const handleEnterRoom = (enteredRoomId: string) => {
    setRoomId(enteredRoomId);
    setGameMode("multiplayer");
    setView("waiting_room");
  };

  const handleAddBotInLobby = async () => {
    if (!activeGame || !roomId) return;
    if (12 <= activeGame.players.length) return;

    const botColors = [
      "#EF4444", "#3B82F6", "#10B981", "#F59E0B", 
      "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280",
      "#84CC16", "#6366F1", "#F97316", "#06B6D4"
    ];
    const botNames = ["Hắc Long Bot", "Bạch Hổ Bot", "Ẩn Sĩ Bot", "Bóng Ma Bot", "Thợ Săn Bot", "Dân Thường Bot"];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];
    const uniqueName = `${randomName} #${Math.floor(Math.random() * 900) + 100}`;

    const newBotPlayer = {
      id: "bot_" + Math.random().toString(36).substring(2, 11),
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
      drawnCards: [],
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

  return {
    playerId,
    playerName,
    setPlayerName,
    view,
    setView,
    lobbyInitialView,
    setLobbyInitialView,
    gameMode,
    setGameMode,
    roomId,
    setRoomId,
    activeGame,
    setActiveGame,
    handleEnterRoom,
    handleAddBotInLobby,
    handleRemovePlayerInLobby,
    notification,
    clearNotification,
    markLeavingVoluntarily
  };
}
