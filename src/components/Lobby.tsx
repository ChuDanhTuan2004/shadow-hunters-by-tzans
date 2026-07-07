import React, { useState, useEffect } from "react";
import { Users, User, Shield, Globe, Lock, Play, Plus, ArrowRight, RefreshCw, Bot } from "lucide-react";
import { createGameRoom, joinGameRoom, getPublicRooms } from "../firebase";

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
    if (activeTab === "multiplayer") {
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 font-sans">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-2 text-rose-500">
          <Shield className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          SHADOW HUNTERS
        </h1>
        <p className="text-rose-400 font-medium text-sm tracking-wider uppercase">
          Phiên Bản Việt Hóa Đặc Biệt • Thần Thoại & Trốn Chạy
        </p>
        <p className="text-neutral-400 max-w-lg mx-auto text-sm leading-relaxed">
          Bước vào cuộc chiến ẩn vai kịch tính giữa Thợ Săn chính nghĩa, Ác Quỷ Bóng Tối và những Người Dân Thường mưu mô xảo quyệt.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Nickname Section */}
        <div className="p-6 sm:p-8 border-b border-neutral-800 bg-neutral-950/30">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
            Biệt Danh Của Bạn
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500">
              <User className="w-5 h-5" />
            </span>
            <input
              type="text"
              id="lobby_nickname_input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
              placeholder="Nhập tên nhân vật... (VD: Khải Huyền)"
              className="w-full pl-11 pr-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/20">
          <button
            onClick={() => { setActiveTab("solo"); setErrorMsg(""); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === "solo"
                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Bot className="w-4 h-4" />
            Chơi Đơn Với AI Bots
          </button>
          <button
            onClick={() => { setActiveTab("multiplayer"); setErrorMsg(""); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === "multiplayer"
                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Chơi Online Trực Tuyến
          </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 bg-red-950/30 border-b border-red-900/50 text-red-400 text-xs text-center font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 min-h-[250px]">
          {activeTab === "solo" ? (
            <div className="space-y-6 text-center max-w-md mx-auto py-4">
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800/60 text-left space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Khuyên Dùng
                </span>
                <h3 className="text-white font-semibold text-sm">Chế độ Solo luyện tập nhanh</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Bắt đầu trận đấu ngay lập tức với 3 AI Bots thông minh có khả năng tự động di chuyển, phán đoán, dùng tà thuật và tấn công vô cùng kịch tính. Trải nghiệm trọn vẹn luật chơi chuẩn quốc tế!
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
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] rounded-2xl text-white font-bold text-sm shadow-xl shadow-rose-950/30 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                Vào Trận Chiến Bots Ngay
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Create Room */}
                <div className="space-y-4 border-r border-neutral-800/60 pr-0 md:pr-8">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-rose-500" />
                    Tạo Phòng Mới
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Khởi tạo phòng chơi của riêng bạn để mời bạn bè hoặc cho phép người lạ tham gia từ phòng công khai.
                  </p>

                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">Chế độ phòng chơi</span>
                      <button
                        onClick={() => setIsPublicRoom(!isPublicRoom)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isPublicRoom 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isPublicRoom ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {isPublicRoom ? "Công Khai" : "Bảo Mật"}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={submitting}
                    className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 active:scale-[0.98] rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-neutral-700/50"
                  >
                    Tạo Phòng {isPublicRoom ? "Công Khai" : "Kín"}
                  </button>
                </div>

                {/* Join Room */}
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-rose-500" />
                    Vào Phòng Đã Có
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Nhập mã phòng gồm 5 ký tự viết hoa từ bạn bè để kết nối cùng thế giới trực tuyến.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="lobby_room_id_input"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      placeholder="MÃ PHÒNG (VD: ABCDE)"
                      maxLength={5}
                      className="flex-1 px-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-center font-bold tracking-widest placeholder-neutral-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      onClick={() => handleJoinRoom(roomIdInput)}
                      disabled={submitting}
                      className="px-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 active:scale-[0.98] rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center"
                    >
                      Vào
                    </button>
                  </div>
                </div>

              </div>

              {/* Public Rooms List */}
              <div className="border-t border-neutral-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Danh Sách Phòng Đang Chờ
                  </h4>
                  <button
                    onClick={fetchPublicRooms}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? "animate-spin" : ""}`} />
                    Làm mới
                  </button>
                </div>

                {loadingRooms ? (
                  <p className="text-center text-xs text-neutral-500 py-4">Đang truy vấn các phòng game...</p>
                ) : publicRooms.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-800 rounded-2xl">
                    <p className="text-xs text-neutral-500">Chưa có phòng chơi công khai nào khả dụng. Hãy tự lập phòng mới!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publicRooms.map((room) => (
                      <div 
                        key={room.roomId}
                        className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between hover:border-neutral-700 transition-all"
                      >
                        <div>
                          <span className="text-xs font-mono font-bold tracking-wider text-rose-500 block">
                            Phòng #{room.roomId}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Số người chơi: {room.players?.length || 0}/8 • Host: {room.players?.[0]?.name || "Ẩn danh"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.roomId)}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-rose-600 text-xs font-bold rounded-xl text-neutral-300 hover:text-white transition-all"
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
