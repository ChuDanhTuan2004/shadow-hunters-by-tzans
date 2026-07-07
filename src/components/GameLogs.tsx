import React, { useState } from "react";
import { MessageSquare, Calendar, HelpCircle, Swords, Award, AlertCircle, RefreshCw, X, ShieldAlert, Heart, Sparkles } from "lucide-react";
import { GameLog, CardType } from "../types";
import { DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, GameCard } from "../data/cards";

interface GameLogsProps {
  logs: GameLog[];
}

const ALL_CARDS: GameCard[] = [...DECK_HERMIT, ...DECK_LIGHT, ...DECK_SHADOW];

function findCardByName(name: string): GameCard | undefined {
  const cleanName = name.trim().toLowerCase();
  if (!cleanName) return undefined;
  
  return ALL_CARDS.find((c) => {
    const cleanCardName = c.name.toLowerCase();
    return (
      cleanCardName === cleanName ||
      cleanCardName.includes(cleanName) ||
      cleanName.includes(cleanCardName)
    );
  });
}

const ALL_CARDS_SORTED = [...ALL_CARDS].sort((a, b) => b.name.length - a.name.length);

export default function GameLogs({ logs }: GameLogsProps) {
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);

  // Trả về icon tương ứng với loại log
  const getLogIcon = (type: GameLog["type"]) => {
    switch (type) {
      case "system":
        return <RefreshCw className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
      case "action":
        return <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "attack":
        return <Swords className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case "card":
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case "reveal":
        return <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />;
    }
  };

  // Trả về class màu nền tương ứng với loại log
  const getLogBg = (type: GameLog["type"]) => {
    switch (type) {
      case "reveal":
        return "bg-amber-950/20 border-l-2 border-amber-500/80 text-amber-200";
      case "attack":
        return "bg-rose-950/20 border-l-2 border-rose-500/80 text-rose-200";
      case "card":
        return "bg-blue-950/20 border-l-2 border-blue-500/80 text-blue-200";
      case "action":
        return "bg-emerald-950/20 border-l-2 border-emerald-500/80 text-emerald-200";
      default:
        return "bg-neutral-950/60 border-l-2 border-neutral-800 text-neutral-300";
    }
  };

  // Hàm quét tự động phát hiện tên thẻ bài thông minh trong log và biến thành nút bấm
  const renderMessageWithClickableCards = (message: string) => {
    if (!message) return "";

    // Tìm tất cả các thẻ bài xuất hiện trong chuỗi tin nhắn
    interface MatchItem {
      start: number;
      end: number;
      card: GameCard;
    }
    const matches: MatchItem[] = [];

    // Duyệt qua danh sách thẻ đã sắp xếp giảm dần theo độ dài để tìm vị trí khớp không bị đè nhau
    ALL_CARDS_SORTED.forEach((card) => {
      let searchStr = card.name.toLowerCase();
      let index = message.toLowerCase().indexOf(searchStr);
      while (index !== -1) {
        // Kiểm tra xem vị trí này có bị đè bởi match đã có hay không
        const isOverlapped = matches.some(
          (m) => (index >= m.start && index < m.end) || (index + searchStr.length > m.start && index + searchStr.length <= m.end)
        );

        if (!isOverlapped) {
          matches.push({
            start: index,
            end: index + searchStr.length,
            card: card
          });
        }
        index = message.toLowerCase().indexOf(searchStr, index + 1);
      }
    });

    // Sắp xếp các matches theo thứ tự xuất hiện từ trái qua phải
    matches.sort((a, b) => a.start - b.start);

    // Dựng mảng kết quả JSX
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;

    matches.forEach((m, idx) => {
      // Thêm đoạn text thường đứng trước
      if (m.start > lastIdx) {
        parts.push(message.substring(lastIdx, m.start));
      }

      // Thêm nút bấm cho thẻ bài
      const matchedText = message.substring(m.start, m.end);
      parts.push(
        <button
          key={`card-link-${idx}-${m.card.id}`}
          onClick={() => setSelectedCard(m.card)}
          className="font-bold underline text-rose-400 hover:text-rose-300 hover:brightness-125 transition-all px-0.5 cursor-pointer text-left focus:outline-none"
          type="button"
        >
          {matchedText}
        </button>
      );

      lastIdx = m.end;
    });

    if (lastIdx < message.length) {
      parts.push(message.substring(lastIdx));
    }

    return parts.length > 0 ? parts : message;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 font-sans relative">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">
          Nhật Ký Trận Đấu (Battle Logs)
        </h3>
        <span className="text-[10px] text-neutral-500 font-mono">
          Tổng số sự kiện: {logs.length}
        </span>
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
        {logs.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 italic py-4">Chưa có hoạt động nào được ghi nhận.</p>
        ) : (
          logs.map((log) => {
            const timeString = new Date(log.timestamp).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            return (
              <div 
                key={log.id}
                className={`p-3 rounded-xl border-y border-r border-neutral-900/40 text-xs flex items-start gap-2.5 transition-all hover:scale-[1.005] ${getLogBg(log.type)}`}
              >
                <div className="pt-0.5">{getLogIcon(log.type)}</div>
                <div className="space-y-0.5 flex-1">
                  <p className="leading-relaxed font-medium">
                    {renderMessageWithClickableCards(log.message)}
                  </p>
                  <span className="text-[9px] text-neutral-500 font-mono block">
                    {timeString}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CARD DETAILS MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative space-y-4 overflow-hidden">
            
            {/* Lớp màu phát sáng tùy thuộc hệ thẻ */}
            <div 
              className={`absolute top-0 left-0 w-full h-1.5 ${
                selectedCard.type === CardType.HERMIT 
                  ? "bg-emerald-500" 
                  : selectedCard.type === CardType.LIGHT 
                    ? "bg-blue-500" 
                    : "bg-orange-500"
              }`}
            />

            {/* Nút đóng */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header chi tiết */}
            <div className="text-center space-y-1 pt-2">
              <span 
                className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border ${
                  selectedCard.type === CardType.HERMIT
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                    : selectedCard.type === CardType.LIGHT
                      ? "bg-blue-950/40 text-blue-400 border-blue-900/40"
                      : "bg-orange-950/40 text-orange-400 border-orange-900/40"
                }`}
              >
                {selectedCard.type === CardType.HERMIT 
                  ? "Bộ Bài Ẩn Sĩ (Hermit)" 
                  : selectedCard.type === CardType.LIGHT 
                    ? "Bộ Bài Ánh Sáng (Light)" 
                    : "Bộ Bài Bóng Tối (Shadow)"}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
                {selectedCard.name}
              </h3>
              <p className="text-[10px] text-neutral-500">
                {selectedCard.isEquipment ? "🛡️ Thẻ Trang Bị Hộ Thân" : "⚡ Thẻ Vật Phẩm Một Lần"}
              </p>
            </div>

            {/* Content chi tiết */}
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-900 p-4 space-y-3.5">
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 block font-semibold uppercase tracking-wider">
                  Mô tả thẻ bài:
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                  {selectedCard.description}
                </p>
              </div>

              <div className="space-y-1 border-t border-neutral-800 pt-3">
                <span className="text-[9px] text-rose-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hiệu ứng kích hoạt:
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {selectedCard.effectText}
                </p>
              </div>
            </div>

            {/* Nút đóng ở dưới */}
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition-all shadow"
            >
              ĐÓNG CỬA SỔ
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
