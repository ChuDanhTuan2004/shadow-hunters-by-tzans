import React, { useState, useEffect } from "react";
import { CardType, GameState } from "../../types";
import { GameCard } from "../../data/cards";
import { getCardById } from "../../data/cards";

interface DrawnCardModalProps {
  isOpen: boolean;
  activeGame: GameState;
  playerId: string;
  activeDrawnCard: GameCard | null;
  onUse: (cardId: string, targetId: string | null) => void;
  onCancel: () => void;
}

export default function DrawnCardModal({
  isOpen,
  activeGame,
  playerId,
  activeDrawnCard,
  onUse,
  onCancel
}: DrawnCardModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedEquipId, setSelectedEquipId] = useState<string>("");

  // Reset local selections when a new card is drawn
  useEffect(() => {
    setSelectedTargetId("");
    setSelectedEquipId("");
  }, [activeDrawnCard]);

  if (!isOpen || !activeDrawnCard) return null;

  const handleConfirm = () => {
    onUse(activeDrawnCard.id, selectedTargetId || null);
    setSelectedTargetId("");
    setSelectedEquipId("");
  };

  const handleCancelClick = () => {
    onCancel();
    setSelectedTargetId("");
    setSelectedEquipId("");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-5 overflow-hidden">
        {/* Glow border according to card type */}
        <div
          className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${
            activeDrawnCard.type === CardType.HERMIT
              ? "bg-emerald-500"
              : activeDrawnCard.type === CardType.LIGHT
                ? "bg-blue-500"
                : "bg-orange-500"
          }`}
        />

        <div className="text-center space-y-1">
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
            Hành Động Địa Điểm
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
            Rút Thẻ Bài
          </h3>
        </div>

        {/* Card info */}
        <div className="space-y-4 animate-scaleUp">
          <div className={`p-5 rounded-2xl border bg-neutral-900/60 space-y-3.5 text-center relative ${
            activeDrawnCard.type === CardType.HERMIT
              ? "border-emerald-900/50"
              : activeDrawnCard.type === CardType.LIGHT
                ? "border-blue-900/50"
                : "border-orange-900/50"
          }`}>
            <h4 className="text-white font-extrabold text-base tracking-tight leading-none">
              {activeDrawnCard.name}
            </h4>

            <div className="flex justify-center gap-1.5 flex-wrap">
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                activeDrawnCard.type === CardType.HERMIT
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : activeDrawnCard.type === CardType.LIGHT
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
              }`}>
                {activeDrawnCard.type === CardType.HERMIT ? "Thẻ Ẩn Sĩ" : activeDrawnCard.type === CardType.LIGHT ? "Thẻ Ánh Sáng" : "Thẻ Bóng Tối"}
              </span>
              <span className="text-[8px] font-bold px-2 py-0.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 uppercase tracking-wider">
                {activeDrawnCard.isEquipment ? "🎒 Trang bị vĩnh viễn" : "⚡ Vật phẩm dùng 1 lần"}
              </span>
            </div>

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

          {/* TARGET SELECTION */}
          <div className="bg-neutral-900/40 p-4 border border-neutral-900 rounded-2xl space-y-3.5">
            {activeDrawnCard.type === CardType.HERMIT ? (
              <div className="space-y-2 text-left">
                <label className="block text-[11px] font-semibold text-neutral-400">
                  Chọn 1 đối thủ để gửi mật thư Ẩn Sĩ:
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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
              <div className="space-y-2 text-left">
                <label className="block text-[11px] font-semibold text-neutral-400">
                  Chọn 1 đối tượng để kích hoạt hiệu ứng:
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
                >
                  <option value="">-- Chọn đối tượng --</option>
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
              <div className="space-y-3 text-left">
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
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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
              <div className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-400">
                    Chọn đối thủ sở hữu trang bị để cướp:
                  </label>
                  <select
                    value={selectedTargetId.split(":")[0]}
                    onChange={(e) => {
                      const chosenTarget = e.target.value;
                      setSelectedTargetId(`${chosenTarget}:`);
                      setSelectedEquipId("");
                    }}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE]"
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

            {/* BUTTON CONTROLS */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleConfirm}
                disabled={
                  (CardType.HERMIT === activeDrawnCard.type && !selectedTargetId) ||
                  (("l_firstaid" === activeDrawnCard.id || "l_blessing" === activeDrawnCard.id || "l_disenchant" === activeDrawnCard.id || "s_spider" === activeDrawnCard.id || "s_doll" === activeDrawnCard.id || activeDrawnCard.id.startsWith("s_bat")) && !selectedTargetId) ||
                  ("s_banana" === activeDrawnCard.id && (!selectedTargetId || (activeGame.players.find(p => playerId === p.id)?.equipments.length || 0) > 0 && !selectedEquipId)) ||
                  (activeDrawnCard.id.startsWith("s_goblin") && (!selectedTargetId.split(":")[0] || !selectedEquipId))
                }
                className="flex-1 py-2.5 bg-[#4437AC] hover:bg-[#4437AC]/90 disabled:opacity-30 rounded-xl text-xs font-bold text-white transition-all shadow"
              >
                {activeDrawnCard.isEquipment ? "🎒 Xác Nhận Trang Bị" : "🔥 Kích Hoạt Thẻ Bài"}
              </button>
              <button
                onClick={handleCancelClick}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 transition-all"
              >
                Bỏ Qua
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
