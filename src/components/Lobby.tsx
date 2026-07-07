import React, { useState, useEffect } from "react";
import { Users, User, Shield, Globe, Lock, Play, Plus, ArrowRight, RefreshCw, Bot, Sparkles, MessageSquare } from "lucide-react";
import { createGameRoom, joinGameRoom, getPublicRooms } from "../firebase";

import bgPc from "../../assets/images/bg-pc-compressed.png";
import bgMobile from "../../assets/images/bg-mobile-compressed.png";

interface LobbyProps {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  onStartSoloGame: () => void;
  onEnterRoom: (roomId: string) => void;
}

export default function Lobby({
  playerId,
  playerName,
  setPlayerName,
  onStartSoloGame,
  onEnterRoom
}: LobbyProps) {
  const [activeTab, setActiveTab] = useState<"solo" | "multiplayer">("multiplayer");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load public rooms
  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const rooms = await getPublicRooms();
      setPublicRooms(rooms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if ("multiplayer" === activeTab) {
      fetchPublicRooms();
    }
  }, [activeTab]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setErrorMsg("Vui lòng nhập biệt danh trước khi tạo phòng!");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const newRoomId = await createGameRoom(playerId, playerName.trim(), isPublicRoom);
      onEnterRoom(newRoomId);
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tạo phòng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRoom = async (targetRoomId: string) => {
    const cleanId = targetRoomId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Vui lòng nhập mã phòng!");
      return;
    }
    if (!playerName.trim()) {
      setErrorMsg("Vui lòng nhập biệt danh trước khi vào phòng!");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      await joinGameRoom(cleanId, playerId, playerName.trim());
      onEnterRoom(cleanId);
    } catch (err: any) {
      setErrorMsg(err.message || "Mã phòng không hợp lệ hoặc lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 font-sans relative z-10">
      
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

      {/* HEADER SECTION */}
      <div className="text-center space-y-3 mb-8 animate-fadeIn">
        <div className="inline-flex p-3 bg-gradient-to-b from-[#7ba2be]/10 to-[#4437ac]/20 border border-[#7ba2be]/30 rounded-2xl mb-1 text-[#7ba2be] shadow-[0_0_15px_rgba(123,162,190,0.2)] animate-pulse">
          <Shield className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7ba2be] via-white to-[#4437ac] filter drop-shadow-[0_2px_8px_rgba(68,55,172,0.4)] sm:text-5xl uppercase">
          SHADOW HUNTERS
        </h1>
        <p className="text-[#7ba2be] font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Phiên Bản Việt Hóa Đặc Biệt • Thần Thoại & Trốn Chạy
        </p>
        <p className="text-neutral-400 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
          Bước vào cuộc chiến ẩn vai kịch tính giữa Thợ Săn chính nghĩa, Ác Quỷ Bóng Tối và những Người Dân Thường mưu mô xảo quyệt.
        </p>
      </div>

      {/* MAIN PORTAL CONTAINER */}
      <div className="bg-[#0a0c16]/75 backdrop-blur-xl border border-[#4437ac]/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(68,55,172,0.2)] animate-slideUp">
        
        {/* Nickname Section */}
        <div className="p-6 border-b border-white/5 bg-[#03050a]/60">
          <label className="block text-[10px] font-extrabold text-[#7ba2be] uppercase tracking-widest mb-2">
            Biệt Danh Của Bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7ba2be]/70">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              id="lobby_nickname_input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
              placeholder="Nhập tên nhân vật... (VD: Khải Huyền)"
              className="w-full pl-10 pr-4 py-3 bg-[#030408]/85 border border-[#4437ac]/30 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#7ba2be]/30 focus:border-[#7ba2be] transition-all text-xs font-semibold"
            />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-[#03050a]/30">
          <button
            onClick={() => { setActiveTab("solo"); setErrorMsg(""); }}
            className={`flex-1 py-3 text-center font-bold text-xs transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              "solo" === activeTab
                ? "border-[#7ba2be] text-[#7ba2be] bg-[#4437ac]/10"
                : "border-transparent text-neutral-400 hover:text-white hover:bg-white/2"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Luyện Tập Với AI
          </button>
          <button
            onClick={() => { setActiveTab("multiplayer"); setErrorMsg(""); }}
            className={`flex-1 py-3 text-center font-bold text-xs transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              "multiplayer" === activeTab
                ? "border-[#7ba2be] text-[#7ba2be] bg-[#4437ac]/10"
                : "border-transparent text-neutral-400 hover:text-white hover:bg-white/2"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Đại Chiến Online
          </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/20 border-b border-rose-900/30 text-rose-400 text-xs text-center font-medium animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 min-h-[220px]">
          {"solo" === activeTab ? (
            <div className="space-y-6 text-center max-w-md mx-auto py-2">
              <div className="p-4 bg-[#030408]/60 rounded-2xl border border-[#4437ac]/20 text-left space-y-2">
                <span className="text-[9px] uppercase font-black tracking-widest text-[#7ba2be] bg-[#7ba2be]/10 px-2 py-0.5 rounded border border-[#7ba2be]/20">
                  Luyện Tập
                </span>
                <h3 className="text-white font-bold text-sm">Chế độ chơi đơn nhanh</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Bắt đầu trận đấu ngay lập tức với 3 AI Bots thông minh có khả năng tự động di chuyển, dùng thẻ bài, phán đoán phe phái và tấn công kịch tính. Thử thách kĩ năng ẩn vai của bạn!
                </p>
              </div>

              <button
                onClick={() => {
                  if (!playerName.trim()) {
                    setErrorMsg("Vui lòng nhập biệt danh để tiếp tục!");
                    return;
                  }
                  onStartSoloGame();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] hover:shadow-[0_0_20px_rgba(123,162,190,0.3)] active:scale-[0.98] rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Vào Trận Ngay
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Create Room */}
                <div className="space-y-3 bg-[#030408]/40 border border-white/5 rounded-2xl p-5 hover:border-[#4437ac]/30 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#7ba2be]" />
                      Tạo Phòng Mới
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Khởi tạo phòng chơi của riêng bạn để mời bạn bè hoặc cho phép người lạ tìm thấy trên bảng phòng chờ công khai.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between bg-[#030408]/70 px-3.5 py-2 rounded-xl border border-white/5">
                      <span className="text-[11px] text-neutral-400 font-semibold">Chế độ phòng</span>
                      <button
                        onClick={() => setIsPublicRoom(!isPublicRoom)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          isPublicRoom 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isPublicRoom ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isPublicRoom ? "CÔNG KHAI" : "BẢO MẬT"}
                      </button>
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      disabled={submitting}
                      className="w-full py-3 bg-[#4437ac] hover:bg-[#5b4fcd] disabled:opacity-50 active:scale-[0.98] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#7ba2be]/20"
                    >
                      Tạo Phòng {isPublicRoom ? "Công Khai" : "Mật"}
                    </button>
                  </div>
                </div>

                {/* Join Room */}
                <div className="space-y-3 bg-[#030408]/40 border border-white/5 rounded-2xl p-5 hover:border-[#4437ac]/30 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-[#7ba2be]" />
                      Vào Phòng Đang Có
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Nhập mã phòng gồm 5 chữ cái viết hoa được chia sẻ từ bạn bè để kết nối chiến đấu cùng nhau.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="lobby_room_id_input"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                        placeholder="MÃ PHÒNG"
                        maxLength={5}
                        className="flex-1 px-3 py-2 bg-[#030408]/90 border border-[#4437ac]/30 rounded-xl text-white text-center font-black tracking-widest text-xs placeholder-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#7ba2be]"
                      />
                      <button
                        onClick={() => handleJoinRoom(roomIdInput)}
                        disabled={submitting}
                        className="px-5 bg-[#4437ac] hover:bg-[#7ba2be] hover:shadow-[0_0_15px_rgba(123,162,190,0.3)] disabled:opacity-50 active:scale-[0.98] rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                      >
                        VÀO
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Public Rooms List */}
              <div className="border-t border-white/5 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-[#7ba2be] uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Danh Sách Phòng Đang Chờ
                  </h4>
                  <button
                    onClick={fetchPublicRooms}
                    className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingRooms ? "animate-spin" : ""}`} />
                    Làm mới
                  </button>
                </div>

                {loadingRooms ? (
                  <p className="text-center text-xs text-neutral-500 py-6">Đang quét tìm các phòng game khả dụng...</p>
                ) : 0 === publicRooms.length ? (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-[#030408]/20">
                    <p className="text-xs text-neutral-500">Chưa có phòng chơi công khai nào khả dụng. Hãy chủ động tạo phòng mới!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {publicRooms.map((room) => (
                      <div 
                        key={room.roomId}
                        className="p-3.5 bg-[#030408]/50 border border-white/5 rounded-xl flex items-center justify-between hover:border-[#7ba2be]/30 transition-all"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-black tracking-wider text-[#7ba2be] block">
                            PHÒNG #{room.roomId}
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-medium">
                            Người chơi: {room.players?.length || 0}/8 • Host: {room.players?.[0]?.name || "Ẩn danh"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.roomId)}
                          className="px-3 py-1.5 bg-[#4437ac]/85 hover:bg-[#7ba2be] text-[10px] font-bold rounded-lg text-white transition-all cursor-pointer"
                        >
                          Tham Gia
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
