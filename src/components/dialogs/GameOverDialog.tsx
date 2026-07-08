import React from "react";
import { Alignment, GameState } from "../../types";

interface GameOverDialogProps {
  isOpen: boolean;
  activeGame: GameState;
  onReturn: () => void;
}

export default function GameOverDialog({ isOpen, activeGame, onReturn }: GameOverDialogProps) {
  if (!isOpen) return null;

  const winners = activeGame.players.filter(p => {
    return activeGame.winnerPlayerIds?.includes(p.id) || false;
  });
  const winnerNames = winners.map(p => p.name + (p.isBot ? " (Bot)" : ""));
  // Lấy điều kiện thắng từ nhân vật của người thắng đầu tiên
  const winCondition = winners.length > 0 ? winners[0].character.winCondition : null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative space-y-6 text-center overflow-hidden max-h-[90vh] flex flex-col">

        {/* TIÊU ĐỀ */}
        <div className="space-y-1 shrink-0">
          <span className="text-[10px] bg-[#7BA2BE]/10 text-[#7BA2BE] border border-[#7BA2BE]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">
            Trận Đấu Kết Thúc
          </span>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider pt-1">
            🏆 BẢNG VÀNG CHIẾN THẮNG 🏆
          </h3>
        </div>

        {/* PHE THẮNG + ĐIỀU KIỆN THẮNG + DANH SÁCH NGƯỜI THẮNG */}
        <div className="bg-[#4437AC]/10 border border-[#4437AC]/20 p-4 rounded-2xl space-y-3 shrink-0 text-left">
          {/* Tên phe */}
          <div className="text-center space-y-1">
            <span className="text-[10px] text-[#7BA2BE] uppercase tracking-widest font-black block">
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
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isWinner
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
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider block w-fit ml-auto ${Alignment.SHADOW === p.character.alignment
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
            onClick={onReturn}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] rounded-2xl text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            QUAY TRỞ LẠI
          </button>
        </div>

      </div>
    </div>
  );
}
