import React, { useState } from "react";
import { Play, Sparkles, Swords, RefreshCw, LogOut, ArrowRight, ShieldAlert, HeartHandshake, Eye } from "lucide-react";
import { GameState, Player, Alignment } from "../types";
import { areLocationsInSameArea } from "../data/locations";

interface PlayerControlsProps {
  gameState: GameState;
  currentPlayerId: string;
  onRollMove: () => void;
  onMoveSelection: (locationId: string) => void; // Phục vụ lúc roll ra 7 hoặc dùng bài Shadow Portal
  onUseWeirdWoods: (targetPlayerId: string, actionType: "heal" | "damage") => void;
  onAttackPlayer: (targetPlayerId: string) => void;
  onRevealIdentity: () => void;
  onEndTurn: () => void;
}

export default function PlayerControls({
  gameState,
  currentPlayerId,
  onRollMove,
  onMoveSelection,
  onUseWeirdWoods,
  onAttackPlayer,
  onRevealIdentity,
  onEndTurn
}: PlayerControlsProps) {
  const currentTurnPlayer = gameState.players[gameState.turnIndex];
  const isMyTurn = currentTurnPlayer.id === currentPlayerId;
  const phase = gameState.phase;

  const [attackTargetId, setAttackTargetId] = useState("");
  const [woodsTargetId, setWoodsTargetId] = useState("");
  const [woodsAction, setWoodsAction] = useState<"heal" | "damage">("damage");

  // Filter other alive players standing in the same Area as current player
  const attackableTargets = gameState.players.filter((p) => {
    if (p.id === currentPlayerId || p.isDead) return false;
    return areLocationsInSameArea(currentTurnPlayer.locationId, p.locationId);
  });

  const allAlivePlayers = gameState.players.filter((p) => !p.isDead);

  const handleAttack = () => {
    if (!attackTargetId) return;
    onAttackPlayer(attackTargetId);
    setAttackTargetId("");
  };

  const handleWeirdWoods = () => {
    if (!woodsTargetId) return;
    onUseWeirdWoods(woodsTargetId, woodsAction);
    setWoodsTargetId("");
  };

  return (
    <div className="bg-transparent border border-neutral-800 rounded-2xl p-5 space-y-5 font-sans">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1 border-b border-neutral-800 pb-2 flex items-center gap-2">
        <Swords className="w-4 h-4 text-rose-500" />
        Bảng Điều Khiển Hành Động (Controls)
      </h3>

      {/* 1. Nếu không phải lượt của mình */}
      {!isMyTurn && phase !== "game_over" && (
        <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl text-center">
          <p className="text-xs text-neutral-500 italic">
            Đang đợi hành động từ <strong className="text-neutral-400">{currentTurnPlayer.name}</strong>...
          </p>
        </div>
      )}

      {/* 2. Nếu là lượt của mình */}
      {isMyTurn && phase !== "game_over" && (
        <div className="space-y-4">
          
          {/* GIAI ĐOẠN ĐỔ XÚC XẮC DI CHUYỂN */}
          {phase === "roll" && (
            <div className="p-4 bg-neutral-950 border border-rose-950/40 rounded-xl text-center space-y-3.5">
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                Hãy tiến hành lắc xúc xắc để xúc tiến di chuyển đến một vị trí ngẫu nhiên trên bản đồ!
              </p>
              <button
                onClick={onRollMove}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                ĐỔ XÚC XẮC DI CHUYỂN
              </button>
            </div>
          )}

          {/* GIAI ĐOẠN HÀNH ĐỘNG ĐỊA ĐIỂM (Ví dụ: Weird Woods) */}
          {phase === "action" && currentTurnPlayer.locationId === "loc_woods" && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase block tracking-wider">
                Ma Lực Rừng Rậm Kỳ Dị (Weird Woods)
              </span>
              <div className="space-y-2">
                <select
                  id="woods_target_player_select"
                  value={woodsTargetId}
                  onChange={(e) => setWoodsTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                >
                  <option value="">-- Chọn đối tượng chịu ma lực --</option>
                  {allAlivePlayers.map((p) => {
                    const isSelf = p.id === currentPlayerId;
                    const showHp = isSelf || p.alignmentRevealed;
                    return (
                      <option key={p.id} value={p.id}>
                        {isSelf ? `Bản thân (${p.name})` : p.name} ({showHp ? `Máu: ${p.currentHp} HP` : "Máu: ??"})
                      </option>
                    );
                  })}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWoodsAction("damage")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      woodsAction === "damage" 
                        ? "bg-rose-950/40 text-rose-400 border border-rose-500/30" 
                        : "bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    Gây 2 Sát Thương
                  </button>
                  <button
                    onClick={() => setWoodsAction("heal")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      woodsAction === "heal" 
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30" 
                        : "bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    Hồi 1 Máu (HP)
                  </button>
                </div>
              </div>

              <button
                onClick={handleWeirdWoods}
                disabled={!woodsTargetId}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow"
              >
                Kích Hoạt Ma Lực Rừng Rậm
              </button>
            </div>
          )}

          {/* GIAI ĐOẠN TẤN CÔNG (Không bắt buộc) */}
          {phase === "attack" && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Khai Chiến Tấn Công
                </span>
                <span className="text-[9px] text-neutral-500">Đồng cặp địa điểm</span>
              </div>

              {gameState.roundNumber === 1 ? (
                <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-center">
                  <p className="text-[11px] text-amber-400 font-bold leading-relaxed flex items-center justify-center gap-1.5">
                    🛡️ VÒNG CHƠI ĐẦU TIÊN: HÒA BÌNH
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                    Tất cả người chơi không thể tấn công trong vòng đầu tiên này. Hãy hồi sức chờ thời cơ!
                  </p>
                </div>
              ) : attackableTargets.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic text-center py-2">
                  Không có đối thủ nào đứng chung Khu vực với bạn lúc này để giao đấu.
                </p>
              ) : (
                <div className="space-y-2">
                  <select
                    id="attack_target_player_select"
                    value={attackTargetId}
                    onChange={(e) => setAttackTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Chọn 1 người chơi gần kề --</option>
                    {attackableTargets.map((p) => {
                      const showHp = p.alignmentRevealed;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isBot ? "(Bot)" : ""} ({showHp ? `Máu: ${p.currentHp} HP` : "Máu: ??"})
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={handleAttack}
                    disabled={!attackTargetId}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow"
                  >
                    VUNG KIẾM TẤN CÔNG
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BỎ QUA HÀNH ĐỘNG HOẶC KẾT THÚC LƯỢT */}
          <div className="flex gap-2">
            {phase === "action" && (
              <button
                onClick={onEndTurn} // Bỏ qua rút bài, nhảy thẳng sang phase attack
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold text-neutral-300 transition-all"
              >
                Không Rút Bài & Bỏ Qua
              </button>
            )}

            {phase === "attack" && (
              <button
                onClick={onEndTurn}
                className="flex-1 py-2.5 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 rounded-xl text-xs font-bold text-neutral-300 transition-all border border-neutral-700/50 flex items-center justify-center gap-1.5"
              >
                KẾT THÚC LƯỢT CHƠI
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>

          {/* TIẾT LỘ THÂN PHẬN HOẶC KÍCH HOẠT SKILL CHỦ ĐỘNG */}
          {!currentTurnPlayer.alignmentRevealed ? (
            <div className="border-t border-neutral-800/80 pt-4 mt-2">
              <button
                onClick={onRevealIdentity}
                className="w-full py-2.5 bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 border border-rose-900/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                <Eye className="w-4 h-4 text-rose-500" />
                TIẾT LỘ THÂN PHẬN (LẬT MẶT NẠ)
              </button>
              <p className="text-[10px] text-neutral-500 text-center mt-1.5 leading-relaxed">
                Tiết lộ thân phận thực sự để kích hoạt và khai mở các kỹ năng của nhân vật!
              </p>
            </div>
          ) : (
            (currentTurnPlayer.character.name.startsWith("Franklin") || currentTurnPlayer.character.name.startsWith("Allie")) &&
            !currentTurnPlayer.hasUsedAbility && (
              <div className="border-t border-neutral-800/80 pt-4 mt-2">
                <button
                  onClick={onRevealIdentity}
                  className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  KÍCH HOẠT KỸ NĂNG: [{currentTurnPlayer.character.abilityName}]
                </button>
                <p className="text-[10px] text-purple-400/80 text-center mt-1.5 leading-relaxed">
                  Kích hoạt tuyệt kỹ 1 lần duy nhất trong trận của {currentTurnPlayer.character.name}!
                </p>
              </div>
            )
          )}

        </div>
      )}

      {/* 3. Chúc mừng chiến thắng nếu game over */}
      {phase === "game_over" && (
        <div className="p-5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center space-y-3">
          <h4 className="text-emerald-400 font-extrabold text-sm uppercase tracking-widest">
            🎉 Trận Đấu Đã Kết Thúc!
          </h4>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Chiến thắng thuyết phục đã thuộc về thế lực:{" "}
            <strong className="text-white uppercase">
              {Array.isArray(gameState.winnerAlignment)
                ? gameState.winnerAlignment.join(" & ")
                : String(gameState.winnerAlignment)}
            </strong>
          </p>
        </div>
      )}

    </div>
  );
}
