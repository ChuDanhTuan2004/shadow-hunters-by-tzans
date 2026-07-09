import React, { useState } from "react";
import { MessageSquare, Calendar, HelpCircle, Swords, Award, AlertCircle, RefreshCw, ShieldAlert, Heart } from "lucide-react";
import { GameLog } from "../types";
import { DECK_HERMIT, DECK_LIGHT, DECK_SHADOW, GameCard } from "../data/cards";
import CardDetailModal from "./dialogs/CardDetailModal";

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
    <div className="space-y-2 font-sans relative">
      <div className="space-y-2 pr-1 scrollbar-thin">
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

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />

    </div>
  );
}
