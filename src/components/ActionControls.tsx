import React, { useState } from "react";
import { Sparkles, Eye, Dices, ArrowRight } from "lucide-react";
import { Alignment, CardType, GameState, Player } from "../types";
import { getCardById } from "../data/cards";
import { areLocationsInSameArea } from "../data/locations";

interface ActionControlsProps {
  activeGame: GameState;
  playerId: string;
  onAttackPlayer: (targetId: string, georgeAbility?: boolean) => void;
  onStealEquipment: (targetId: string, cardId: string) => void;
  onUseWeirdWoods: (targetId: string, action: "damage" | "heal") => void;
  onActivateDavidAbility: (targetId: string, cardId: string) => void;
  onRevealOrAbility: () => void;
  onRollMove: () => void;
  onEndTurn: () => void;
}

export default function ActionControls({
  activeGame,
  playerId,
  onAttackPlayer,
  onStealEquipment,
  onUseWeirdWoods,
  onActivateDavidAbility,
  onRevealOrAbility,
  onRollMove,
  onEndTurn
}: ActionControlsProps) {
  // Local states for action targets/selections
  const [activeAttackTargetId, setActiveAttackTargetId] = useState<string>("");
  const [activeGeorgeAbility, setActiveGeorgeAbility] = useState<boolean>(false);

  const [activeAltarTargetId, setActiveAltarTargetId] = useState<string>("");
  const [activeAltarCardId, setActiveAltarCardId] = useState<string>("");

  const [activeWoodsTargetId, setActiveWoodsTargetId] = useState<string>("");
  const [activeWoodsAction, setActiveWoodsAction] = useState<"damage" | "heal">("damage");

  const [activeDavidTargetId, setActiveDavidTargetId] = useState<string>("");
  const [activeDavidCardId, setActiveDavidCardId] = useState<string>("");

  const currentTurnPlayer = activeGame.players[activeGame.turnIndex];
  const isMyTurn = playerId === currentTurnPlayer?.id;
  const isGameOver = "game_over" === activeGame.phase;

  return (
    <div className="space-y-4">
      {/* 1. Context Controls (Tấn công, cướp trang bị, đào mộ, dùng rừng...) */}
      {isMyTurn && !isGameOver && (
        <>
          {/* Tấn công */}
          {"attack" === activeGame.phase && (
            <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left mx-auto">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                ⚔️ Khai Chiến Tấn Công
              </span>
              {1 === activeGame.roundNumber ? (
                <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg text-center">
                  <p className="text-[10px] text-amber-400 font-bold">🛡️ VÒNG CHƠI ĐẦU TIÊN: HÒA BÌNH</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">Không thể giao chiến trong vòng này.</p>
                </div>
              ) : (() => {
                const hasHandgun = currentTurnPlayer.equipments.includes("s_handgun");
                const attackableTargets = activeGame.players.filter((p) => {
                  if (playerId === p.id || p.isDead) return false;
                  const inSame = areLocationsInSameArea(currentTurnPlayer.locationId, p.locationId);
                  return hasHandgun ? !inSame : inSame;
                });

                if (attackableTargets.length === 0) {
                  return (
                    <p className="text-[10px] text-neutral-500 italic text-center py-1">
                      Không tìm thấy đối thủ cùng khu vực để tấn công.
                    </p>
                  );
                }

                return (
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

                    <button
                      onClick={() => {
                        if (activeAttackTargetId) {
                          onAttackPlayer(activeAttackTargetId, false);
                          setActiveAttackTargetId("");
                          setActiveGeorgeAbility(false);
                        }
                      }}
                      disabled={!activeAttackTargetId}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer"
                    >
                      Xác Nhận Tấn Công
                    </button>
                  </div>
                );
              })()}

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
          )}

          {/* Cướp trang bị (Bàn Thờ Cổ) */}
          {"action" === activeGame.phase && "loc_anvil" === currentTurnPlayer.locationId && (
            <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left mx-auto">
              <span className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
                🎒 Cướp Trang Bị (Bàn Thờ Cổ)
              </span>
              {(() => {
                const otherPlayersWithEquipments = activeGame.players.filter(
                  p => p.id !== currentTurnPlayer.id && !p.isDead && p.equipments.length > 0
                );

                if (otherPlayersWithEquipments.length === 0) {
                  return (
                    <div className="space-y-2">
                      <p className="text-[11px] text-neutral-400">
                        Không có ai sở hữu trang bị để cướp.
                      </p>
                      <button
                        onClick={onEndTurn} // Transitions to next phase (attack)
                        className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-white transition-all cursor-pointer text-center"
                      >
                        Bỏ Qua & Tiếp Tục
                      </button>
                    </div>
                  );
                }

                return (
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
                          onStealEquipment(activeAltarTargetId, activeAltarCardId);
                          setActiveAltarTargetId("");
                          setActiveAltarCardId("");
                        }
                      }}
                      disabled={!activeAltarTargetId || !activeAltarCardId}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer text-center"
                    >
                      Xác Nhận Cướp
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Ma Lực Rừng Rậm Kỳ Dị */}
          {"action" === activeGame.phase && "loc_woods" === currentTurnPlayer.locationId && (
            <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left mx-auto">
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
                      onUseWeirdWoods(activeWoodsTargetId, activeWoodsAction);
                      setActiveWoodsTargetId("");
                    }
                  }}
                  disabled={!activeWoodsTargetId}
                  className="w-full py-1.5 bg-[#4437AC] hover:bg-[#4437AC]/90 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer text-center"
                >
                  Kích Hoạt Ma Lực
                </button>
              </div>
            </div>
          )}

          {/* Kỹ năng David: Thu thập thánh vật */}
          {(() => {
            const isDavid = currentTurnPlayer.character.name.startsWith("David") && currentTurnPlayer.alignmentRevealed && !currentTurnPlayer.hasUsedAbility && !currentTurnPlayer.abilityDisabled && "roll" === activeGame.phase;
            const alivePlayersWithEquips = activeGame.players.filter(p => !p.isDead && p.id !== currentTurnPlayer.id && p.equipments.length > 0);

            if (!isDavid || alivePlayersWithEquips.length === 0) return null;

            return (
              <div className="mb-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl shadow space-y-2.5 max-w-sm w-full text-left mx-auto animate-fadeIn">
                <span className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
                  🪦 Kỹ năng: Thu thập thánh vật
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
                    <option value="">-- Chọn người chơi còn sống --</option>
                    {alivePlayersWithEquips.map((p) => (
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
                        onActivateDavidAbility(activeDavidTargetId, activeDavidCardId);
                        setActiveDavidTargetId("");
                        setActiveDavidCardId("");
                      }
                    }}
                    disabled={!activeDavidTargetId || !activeDavidCardId}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-lg text-xs font-bold text-white transition-all shadow cursor-pointer text-center"
                  >
                    Xác Nhận Cướp Trang Bị
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* 2. Unified Responsive Control Panel (Trạng thái, Logs và Nút Tròn) */}
      {(() => {
        // Button 1: Reveal / Active Skill
        let isLeftButtonActive = false;
        let leftButtonLabel = "LỘ DIỆN";
        let leftButtonAction = null;

        if (isMyTurn && !isGameOver) {
          if (!currentTurnPlayer.alignmentRevealed) {
            const isDaniel = currentTurnPlayer.character.name.startsWith("Daniel");
            isLeftButtonActive = !isDaniel;
            leftButtonLabel = isDaniel ? "DANIEL: LỖI" : "LỘ DIỆN";
            leftButtonAction = isDaniel ? null : onRevealOrAbility;
          } else if (
            (currentTurnPlayer.character.name.startsWith("Franklin") ||
              currentTurnPlayer.character.name.startsWith("Allie") ||
              currentTurnPlayer.character.name.startsWith("Agnes") ||
              currentTurnPlayer.character.name.startsWith("Ellen") ||
              currentTurnPlayer.character.name.startsWith("Ilumia") ||
              (currentTurnPlayer.character.name.startsWith("George") && "roll" === activeGame.phase) ||
              (currentTurnPlayer.character.name.startsWith("Mganga") && "roll" === activeGame.phase) ||
              (currentTurnPlayer.character.name.startsWith("Helen") && "roll" === activeGame.phase)) &&
            !currentTurnPlayer.hasUsedAbility &&
            !currentTurnPlayer.abilityDisabled
          ) {
            isLeftButtonActive = true;
            leftButtonLabel = "KỸ NĂNG";
            leftButtonAction = onRevealOrAbility;
          } else if (currentTurnPlayer.abilityDisabled) {
            leftButtonLabel = "BỊ KHÓA";
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
            rightButtonAction = onRollMove;
          } else if ("action" === activeGame.phase) {
            rightButtonLabel = "BỎ QUA";
            rightButtonAction = onEndTurn;
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
              rightButtonAction = onEndTurn;
            }
          }
        }

        return (
          <div className="grid grid-cols-12 items-center gap-3 sm:gap-4 bg-neutral-900 border border-neutral-800 p-3 sm:p-5 rounded-2xl shrink-0">
            {/* Left: Status */}
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

            {/* Right: Circular Action Buttons */}
            <div className="col-span-5 sm:col-span-4 flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
              {/* Reveal / Skill Button */}
              <button
                onClick={() => leftButtonAction?.()}
                disabled={!isLeftButtonActive}
                className={`w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 text-center flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 shadow-lg ${
                  isLeftButtonActive
                    ? "bg-[#4437AC]/10 border-[#4437AC] text-[#7BA2BE] hover:bg-[#4437AC]/35 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(68,55,172,0.2)] cursor-pointer ring-1 ring-[#4437AC]/20"
                    : "bg-neutral-900/30 border-neutral-850 text-neutral-600 cursor-not-allowed opacity-50"
                }`}
              >
                {leftButtonLabel === "KỸ NĂNG" ? (
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-[#7BA2BE]" />
                ) : (
                  <Eye className={`w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 ${isLeftButtonActive ? "text-[#7BA2BE]" : "text-neutral-600"}`} />
                )}
                <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider leading-tight max-w-[45px] sm:max-w-[75px] truncate">{leftButtonLabel}</span>
              </button>

              {/* Roll / End Turn Button */}
              <button
                onClick={() => rightButtonAction?.()}
                disabled={!isRightButtonActive}
                className={`w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 text-center flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300 shadow-lg ${
                  isRightButtonActive
                    ? "bg-[#7BA2BE]/10 border-[#7BA2BE] text-[#7BA2BE] hover:bg-[#7BA2BE]/20 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(123,162,190,0.2)] cursor-pointer ring-1 ring-[#7BA2BE]/20"
                    : "bg-neutral-900/30 border-neutral-850 text-neutral-600 cursor-not-allowed opacity-50"
                }`}
              >
                {isRightButtonActive ? (
                  "roll" === activeGame.phase ? (
                    <Dices className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-[#7BA2BE]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 text-[#7BA2BE]" />
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
  );
}
