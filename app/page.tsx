"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  RefreshCw,
  Send,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  Briefcase,
  Wrench
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for consistent class merging ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

// Matches backend KPI structure
type KPI = {
  label: string;
  value: string;
  change: string; // Additional context
  trend: 'up' | 'down' | 'neutral';
  icon: any;
};

type BoardType = 'all' | 'deals' | 'work_orders';

// --- Mock Defaults for Initial State ---
const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content: "Welcome to Skylark BI. I'm connected to your Monday.com boards. \n\nI can analyze your **Deals** and **Work Orders**. Select a dashboard on the left to focus my answers.",
    timestamp: "Just now"
  }
];

const SUGGESTIONS = {
  deals: [
    "Summarize pipeline health",
    "Show deals > $100k",
    "Identify stalled opportunities",
    "Revenue forecast for Q3"
  ],
  work_orders: [
    "List critical delays",
    "Billing status report",
    "Breakdown by Nature of Work",
    "Show receivables pending"
  ]
};

const RECENT_QUERIES = [
  "Pipeline Forecast Q3",
  "Critical Delays Report",
  "High Value Opportunities"
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
      active
        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
    {label}
  </button>
);

const KPICard = ({ kpi, index, loading }: { kpi: KPI, index: number, loading: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
    className="glass p-4 rounded-2xl flex flex-col gap-2 hover:bg-white/[0.03] transition-colors cursor-pointer group border-slate-800 min-h-[100px]"
  >
    {loading ? (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
        <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{kpi.label}</span>
          <div className="p-1.5 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
            <kpi.icon className={cn("w-4 h-4",
              kpi.trend === 'up' ? "text-emerald-400" :
                kpi.trend === 'down' ? "text-rose-400" : "text-blue-400"
            )} />
          </div>
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-2xl font-semibold text-slate-100 tracking-tight">{kpi.value}</span>
          <span className={cn("text-xs font-medium mt-1",
            kpi.trend === 'up' ? "text-emerald-400" :
              kpi.trend === 'down' ? "text-rose-400" : "text-slate-400"
          )}>
            {kpi.change}
          </span>
        </div>
      </>
    )}
  </motion.div>
);

const ChatMessage = ({ message }: { message: Message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex gap-4 w-full max-w-3xl mb-6",
        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-xs font-bold text-white">AI</span>
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-1 min-w-0 max-w-[85%]",
        isAssistant ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap",
          isAssistant
            ? "glass text-slate-200 border-slate-700/50 rounded-tl-sm"
            : "bg-blue-600 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(37,99,235,0.15)]"
        )}>
          {message.content}
        </div>
        <span className="text-[10px] text-slate-500 font-medium px-1">
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
};

// Format raw number to K/M
const formatMoney = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val}`;
};

export default function SkylarkBIAgent() {
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    deals: [
      {
        id: '0-sales',
        role: 'assistant',
        content: "Welcome to the **Sales Pipeline Dashboard**. \n\nI can help you analyze revenue, probability, and deal stages. What would you like to check?",
        timestamp: "Just now"
      }
    ],
    work_orders: [
      {
        id: '0-wo',
        role: 'assistant',
        content: "Welcome to the **Operations Dashboard**. \n\nI'm tracking project delays, completion rates, and technical issues.",
        timestamp: "Just now"
      }
    ]
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeBoard, setActiveBoard] = useState<BoardType>('deals');

  // Derived current messages
  const messages = messagesMap[activeBoard] || [];

  // KPI State
  const [kpiData, setKPIData] = useState<any>(null);
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeBoard]);

  // Fetch Initial KPIs
  const refreshKPIs = async () => {
    setIsLoadingKPIs(true);
    setApiError(null);
    try {
      const res = await fetch('/api/kpi');
      if (!res.ok) throw new Error('API Failed');
      const data = await res.json();
      setKPIData(data.kpis);
    } catch (err) {
      setApiError("Failed to connect to Monday.com. Using offline fallback.");
      console.error(err);
    } finally {
      setIsLoadingKPIs(false);
    }
  };

  useEffect(() => {
    refreshKPIs();
  }, []);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Add User Message to current board
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeBoard]: [...(prev[activeBoard] || []), userMsg]
    }));

    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, activeBoard })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Update KPIs if returned
      if (data.kpis) {
        setKPIData(data.kpis);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesMap(prev => ({
        ...prev,
        [activeBoard]: [...(prev[activeBoard] || []), aiMsg]
      }));

    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Could not fetch response.'}. \n\nPlease check system logs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessagesMap(prev => ({
        ...prev,
        [activeBoard]: [...(prev[activeBoard] || []), errorMsg]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to filter/arrange KPIs based on Active Board
  const getFilteredKPIs = (): KPI[] => {
    if (!kpiData) {
      return [1, 2, 3, 4].map(i => ({ label: '...', value: '...', change: '...', trend: 'neutral', icon: TrendingUp } as KPI));
    }

    const allKPIs = [
      {
        label: 'Total Pipeline',
        value: formatMoney(kpiData.totalPipelineValue),
        change: `${kpiData.dealsCount} deals active`,
        trend: 'up' as const,
        icon: TrendingUp,
        board: 'deals'
      },
      {
        label: 'Expected Rev',
        value: formatMoney(kpiData.expectedRevenueWeighted),
        change: 'Weighted prob.',
        trend: 'neutral' as const,
        icon: CheckCircle2,
        board: 'deals'
      },
      {
        label: 'Open Deals',
        value: kpiData.openDealsCount.toString(),
        change: 'Opportunities',
        trend: 'neutral' as const,
        icon: Briefcase,
        board: 'deals'
      },
      {
        label: 'Total Projects',
        value: kpiData.totalWorkOrders.toString(),
        change: `${kpiData.completedWorkOrders} completed`,
        trend: 'up' as const,
        icon: Wrench,
        board: 'work_orders'
      },
      {
        label: 'Delayed Projects',
        value: kpiData.delayedWorkOrders.toString(),
        change: kpiData.delayedWorkOrders > 0 ? 'Critical' : 'On Track',
        trend: (kpiData.delayedWorkOrders > 0 ? 'down' : 'up') as 'down' | 'up',
        icon: AlertCircle,
        board: 'work_orders'
      },
    ];

    if (activeBoard === 'deals') {
      return allKPIs.filter(k => k.board === 'deals' || k.label === 'Delayed Projects'); // Hybrid view
    } else if (activeBoard === 'work_orders') {
      return allKPIs.filter(k => k.board === 'work_orders' || k.label === 'Total Pipeline');
    }
    return allKPIs.slice(0, 4);
  };

  const displayKPIs = getFilteredKPIs();

  // Get current board suggestions
  const currentSuggestions = activeBoard === 'work_orders' ? SUGGESTIONS.work_orders : SUGGESTIONS.deals;

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">

      {/* --- Sidebar --- */}
      <div className="w-64 flex-shrink-0 border-r border-slate-800/60 bg-[#0f172a]/95 flex flex-col p-4 z-20">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Skylark BI
          </span>
        </div>

        <div className="flex flex-col gap-1 mb-8">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dashboards</div>
          <SidebarItem
            icon={Briefcase}
            label="Sales Pipeline"
            active={activeBoard === 'deals'}
            onClick={() => setActiveBoard('deals')}
          />
          <SidebarItem
            icon={Wrench}
            label="Operations"
            active={activeBoard === 'work_orders'}
            onClick={() => setActiveBoard('work_orders')}
          />
        </div>

        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Queries</h3>
        </div>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-hide">
          {RECENT_QUERIES.map((q, i) => (
            <button key={i} className="text-left px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-sm truncate transition-colors">
              {q}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800/60 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Siddartha</span>
            <span className="text-xs text-slate-500">Founder</span>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-900/20 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-slate-800/60 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-slate-100 font-medium text-lg">
              {activeBoard === 'deals' ? 'Sales Pipeline Board' : 'Operations Board'}
            </h1>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              {apiError && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                  <FileWarning className="w-3 h-3" /> Offline Mode
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Last checked: Just now</span>
            <button
              onClick={refreshKPIs}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingKPIs && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col z-10 p-8" ref={scrollRef}>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8 shrink-0">
            {displayKPIs.map((kpi, i) => (
              <KPICard key={i} kpi={kpi} index={i} loading={isLoadingKPIs} />
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="mt-auto flex flex-col gap-2 min-h-[200px]">
              <AnimatePresence>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 mb-6"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="glass px-5 py-4 rounded-2xl rounded-tl-sm border-slate-700/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>

        {/* Input Area */}
        <div className="p-6 pt-0 z-20">
          {/* Quick Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-2">
            {currentSuggestions.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full glass hover:bg-white/10 text-xs text-slate-300 border-slate-700 transition-colors whitespace-nowrap"
              >
                {s}
              </motion.button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative flex bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl items-end overflow-hidden">
              <button className="p-4 text-slate-400 hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about ${activeBoard === 'deals' ? 'Sales' : 'Operations'}...`}
                className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 py-4 max-h-40 min-h-[56px] resize-none"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                className={cn(
                  "p-3 m-1.5 rounded-xl transition-all duration-200",
                  inputValue.trim()
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                )}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-600">AI can make mistakes. Verify important business data.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
