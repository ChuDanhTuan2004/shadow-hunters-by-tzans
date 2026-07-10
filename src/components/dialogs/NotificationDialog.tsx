import React from "react";

interface NotificationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function NotificationDialog({ isOpen, title, message, onConfirm }: NotificationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-[10px] bg-[#7BA2BE]/10 text-[#7BA2BE] border border-[#7BA2BE]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block">
            Thông Báo
          </span>
          <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">
          {message}
        </p>

        <button
          onClick={onConfirm}
          className="w-full py-3 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] rounded-2xl text-white font-bold text-xs shadow-xl transition-all cursor-pointer active:scale-95"
        >
          ĐỒNG Ý
        </button>
      </div>
    </div>
  );
}
