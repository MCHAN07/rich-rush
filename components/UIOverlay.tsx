/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { 
  Building2, 
  CircleDollarSign, 
  Users, 
  ChevronRight, 
  Newspaper, 
  Trash2, 
  Route, 
  Home, 
  Store, 
  Factory, 
  TreePine, 
  Palmtree, 
  Trophy,
  AlertCircle,
  TrendingUp,
  Cpu,
  Waves,
  Pill,
  Wrench,
  Utensils,
  Briefcase,
  Zap,
  Activity,
  BarChart3,
  Globe,
  Wallet,
  School,
  GraduationCap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BuildingType, CityStats, NewsItem } from '../types';
import { BUILDINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  newsFeed: NewsItem[];
}

const tools = [
  BuildingType.None,
  BuildingType.Road,
  BuildingType.Kost,
  BuildingType.Park,
  BuildingType.WarungMakan,
  BuildingType.Residential,
  BuildingType.Laundry,
  BuildingType.Apotek,
  BuildingType.Bengkel,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Mosque,
  BuildingType.BigHouse,
  BuildingType.Sekolah,
  BuildingType.PowerPlant,
  BuildingType.Hospital,
  BuildingType.Universitas,
  BuildingType.Skyscraper,
];

const ToolIcon = ({ type }: { type: BuildingType }) => {
  switch (type) {
    case BuildingType.None: return <Trash2 className="w-5 h-5" />;
    case BuildingType.Road: return <Route className="w-5 h-5" />;
    case BuildingType.Residential: return <Home className="w-5 h-5" />;
    case BuildingType.BigHouse: return <Building2 className="w-5 h-5" />;
    case BuildingType.Commercial: return <Store className="w-5 h-5" />;
    case BuildingType.Industrial: return <Factory className="w-5 h-5" />;
    case BuildingType.Park: return <TreePine className="w-5 h-5" />;
    case BuildingType.Mosque: return <Palmtree className="w-5 h-5" />;
    case BuildingType.Hospital: return <AlertCircle className="w-5 h-5" />;
    case BuildingType.Skyscraper: return <TrendingUp className="w-5 h-5" />;
    case BuildingType.PowerPlant: return <Cpu className="w-5 h-5" />;
    case BuildingType.Kost: return <Building2 className="w-5 h-5" />;
    case BuildingType.Laundry: return <Waves className="w-5 h-5" />;
    case BuildingType.Apotek: return <Pill className="w-5 h-5" />;
    case BuildingType.Bengkel: return <Wrench className="w-5 h-5" />;
    case BuildingType.WarungMakan: return <Utensils className="w-5 h-5" />;
    case BuildingType.Sekolah: return <School className="w-5 h-5" />;
    case BuildingType.Universitas: return <GraduationCap className="w-5 h-5" />;
    default: return <Building2 className="w-5 h-5" />;
  }
};

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  newsFeed,
}) => {
  const newsRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = React.useState(false);
  const infoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedTool !== BuildingType.None && selectedTool !== BuildingType.Road) {
      setShowInfo(true);
      // Clear existing timer
      if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
      // Set new timer
      infoTimerRef.current = setTimeout(() => {
        setShowInfo(false);
      }, 5000);
    } else {
      setShowInfo(false);
    }
    
    return () => {
      if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    };
  }, [selectedTool]);

  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      
      {/* HEADER: TYCOON DASHBOARD */}
      <div className="flex flex-wrap items-center justify-start gap-4 pointer-events-auto">
        
        {/* METRICS (UNIFORM STYLED CARDS) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/20 rounded-[2.5rem] px-6 py-5 min-w-[200px] h-[110px] shadow-2xl relative overflow-hidden group flex flex-col justify-center"
        >
          <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-110">
             <Wallet className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <CircleDollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Aset Tunai</span>
          </div>
          <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none block">
            ${stats.money.toLocaleString()}
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-950/90 backdrop-blur-2xl border border-blue-500/20 rounded-[2.5rem] px-6 py-5 min-w-[200px] h-[110px] shadow-2xl relative overflow-hidden group flex flex-col justify-center"
        >
          <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-110">
             <Globe className="w-24 h-24 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Penduduk</span>
          </div>
          <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none block">
            {stats.population.toLocaleString()}
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-950/90 backdrop-blur-2xl border border-amber-500/20 rounded-[2.5rem] px-6 py-5 min-w-[200px] h-[110px] shadow-2xl relative overflow-hidden group flex flex-col justify-center"
        >
          <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-110">
             <Trophy className="w-24 h-24 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Reputasi</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">
              {Math.floor(stats.reputation)}%
            </span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.reputation}%` }}
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400" 
              />
            </div>
          </div>
        </motion.div>

        {/* CALENDAR CARD (UNIFORM STYLE) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-950/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] px-6 py-5 min-w-[200px] h-[110px] shadow-2xl flex flex-col justify-center relative overflow-hidden group"
        >
           <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-110">
             <Activity className="w-24 h-24 text-white/20" />
           </div>
           <div className="flex items-center gap-2 mb-1.5 opacity-60">
             <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Simulasi Waktu</span>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">
               HARI {stats.day}
             </span>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-black text-amber-400/80 uppercase">AKTIF</span>
             </div>
           </div>
        </motion.div>
      </div>

      {/* CENTER: NEWS LOG (3D HOVER EFFECT) */}
      <div className="absolute bottom-52 left-6 w-full max-w-sm pointer-events-none">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 px-2 mb-1">
              <AnimatePresence>
                 {newsFeed.length > 0 && (
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }} 
                     className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" 
                   />
                 )}
              </AnimatePresence>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Market Intel Stream</span>
              <div className="flex-1 h-[1px] bg-white/10" />
           </div>

           <div ref={newsRef} className="max-h-[220px] overflow-hidden space-y-2 pointer-events-auto [mask-image:linear-gradient(to_top,black_80%,transparent)] py-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {newsFeed.slice(-6).map((news, idx) => (
                  <motion.div 
                    key={news.id}
                    layout
                    initial={{ x: -30, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all shadow-lg backdrop-blur-md flex items-start gap-3 group",
                      news.type === 'positive' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" :
                      news.type === 'negative' ? "bg-red-500/10 border-red-500/20 text-red-100" :
                      "bg-slate-900/60 border-white/10 text-white/80"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px]",
                      news.type === 'positive' ? "bg-emerald-500/20" : 
                      news.type === 'negative' ? "bg-red-500/20" : "bg-white/10"
                    )}>
                       {news.type === 'positive' ? <TrendingUp className="w-3 h-3" /> : 
                        news.type === 'negative' ? <AlertCircle className="w-3 h-3" /> : 
                        <Newspaper className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold leading-tight">{news.text}</p>
                      <span className="text-[8px] opacity-30 font-mono mt-1 block">LOG_ID: {news.id.slice(-4)}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {newsFeed.length === 0 && (
                <div className="flex flex-col items-center py-10 opacity-20 italic text-xs gap-2">
                  <BarChart3 className="w-6 h-6 animate-pulse" />
                  <span>Menganalisis fluktuasi pasar...</span>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* FOOTER: THE BUILDER DOCK */}
      <div className="flex flex-col items-center gap-6">
        
        {/* SELECTED TOOL PREVIEW (3D CARD) */}
        <AnimatePresence>
          {showInfo && selectedTool !== BuildingType.None && selectedTool !== BuildingType.Road && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 20, opacity: 0 }}
               className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center gap-8 min-w-[380px]"
             >
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner group overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <ToolIcon type={selectedTool} />
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{BUILDINGS[selectedTool].name}</h3>
                      <span className="text-2xl font-black text-emerald-400 font-mono">-${BUILDINGS[selectedTool].cost}</span>
                   </div>
                   <p className="text-xs text-white/40 font-bold mb-4">{BUILDINGS[selectedTool].description}</p>
                   <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                         <Users className="w-3.5 h-3.5 text-blue-400" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Kebutuhan Penduduk</span>
                            <span className="text-xs font-black text-blue-400">+{BUILDINGS[selectedTool].popGen}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Proyeksi Laba</span>
                            <span className="text-xs font-black text-emerald-400">+${BUILDINGS[selectedTool].incomeGen}/H</span>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* THE MAIN DOCK */}
        <div className="relative pointer-events-auto group w-full md:max-w-4xl">
           <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative bg-slate-950/80 backdrop-blur-3xl border-t border-white/10 rounded-[3.5rem] p-3 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3">
              
              {/* Menu Label (Vertical) */}
              <div className="flex flex-col items-center justify-center px-4 border-r border-white/10 py-1">
                 <Zap className="w-3.5 h-3.5 text-amber-400 mb-1" />
                 <span className="text-[8px] font-black text-white/20 uppercase [writing-mode:vertical-lr] tracking-widest">DOK ASET</span>
              </div>

              {/* Tools Loop */}
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2 px-2">
                {tools.map((type) => {
                  const config = BUILDINGS[type];
                  const isActive = selectedTool === type;
                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectTool(type)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-3 rounded-[2rem] min-w-[75px] h-20 transition-all duration-300",
                        isActive 
                          ? "bg-white text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.4)]" 
                          : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <ToolIcon type={type} />
                      <span className="text-[7px] font-black uppercase mt-1 tracking-tighter text-center leading-[1.1] w-full px-0.5">
                         {config.name}
                      </span>
                      {config.cost > 0 && !isActive && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-black font-black text-[7px] px-1.5 py-0.5 rounded-full shadow-lg">
                           ${config.cost}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default UIOverlay;
