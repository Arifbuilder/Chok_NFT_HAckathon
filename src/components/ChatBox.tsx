import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/game';
import { socketService } from '../services/socket';
import { MessageSquare, Send, Sparkles, User, CheckCircle2, X } from 'lucide-react';

interface ChatBoxProps {
  chatHistory: ChatMessage[];
  currentUserId: string;
  onClose?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ chatHistory, currentUserId, onClose }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socketService.sendChat(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-80 max-w-[90vw] h-[360px] max-h-[50vh] sm:max-h-[360px] bg-slate-900/95 border border-purple-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col justify-between text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <MessageSquare className="w-4 h-4 text-purple-400" /> Chog World Chat
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs scrollbar-thin scrollbar-thumb-slate-700">
        {chatHistory.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="bg-purple-950/40 border border-purple-800/30 text-purple-300 rounded-lg p-1.5 text-[11px] font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  ? 'bg-purple-900/30 border border-purple-500/30 ml-4'
                  : 'bg-slate-800/60 border border-slate-700/50 mr-4'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className={`font-bold flex items-center gap-1 ${isSelf ? 'text-purple-300' : 'text-emerald-400'}`}>
                  <User className="w-3 h-3" /> {msg.senderNickname}
                  {msg.isVerifiedNFT && (
                    <span title="Verified Monad NFT Holder">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </span>
                  )}
                </span>
                <span className="opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-200 font-normal break-words mt-0.5">{msg.text}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="mt-2 flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={150}
          placeholder="Type a message..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
