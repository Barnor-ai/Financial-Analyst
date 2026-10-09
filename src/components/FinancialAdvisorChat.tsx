/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User, Landmark
} from 'lucide-react';
import { ChatMessage, UserProfile, PeriodFinancialData, FinancialAnalysisReport } from '../types';

interface FinancialAdvisorChatProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  analysis: FinancialAnalysisReport | null;
}

const STARTER_PROMPTS = [
  'What are some practical cash flow improvement plans?',
  'Analyze my operating margin trends and expenses.',
  'How is my solvency and debt exposure risk?',
  'What is our projected burn rate and runaway?'
];

export default function FinancialAdvisorChat({ profile, periods, analysis }: FinancialAdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const defaultCompanyName = profile.companyName.trim() || 'your company';
    setMessages([
      {
        id: 'init-message',
        sender: 'ai',
        text: `Hello! I am your FinScope AI Financial Advisor. I have loaded the financial statements and ratios for **${defaultCompanyName}** in the **${profile.industry}** sector.\n\nFeel free to ask me anything about your cash conversion cycles, margins, liquidity, solvency, debt structure, or board recommendations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [profile.companyName, profile.industry]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          companyProfile: profile,
          currentData: periods,
          currentAnalysis: analysis
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Chatbot failed to respond.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: resData.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Advisory session error:** ${error.message || 'Check connection or configuration details.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl flex flex-col h-[580px] shadow-[0_4px_24px_rgba(11,25,44,0.06)] overflow-hidden text-left" id="ai-chatbox">
      
      {/* Top Advisor Header */}
      <div className="bg-[#FAF7F2] border-b border-[#E8E2D8] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#0B192C] flex items-center justify-center text-[#D4A347] font-bold shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h4 className="font-serif-display text-sm font-semibold text-[#0B192C]">
              FinScope AI Advisory Partner
            </h4>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Active • Grounded in your ledger data</span>
            </div>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (messages.length > 0) {
              setMessages([messages[0]]);
            }
          }}
          className="p-1.5 px-3 text-xs font-medium text-slate-600 hover:text-[#0B192C] rounded-lg bg-white border border-[#E8E2D8] hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Reset Chat
        </button>
      </div>

      {/* Messages Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs shadow-xs ${
                isUser 
                  ? 'bg-[#0B192C] text-white' 
                  : 'bg-[#FAF7F2] border border-[#E8E2D8] text-[#0B192C]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Landmark className="w-4 h-4 text-[#D4A347]" />}
              </div>
              
              <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                isUser 
                  ? 'bg-[#0B192C] text-white rounded-tr-none text-left' 
                  : 'bg-[#FAF7F2] border border-[#E8E2D8] text-slate-800 rounded-tl-none text-left'
                }`}
              >
                <div className="whitespace-pre-wrap space-y-1">
                  {m.text.split('\n').map((para, pIdx) => {
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIndex = 0;
                    let match;

                    while ((match = boldRegex.exec(para)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(para.substring(lastIndex, match.index));
                      }
                      parts.push(
                        <strong key={match.index} className={isUser ? "text-[#E5A93C] font-bold" : "text-[#0B192C] font-bold"}>
                          {match[1]}
                        </strong>
                      );
                      lastIndex = boldRegex.lastIndex;
                    }
                    if (lastIndex < para.length) {
                      parts.push(para.substring(lastIndex));
                    }

                    return (
                      <p key={pIdx}>
                        {parts.length > 0 ? parts : para}
                      </p>
                    );
                  })}
                </div>
                <div className={`text-[10px] mt-2 text-right font-mono ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D4A347]">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl rounded-tl-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#0B192C] rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-[#0B192C] rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-[#0B192C] rounded-full animate-bounce delay-300" />
              <span className="text-xs text-slate-500 font-medium ml-1">Analyzing financial metrics...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Starter Prompts */}
      <div className="px-4 py-2 bg-[#FAF7F2] border-t border-[#E8E2D8] flex gap-2 overflow-x-auto select-none no-scrollbar shrink-0">
        {STARTER_PROMPTS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#E8E2D8] rounded-full text-xs font-medium text-slate-700 hover:text-[#0B192C] transition-all cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(userInput);
        }}
        className="p-3 bg-white border-t border-[#E8E2D8] flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`Ask about ${profile.companyName || 'your company'}'s solvency, cash flows, or profitability...`}
          disabled={isSending}
          className="flex-1 px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B192C] focus:bg-white transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!userInput.trim() || isSending}
          className="p-2.5 bg-[#0B192C] hover:bg-[#162A45] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
