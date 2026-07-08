import React, { useEffect } from "react";
import { useGameSession } from "./hooks/useGameSession";
import { useGameplay } from "./hooks/useGameplay";
import { getCardById, updateCardDecksFromFirebase, DECK_HERMIT, DECK_LIGHT, DECK_SHADOW } from "./data/cards";
import { syncLocalCardsToFirebase, fetchCardsFromFirebase } from "./firebase";
import { LOCATIONS } from "./data/locations";
import { CardType } from "./types";

// Components
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import RulesModal from "./components/RulesModal";
import WaitingRoom from "./components/WaitingRoom";
import PlayerListSidebar from "./components/PlayerListSidebar";
import ActionControls from "./components/ActionControls";

// Dialogs
import HistoryDialog from "./components/dialogs/HistoryDialog";
import PlayerDetailDialog from "./components/dialogs/PlayerDetailDialog";
import GameOverDialog from "./components/dialogs/GameOverDialog";
import HermitPeekDialog from "./components/dialogs/HermitPeekDialog";
import GateSelectionDialog from "./components/dialogs/GateSelectionDialog";
import DrawnCardModal from "./components/dialogs/DrawnCardModal";
import LocationSelectDialog from "./components/dialogs/LocationSelectDialog";

// Icons
import { Shield, BookOpen, Settings, LogOut, RefreshCw, History } from "lucide-react";

export default function App() {
  // Sync card database from Firestore on app mount
  useEffect(() => {
    const initCards = async () => {
      try {
        await syncLocalCardsToFirebase([...DECK_HERMIT, ...DECK_LIGHT, ...DECK_SHADOW]);
        const fbCards = await fetchCardsFromFirebase();
        if (fbCards && fbCards.length > 0) {
          const hermit = fbCards.filter(c => c.type === CardType.HERMIT);
          const light = fbCards.filter(c => c.type === CardType.LIGHT);
          const shadow = fbCards.filter(c => c.type === CardType.SHADOW);
          updateCardDecksFromFirebase(hermit, light, shadow);
          console.log("Dynamically synced card database from Firestore:", fbCards.length);
        }
      } catch (err) {
        console.error("Failed to sync cards database from Firebase:", err);
      }
    };
    initCards();
  }, []);

  // useGameSession hook handles views and sync states
  const {
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
    handleRemovePlayerInLobby
  } = useGameSession();

  // useGameplay hook handles core gameplay interactions
  const {
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
    handleRevealIdentity,
    handleStealEquipment,
    handleEndTurn,
    handleCloseIdentityShown,
    handleReturnFromGameOver,
    handleLeaveGame
  } = useGameplay({
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
  });

  const activeDrawnCard = activeGame?.drawnCardId ? getCardById(activeGame.drawnCardId) || null : null;
  const showGateSelection = activeGame?.showGateSelection || false;
  const selectedGateDeck = activeGame?.selectedGateDeck || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 flex flex-col selection:bg-rose-500/30 selection:text-white">

      {/* HEADER TOPBAR */}
      {"playing" !== view && "lobby" !== view && "waiting_room" !== view && (
        <header className="sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors duration-300 bg-neutral-905/80 backdrop-blur-md border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl transition-all duration-300 border bg-[#4437ac]/15 border-[#7ba2be]/25 text-[#7ba2be] shadow-[0_0_10px_rgba(123,162,190,0.1)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase sm:text-base">
                Shadow Hunters
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7ba2be]">
                Phòng chờ trực tuyến
              </p>
            </div>
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
            onOpenRules={() => setIsRulesOpen(true)}
            initialView={lobbyInitialView}
          />
        )}

        {/* VIEW RECONNECTING/LOADING FOR ACTIVE GAME */}
        {view !== "lobby" && !activeGame && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fadeIn">
            <RefreshCw className="w-12 h-12 text-[#7BA2BE] animate-spin" />
            <h3 className="text-white font-extrabold text-sm uppercase tracking-wider">
              Đang kết nối lại phòng chơi...
            </h3>
            <p className="text-xs text-neutral-400 text-center max-w-xs">
              Vui lòng đợi trong giây lát khi chúng tôi tải lại dữ liệu trận đấu.
            </p>
            <button
              onClick={() => {
                setView("lobby");
                setLobbyInitialView("home");
                setGameMode(null);
                setRoomId(null);
                setActiveGame(null);
              }}
              className="mt-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-xs font-bold text-neutral-300 hover:text-white rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-md"
            >
              Hủy & Trở về Trang chủ
            </button>
          </div>
        )}

        {/* VIEW 2: ROOM WAITING ONLINE */}
        {view === "waiting_room" && activeGame && roomId && (
          <WaitingRoom
            activeGame={activeGame}
            roomId={roomId}
            playerId={playerId}
            playerName={playerName}
            onRemovePlayer={handleRemovePlayerInLobby}
            onAddBot={handleAddBotInLobby}
            onLeave={handleLeaveGame}
            onStartGame={handleStartMultiplayerGame}
          />
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
                <span className="hidden sm:inline text-[9px] text-[#7BA2BE] font-bold bg-[#7BA2BE]/10 border border-[#7BA2BE]/20 px-1.5 py-0.5 rounded">
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
                  <BookOpen className="w-3.5 h-3.5 text-[#7BA2BE]" />
                  <span className="hidden xs:inline">Luật chơi</span>
                </button>
                <span className="text-neutral-850">|</span>

                {/* History button */}
                <button
                  onClick={() => setShowHistoryDialog(true)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                >
                  <History className="w-3.5 h-3.5 text-[#7BA2BE]" />
                  <span className="hidden xs:inline">Lịch sử</span>
                </button>
                <span className="text-neutral-850">|</span>

                {/* Settings button container */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#7BA2BE]" />
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
                          className="w-full text-left py-2 px-3 hover:bg-rose-950/30 text-rose-455 rounded-lg text-xs font-bold transition-all border border-rose-900/30 flex items-center gap-1.5 cursor-pointer animate-fadeIn"
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
            <PlayerListSidebar
              activeGame={activeGame}
              playerId={playerId}
              onSelectPlayer={setSelectedPlayerForInfo}
              mode="mobile"
            />

            {/* Latest Log Display */}
            {(() => {
              const latestLog = activeGame.logs.length > 0 ? activeGame.logs[0] : null;
              if (null === latestLog) return null;
              const logTypeStyles: Record<string, string> = {
                reveal: "bg-amber-950/20 border-l border-amber-500 text-amber-200 hover:bg-amber-950/30 transition-colors",
                attack: "bg-rose-950/20 border-l border-rose-500 text-rose-200 hover:bg-rose-950/30 transition-colors",
                card: "bg-blue-950/20 border-l border-blue-500 text-blue-200 hover:bg-blue-950/30 transition-colors",
                action: "bg-emerald-950/20 border-l border-emerald-500 text-emerald-200 hover:bg-emerald-950/30 transition-colors",
              };
              const logIcons: Record<string, string> = {
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

            {/* Main view container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-6 items-stretch w-full flex-1">

              {/* Left Column (3/12): Player list */}
              <PlayerListSidebar
                activeGame={activeGame}
                playerId={playerId}
                onSelectPlayer={setSelectedPlayerForInfo}
                mode="desktop"
              />

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

                {/* Unified Control Panel */}
                <ActionControls
                  activeGame={activeGame}
                  playerId={playerId}
                  onAttackPlayer={handleAttackPlayer}
                  onStealEquipment={handleStealEquipment}
                  onUseWeirdWoods={handleUseWeirdWoods}
                  onActivateDavidAbility={handleActivateDavidAbility}
                  onRevealOrAbility={handleRevealIdentity}
                  onRollMove={handleRollMove}
                  onEndTurn={handleEndTurn}
                />
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Dialogs & Overlays */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <HistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        logs={activeGame?.logs || []}
      />

      <PlayerDetailDialog
        isOpen={!!selectedPlayerForInfo}
        onClose={() => setSelectedPlayerForInfo(null)}
        player={selectedPlayerForInfo}
        playerId={playerId}
      />

      {activeGame && (
        <GameOverDialog
          isOpen={"game_over" === activeGame.phase}
          activeGame={activeGame}
          onReturn={handleReturnFromGameOver}
        />
      )}

      {activeGame && (
        <HermitPeekDialog
          activeGame={activeGame}
          playerId={playerId}
          onClose={handleCloseIdentityShown}
        />
      )}

      {activeGame && (
        <LocationSelectDialog
          isOpen={showLocationChoice}
          activeGame={activeGame}
          playerId={playerId}
          compassChoices={compassChoices}
          onSelect={handleLocationChoice}
        />
      )}

      {activeGame && (
        <GateSelectionDialog
          isOpen={showGateSelection && !selectedGateDeck && playerId === activeGame.players[activeGame.turnIndex]?.id}
          onSelect={handleSelectGateDeck}
        />
      )}

      {activeGame && (
        <DrawnCardModal
          isOpen={!!activeDrawnCard && playerId === activeGame.players[activeGame.turnIndex]?.id}
          activeGame={activeGame}
          playerId={playerId}
          activeDrawnCard={activeDrawnCard}
          onUse={handleUseCard}
          onCancel={handleCancelCard}
        />
      )}

    </div>
  );
}
