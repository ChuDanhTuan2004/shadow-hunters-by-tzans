import React, { useState } from "react";
import { Heart, Sparkles, Eye } from "lucide-react";
import { Player, Alignment, CardType } from "../types";
import { GameCard, getCardById } from "../data/cards";
import CardDetailModal from "./dialogs/CardDetailModal";

interface HpTrackProps {
  players: Player[];
  currentPlayerId: string;
}

export default function HpTrack({ players, currentPlayerId }: HpTrackProps) {
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 font-sans h-full">
      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1 border-b border-neutral-800 pb-2 flex items-center gap-2">
        <Heart className="w-4 h-4 text-rose-500" />
        Theo Dõi Sinh Mệnh & Bản Thiết Kế Thân Phận
      </h4>

      <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1 scrollbar-thin">
        {players.map((p) => {
          const isSelf = p.id === currentPlayerId;
          const maxHp = p.character.hp;
          const hpPercentage = Math.max(0, (p.currentHp / maxHp) * 100);
          const showHp = isSelf || p.alignmentRevealed || p.isDead;
          
          // Xác định hiển thị phe
          let alignmentDisplay = "Ẩn danh (Vô diện)";
          let alignmentColor = "text-neutral-500 bg-neutral-950 border-neutral-800";
          
          if (p.alignmentRevealed || isSelf) {
            if (p.character.alignment === Alignment.SHADOW) {
              alignmentDisplay = `Bóng Tối - ${p.character.name}`;
              alignmentColor = "text-red-400 bg-red-950/20 border-red-900/30";
            } else if (p.character.alignment === Alignment.HUNTER) {
              alignmentDisplay = `Thợ Săn - ${p.character.name}`;
              alignmentColor = "text-blue-400 bg-blue-950/20 border-blue-900/30";
            } else {
              alignmentDisplay = `Trung Lập - ${p.character.name}`;
              alignmentColor = "text-amber-400 bg-amber-950/20 border-amber-900/30";
            }
          }

          return (
            <div 
              key={p.id}
              className={`p-4 rounded-xl border transition-all ${
                p.isDead 
                  ? "bg-neutral-950/40 border-neutral-950 opacity-50" 
                  : isSelf 
                    ? "bg-neutral-950 border-neutral-700/80 shadow-md" 
                    : "bg-neutral-950/40 border-neutral-800/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-3 h-3 rounded-full shadow" 
                    style={{ backgroundColor: p.color }}
                  ></span>
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {p.name} {p.isBot ? "(Bot)" : ""} {isSelf && <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded ml-1 font-normal border border-rose-500/20">Bạn</span>}
                  </span>
                  {p.isDead && (
                    <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      ĐÃ CHẾT
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Phe phái */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${alignmentColor}`}>
                    {alignmentDisplay}
                  </span>

                  {/* Danh tính được ngửa */}
                  {p.alignmentRevealed && (
                    <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Eye className="w-3 h-3 text-rose-500" /> Lộ diện
                    </span>
                  )}
                </div>
              </div>

              {/* Thanh Hp */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Heart className={`w-3.5 h-3.5 text-rose-500 ${p.currentHp <= 3 && !p.isDead && showHp ? "animate-pulse" : ""}`} />
                    Sinh lực: {showHp ? `${p.currentHp} / ${maxHp} HP` : "?? / ?? HP (Bảo mật)"}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {showHp ? `${Math.round(hpPercentage)}%` : "??"}
                  </span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      showHp
                        ? hpPercentage > 50 
                          ? "bg-emerald-500" 
                          : hpPercentage > 25 
                            ? "bg-amber-500" 
                            : "bg-rose-500 animate-pulse"
                        : "bg-neutral-800"
                    }`}
                    style={{ width: showHp ? `${hpPercentage}%` : "100%" }}
                  ></div>
                </div>
              </div>

              {/* Hiển thị trang bị của người chơi này (nếu có) */}
              {p.equipments.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-neutral-900/60 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-neutral-500 block w-full">Trang bị hộ thân:</span>
                  {p.equipments.map((eqId, eqIdx) => {
                    const card = getCardById(eqId);
                    return card ? (
                      <button
                        key={eqIdx}
                        onClick={() => setSelectedCard(card)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all hover:brightness-125 hover:scale-105 ${
                          card.type === CardType.LIGHT
                            ? "bg-blue-950/10 text-blue-300 border-blue-900/30 hover:bg-blue-950/20"
                            : "bg-orange-950/10 text-orange-300 border-orange-900/30 hover:bg-orange-950/20"
                        }`}
                      >
                        ⚔️ {card.name}
                      </button>
                    ) : null;
                  })}
                </div>
              )}

              {/* Siêu kỹ năng riêng tư hoặc khi người chơi khác đã lộ diện (hiển thị cả skill của họ) */}
              {(isSelf || p.alignmentRevealed) && !p.isDead && (
                <div className={`mt-3 p-3 rounded-lg border text-xs transition-all animate-fadeIn space-y-1.5 ${
                  p.alignmentRevealed && !isSelf
                    ? "bg-amber-950/20 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                    : "bg-neutral-950/80 border-neutral-800/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
                      Siêu Năng Lực Nhân Vật: {p.character.abilityName}
                    </div>
                    {p.alignmentRevealed && !isSelf && (
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase">
                        Đã Tiết Lộ
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px] font-medium">
                    {p.character.abilityDesc}
                  </p>
                  <div className="text-neutral-500 text-[10px] pt-1 border-t border-neutral-900/60 flex items-center gap-1.5">
                    <span>🎯</span> 
                    <span>
                      <strong className="text-neutral-400 font-semibold">Điều kiện thắng:</strong> {p.character.winCondition}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
