import React from "react";
import { Alignment, GameState } from "../../types";

interface HermitPeekDialogProps {
  activeGame: GameState;
  playerId: string;
  onClose: () => void;
}

export default function HermitPeekDialog({ activeGame, playerId, onClose }: HermitPeekDialogProps) {
  const show = activeGame && activeGame.hermitTargetIdentityShown && activeGame.hermitTargetIdentityShown.viewerId === playerId;
  if (!show || !activeGame.hermitTargetIdentityShown) return null;

  const targetPlayer = activeGame.players.find(p => p.id === activeGame.hermitTargetIdentityShown?.targetId);
  const data = activeGame.hermitTargetIdentityShown;

  return (
    <div
      onClick={onClose}
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
            Thân phận của đối thủ <strong className="text-white">{targetPlayer?.name}</strong> đã bị hé lộ riêng cho bạn:
          </p>
        </div>

        <div className="bg-neutral-900/60 p-4 border border-neutral-800 rounded-2xl space-y-2 text-left">
          <div className="text-xs flex justify-between">
            <span className="text-neutral-400">Nhân vật:</span>
            <span className="text-white font-extrabold uppercase">{data.characterName}</span>
          </div>
          <div className="text-xs flex justify-between">
            <span className="text-neutral-400">Phe phái:</span>
            <span className={`font-bold uppercase tracking-wider ${data.alignment === Alignment.SHADOW
              ? "text-red-400"
              : data.alignment === Alignment.HUNTER
                ? "text-blue-400"
                : "text-amber-400"
              }`}>
              {data.alignment === Alignment.SHADOW
                ? "Bóng Tối"
                : data.alignment === Alignment.HUNTER
                  ? "Thợ Săn"
                  : "Trung Lập"}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-850 hover:bg-neutral-800 rounded-xl text-xs font-bold text-white transition-all shadow border border-neutral-800 cursor-pointer"
        >
          Đồng Ý / Đã Xem
        </button>
      </div>
    </div>
  );
}
