import React, { useState } from "react";
import { HelpCircle, Sparkles, Swords, Info, AlertTriangle } from "lucide-react";
import { CardType, GameState, Player, Card } from "../types";
import { DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, GameCard } from "../data/cards";

interface CardDecksProps {
  gameState: GameState;
  currentPlayerId: string;
  onDrawCard: (deckType: CardType) => void;
  onUseCard: (cardId: string, targetPlayerId: string | null) => void;
  onCancelCard: () => void;
}

export default function CardDecks({
  gameState,
  currentPlayerId,
  onDrawCard,
  onUseCard,
  onCancelCard
}: CardDecksProps) {
  const currentTurnPlayer = gameState.players[gameState.turnIndex];
  const isMyTurn = currentTurnPlayer.id === currentPlayerId;
  const currentLoc = currentTurnPlayer.locationId;
  const phase = gameState.phase;

  const [activeDrawnCard, setActiveDrawnCard] = useState<GameCard | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  // Determine which card deck is available based on current location
  let availableDeck: CardType | null = null;
  if (currentLoc === "loc_hermit") {
    availableDeck = CardType.HERMIT;
  } else if (currentLoc === "loc_fountain" || currentLoc === "loc_church") {
    availableDeck = CardType.LIGHT;
  } else if (currentLoc === "loc_cemetery" || currentLoc === "loc_anvil") {
    availableDeck = CardType.SHADOW;
  }

  // Handle click on Draw Button
  const handleDraw = (type: CardType) => {
    let deck: GameCard[] = [];
    if (type === CardType.HERMIT) deck = DECK_HERMIT;
    else if (type === CardType.LIGHT) deck = DECK_LIGHT;
    else if (type === CardType.SHADOW) deck = DECK_SHADOW;

    // Draw random card
    const randomCard = deck[Math.floor(Math.random() * deck.length)];
    setActiveDrawnCard(randomCard);
    onDrawCard(type);
  };

  const handleResolveCard = () => {
    if (!activeDrawnCard) return;
    onUseCard(activeDrawnCard.id, selectedTargetId || null);
    setActiveDrawnCard(null);
    setSelectedTargetId("");
  };

  const handleSkipCard = () => {
    setActiveDrawnCard(null);
    setSelectedTargetId("");
    onCancelCard();
  };

  // Filter other alive players to target
  const otherAlivePlayers = gameState.players.filter(
    (p) => p.id !== currentPlayerId && !p.isDead
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 font-sans">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1 border-b border-neutral-800 pb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-rose-500" />
        Sảnh Thẻ Bài Thần Thoại (Decks)
      </h3>

      {/* Rút bài */}
      {!activeDrawnCard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Hermit Deck */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-12 h-16 bg-emerald-900/10 border-2 border-dashed border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 font-bold">
              ?
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Thẻ Bài Ẩn Sĩ</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Dò hỏi và thử thách thân phận của đối phương</p>
            </div>
            <button
              onClick={() => handleDraw(CardType.HERMIT)}
              disabled={!isMyTurn || phase !== "action" || availableDeck !== CardType.HERMIT}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 rounded-lg text-xs font-bold text-white transition-all shadow"
            >
              Rút Thẻ Ẩn Sĩ
            </button>
          </div>

          {/* Light Deck */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-12 h-16 bg-blue-900/10 border-2 border-dashed border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400 font-bold">
              ✨
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Thẻ Bài Ánh Sáng</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Gia tăng phòng thủ, hồi máu hoặc vũ khí thần bí</p>
            </div>
            <button
              onClick={() => handleDraw(CardType.LIGHT)}
              disabled={!isMyTurn || phase !== "action" || (availableDeck !== CardType.LIGHT)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 rounded-lg text-xs font-bold text-white transition-all shadow"
            >
              Rút Bài Ánh Sáng
            </button>
          </div>

          {/* Shadow Deck */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-12 h-16 bg-orange-900/10 border-2 border-dashed border-orange-500/30 rounded-lg flex items-center justify-center text-orange-400 font-bold">
              🔥
            </div>
            <div>
              <h4 className="text-white font-bold text-xs">Thẻ Bài Bóng Tối</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Sở hữu ma pháp tấn công, độc dược hoặc rìu tàn sát</p>
            </div>
            <button
              onClick={() => handleDraw(CardType.SHADOW)}
              disabled={!isMyTurn || phase !== "action" || (availableDeck !== CardType.SHADOW)}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 rounded-lg text-xs font-bold text-white transition-all shadow"
            >
              Rút Bài Bóng Tối
            </button>
          </div>
        </div>
      )}

      {/* Hiển thị lá bài vừa rút được */}
      {activeDrawnCard && (
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
              Thẻ bài vừa lật
            </span>
            <span 
              className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                activeDrawnCard.type === CardType.HERMIT 
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
                  : activeDrawnCard.type === CardType.LIGHT
                    ? "bg-blue-950/20 text-blue-400 border-blue-900/30"
                    : "bg-orange-950/20 text-orange-400 border-orange-900/30"
              }`}
            >
              {activeDrawnCard.type === CardType.HERMIT ? "Thẻ Ẩn Sĩ" : activeDrawnCard.type === CardType.LIGHT ? "Thẻ Ánh Sáng" : "Thẻ Bóng Tối"}
            </span>
          </div>

          <div className="space-y-2 text-center py-2 max-w-md mx-auto">
            <h4 className="text-white font-bold text-base tracking-tight">{activeDrawnCard.name}</h4>
            <span className="text-[10px] text-rose-500/90 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full inline-block">
              {activeDrawnCard.isEquipment ? "Trang Bị Hộ Thân" : "Thẻ Sử Dụng Một Lần"}
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed pt-2">
              {activeDrawnCard.description}
            </p>
          </div>

          {/* Form chọn mục tiêu nếu cần */}
          <div className="bg-neutral-900/40 p-4 border border-neutral-800 rounded-xl space-y-3.5 max-w-md mx-auto">
            {activeDrawnCard.type === CardType.HERMIT ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-neutral-400">
                  Chọn 1 đối thủ để gửi mật thư Ẩn Sĩ:
                </label>
                <select
                  id="card_target_player_select"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">-- Chọn một đối thủ --</option>
                  {otherAlivePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isBot ? "(Bot)" : ""} (Máu hiện tại: {p.currentHp} HP)
                    </option>
                  ))}
                </select>
              </div>
            ) : activeDrawnCard.id === "l5" || activeDrawnCard.id === "s3" ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-neutral-400">
                  Chọn 1 đối tượng để nhận phép thuật:
                </label>
                <select
                  id="card_target_player_select_magic"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">-- Chọn đối tượng --</option>
                  {/* Có thể chọn chính mình nếu là bài hồi phục l5 */}
                  {activeDrawnCard.id === "l5" && (
                    <option value={currentPlayerId}>Bản thân ({currentTurnPlayer.name})</option>
                  )}
                  {otherAlivePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isBot ? "(Bot)" : ""} (Máu hiện tại: {p.currentHp} HP)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 leading-relaxed justify-center text-center">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Nhấn kích hoạt để sử dụng tác dụng trực tiếp lên bản thân bạn.</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleResolveCard}
                disabled={
                  (activeDrawnCard.type === CardType.HERMIT && !selectedTargetId) ||
                  ((activeDrawnCard.id === "l5" || activeDrawnCard.id === "s3") && !selectedTargetId)
                }
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-35 rounded-xl text-xs font-bold text-white transition-all shadow"
              >
                {activeDrawnCard.isEquipment ? "🎒 Xác Nhận Trang Bị" : "🔥 Sử Dụng Ngay"}
              </button>
              <button
                onClick={handleSkipCard}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 transition-all"
              >
                Bỏ Qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gợi ý vị trí */}
      {isMyTurn && phase === "action" && !activeDrawnCard && (
        <div className="p-3 bg-neutral-950 border border-rose-950/40 rounded-xl flex items-start gap-2 text-[11px] text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Địa điểm hiện tại yêu cầu:</span> Đứng ở {
              currentLoc === "loc_hermit" 
                ? "Lều Ẩn Sĩ. Bạn hãy rút 1 Thẻ Ẩn Sĩ phía trên để gửi mật thư." 
                : currentLoc === "loc_fountain" || currentLoc === "loc_church"
                  ? "Suối Nguồn/Nhà Thờ. Hãy rút 1 Thẻ Ánh Sáng cứu phế."
                  : currentLoc === "loc_cemetery" || currentLoc === "loc_anvil"
                    ? "Nghĩa Địa/Đe Hắc Ám. Hãy rút 1 Thẻ Bóng Tối để gia tăng hỏa lực."
                    : "Rừng Rậm Kỳ Dị. Hãy kéo xuống bảng điều khiển bên phải để sử dụng năng lực của Rừng Rậm."
            }
          </div>
        </div>
      )}

    </div>
  );
}
