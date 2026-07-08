import React from "react";
import { Alignment, CardType, Player } from "../../types";
import { getCardById } from "../../data/cards";

interface PlayerDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  playerId: string;
}

export default function PlayerDetailDialog({
  isOpen,
  onClose,
  player,
  playerId
}: PlayerDetailDialogProps) {
  if (!isOpen || !player) return null;

  const isSelfOrRevealed = player.id === playerId || player.alignmentRevealed || player.isDead;

  return (
    <div
      onClick={onClose}
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
              style={{ backgroundColor: player.color }}
            />
            <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
              Thông Tin: {player.name} {player.isBot ? "(Bot)" : ""}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 transition-colors border border-neutral-800 cursor-pointer"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Trạng thái sinh tử */}
          <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
            <span className="text-neutral-400 font-medium">Trạng thái:</span>
            {player.isDead ? (
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
              {isSelfOrRevealed
                ? `${player.currentHp} / ${player.character.hp} HP`
                : `??? (Số máu đã mất: ${player.character.hp - player.currentHp})`}
            </span>
          </div>

          {/* Phe phái */}
          <div className="flex justify-between items-center py-1.5 border-b border-neutral-900">
            <span className="text-neutral-400 font-medium">Phe phái:</span>
            {isSelfOrRevealed ? (
              <span className={`font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${player.character.alignment === Alignment.SHADOW
                ? "text-red-400 bg-red-950/20 border-red-900/30"
                : player.character.alignment === Alignment.HUNTER
                  ? "text-blue-400 bg-blue-950/20 border-blue-900/30"
                  : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                }`}>
                {player.character.alignment === Alignment.SHADOW
                  ? "Bóng Tối"
                  : player.character.alignment === Alignment.HUNTER
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
            {isSelfOrRevealed ? (
              <span className="text-white font-bold uppercase">{player.character.name}</span>
            ) : (
              <span className="text-neutral-500 font-bold font-mono">???</span>
            )}
          </div>

          {/* Siêu năng lực */}
          {isSelfOrRevealed && (
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1.5">
              <div className="font-bold text-rose-400 uppercase tracking-wide text-[10px]">
                ⚡ Siêu Năng Lực: {player.character.abilityName}
              </div>
              <p className="text-neutral-350 leading-relaxed text-[11px]">
                {player.character.abilityDesc}
              </p>
              <div className="text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-1 mt-1 leading-relaxed">
                <strong>Điều kiện thắng:</strong> {player.character.winCondition}
              </div>
            </div>
          )}

          {/* Trang bị */}
          <div className="space-y-2">
            <span className="text-neutral-400 font-medium block">Trang bị hiện có:</span>
            {player.equipments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {player.equipments.map((eqId, eqIdx) => {
                  const card = getCardById(eqId);
                  return card ? (
                    <span
                      key={eqIdx}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${card.type === CardType.LIGHT
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
  );
}
