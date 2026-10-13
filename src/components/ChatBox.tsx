import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/game';
import { socketService } from '../services/socket';
import { MessageSquare, Send, Sparkles, User, CheckCircle2, X } from 'lucide-react';

interface ChatBoxProps {
  chatHistory: ChatMessage[];
  currentUserId: string;
  onClose?: () => void;
  /** When true, ChatBox fills its parent height instead of using a fixed height */
  embedded?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ chatHistory, currentUserId, onClose, embedded }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputText.trim();
    if (!t) return;
    socketService.sendChat(t);
    setInputText('');
  };

  const containerCls = embedded
    ? 'flex flex-col h-full bg-transparent text-white'
    : 'w-full h-72 sm:h-80 bg-slate-900/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col text-white';

  return (
    <div className={containerCls}>
      {/* Header — only in non-embedded (mobile drawer) */}
      {!embedded && (
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <MessageSquare className="w-4 h-4 text-purple-400" /> Chat
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5 text-xs scrollbar-thin scrollbar-thumb-slate-700">
        {chatHistory.length === 0 && (
          <p className="text-slate-600 text-center pt-4 text-[11px]">No messages yet...</p>
        )}
        {chatHistory.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex items-start gap-1.5 bg-purple-950/30 border border-purple-800/20 rounded-lg p-1.5 text-[11px] text-purple-300">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{msg.text}</span>
              </div>
            );
          }
          const isSelf = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 rounded-xl p-2 ${
                isSelf
                  ? 'bg-purple-900/30 border border-purple-500/25 ml-4'
                  : 'bg-slate-800/50 border border-slate-700/40 mr-4'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className={`font-bold flex items-center gap-1 ${isSelf ? 'text-purple-300' : 'text-emerald-400'}`}>
                  <User className="w-2.5 h-2.5" /> {msg.senderNickname}
                  {msg.isVerifiedNFT && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                </span>
                <span className="opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-200 break-words leading-snug">{msg.text}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 px-3 py-2 border-t border-slate-800 flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={150}
          placeholder="Say something..."
          className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
        />
        <button type="submit" className="shrink-0 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
