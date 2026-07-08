import React from "react";
import { Bot, Play, ArrowLeft } from "lucide-react";
import { GameState } from "../types";

const bgPc = "/assets/images/bg/bg-pc-compressed.png";
const bgMobile = "/assets/images/bg/bg-mobile-compressed.png";

interface WaitingRoomProps {
  activeGame: GameState;
  roomId: string;
  playerId: string;
  playerName: string;
  onRemovePlayer: (playerId: string) => void;
  onAddBot: () => void;
  onLeave: () => void;
  onStartGame: () => void;
}

export default function WaitingRoom({
  activeGame,
  roomId,
  playerId,
  playerName,
  onRemovePlayer,
  onAddBot,
  onLeave,
  onStartGame
}: WaitingRoomProps) {
  const isHost = activeGame.players[0]?.id === playerId;

  return (
    <div className="relative w-full z-10 flex flex-col items-center">
      {/* BACKGROUND DECORATIONS (FIXED UNDERLAY) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        {/* PC Background */}
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${bgPc})` }}
        />
        {/* Mobile Background */}
        <div
          className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${bgMobile})` }}
        />
        {/* Dark overlay mixing with dominant colors */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#07080f]/98 via-[#13112d]/93 to-[#261f5c]/85 mix-blend-multiply"
        />
        {/* Radial highlight for professional gaming portal glow */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(68,55,172,0.15)_0%,transparent_70%)]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70"
        />
      </div>

      <div className="max-w-2xl w-full mx-auto bg-[#0a0c16]/85 backdrop-blur-xl border border-[#4437ac]/40 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(68,55,172,0.3)] p-6 sm:p-8 space-y-6 animate-fadeIn relative z-10">
        <div className="text-center space-y-2.5">
          <span className="text-[10px] bg-[#4437ac]/20 text-[#7ba2be] border border-[#4437ac]/40 px-3 py-1 rounded-full font-bold uppercase tracking-widest inline-block">
            Phòng Chờ Trực Tuyến
          </span>
          <h2 className="text-3xl font-extrabold tracking-widest text-white">
            MÃ PHÒNG: <span className="text-[#7ba2be] font-mono select-all bg-[#030408]/90 px-4 py-1.5 rounded-xl border border-[#4437ac]/40 shadow-inner">{roomId}</span>
          </h2>
          <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
            Hãy chia sẻ mã phòng cho bạn bè để họ nhập gia nhập phòng chơi. Cần tối thiểu 3 người chơi để khai cuộc!
          </p>
        </div>

        {/* Danh sách người chơi kết nối */}
        <div className="bg-[#030408]/50 rounded-2xl border border-[#4437ac]/25 p-5 space-y-4 shadow-[0_0_15px_rgba(68,55,172,0.1)]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-[#7ba2be] uppercase tracking-wider">
              Anh Hùng Gia Nhập ({activeGame.players.length}/12)
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold">Giới hạn tối đa 12</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGame.players.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-[#0a0c16]/80 border border-[#4437ac]/30 rounded-xl flex items-center justify-between hover:border-[#7ba2be]/55 transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                  <span className="text-xs text-white font-bold">
                    {p.name} {p.isBot ? "(Bot)" : p.id === playerId ? (activeGame.players[0]?.id === playerId ? "(Bạn - Host)" : "(Bạn)") : (activeGame.players[0]?.id === p.id ? "(Host)" : "")}
                  </span>
                </div>

                {/* Cho phép Host đuổi người chơi khác hoặc xóa Bot */}
                {isHost && p.id !== playerId && (
                  <button
                    onClick={() => onRemovePlayer(p.id)}
                    className="text-[10px] text-[#7ba2be] hover:text-white font-bold px-2.5 py-1 rounded-lg bg-[#4437ac]/20 border border-[#4437ac]/40 hover:bg-[#4437ac]/40 transition-all cursor-pointer active:scale-95"
                  >
                    {p.isBot ? "Xóa AI" : "Đuổi / Kick"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action thêm Bot */}
          {isHost && 12 > activeGame.players.length && (
            <button
              onClick={onAddBot}
              className="w-full py-2.5 bg-[#030408]/80 hover:bg-[#4437ac]/20 border border-[#4437ac]/40 hover:border-[#7ba2be]/65 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Bot className="w-4 h-4 text-[#7ba2be]" />
              Mời Thêm AI Bot Gia Nhập (+1 AI)
            </button>
          )}
        </div>

        {/* Điều khiển Bắt đầu */}
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-neutral-300 rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {isHost ? "Hủy Phòng" : "Thoát Phòng"}
          </button>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={activeGame.players.length < 3}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] disabled:opacity-40 rounded-2xl text-white font-bold text-xs shadow-xl shadow-[#4437ac]/30 flex items-center justify-center gap-1.5 transition-all border border-[#7ba2be]/35 cursor-pointer active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" />
              KHAI CHIẾN TRẬN ĐẤU
            </button>
          ) : (
            <div className="flex-1 py-3.5 bg-[#030408]/60 border border-[#4437ac]/20 rounded-2xl text-xs text-[#7ba2be]/70 italic flex items-center justify-center font-bold">
              Đợi Host bắt đầu trận đấu...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
