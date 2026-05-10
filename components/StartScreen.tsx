/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Play, ChevronRight, Briefcase, Building2, Trees, Car } from 'lucide-react';
import { motion } from 'motion/react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-6 bg-[#87CEEB] overflow-hidden font-sans">
      
      {/* Cartoon City Background (Improved CSS Paraphrase) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#B0E2FF] to-white" />
        
        {/* Distant Blue Buildings (The "Sea" of skyscrapers) */}
        <div className="absolute bottom-32 inset-x-0 flex items-end justify-between px-0 h-[60%] opacity-60">
          {[...Array(20)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0 }}
              animate={{ height: `${40 + Math.random() * 60}%` }}
              transition={{ delay: i * 0.05, duration: 1, ease: "easeOut" }}
              className="bg-sky-200 border-x border-sky-300/30"
              style={{ 
                width: `${4 + Math.random() * 6}%`, 
                flexShrink: 0
              }} 
            />
          ))}
        </div>

        {/* Medium Cyan Buildings (Skyscrapers from the image) */}
        <div className="absolute bottom-28 inset-x-0 flex items-end justify-around h-[50%] px-2">
          {[...Array(12)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${60 + Math.random() * 35}%`, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              className="bg-[#A0E2E1] border-r-4 border-[#8ACCCB] rounded-t-sm relative"
              style={{ 
                width: `${60 + Math.random() * 40}px`, 
              }}
            >
              <div className="grid grid-cols-2 gap-1 p-2 opacity-30">
                {[...Array(10)].map((_, j) => <div key={j} className="h-4 bg-white/40" />)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tan/Brown Mid-ground Buildings */}
        <div className="absolute bottom-20 inset-x-0 flex items-end justify-center gap-0.5 h-[30%] px-4">
          {[...Array(15)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 + i * 0.05, duration: 0.5 }}
              className="bg-[#D2B48C] border-r-2 border-[#BC8F8F] rounded-t-sm shadow-sm"
              style={{ 
                width: `${50 + Math.random() * 50}px`, 
                height: `${40 + Math.random() * 55}%`,
              }}
            >
               <div className="w-full h-1/4 bg-black/5" />
            </motion.div>
          ))}
        </div>

        {/* Greenery (Bushes/Trees) */}
        <div className="absolute bottom-12 inset-x-0 h-12 bg-[#228B22] z-10 flex items-end">
           <div className="flex w-full overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-16 h-10 bg-[#2E8B57] rounded-full -mb-4 -ml-4"
                />
              ))}
           </div>
        </div>

        {/* Road at the bottom */}
        <div className="absolute bottom-0 w-full h-12 bg-slate-600 z-20 border-t-4 border-slate-700">
           <div className="mt-5 w-full h-[2px] border-t-2 border-dashed border-white/40" />
        </div>
      </div>

      {/* Main Content Card */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="max-w-[520px] w-full bg-white/90 backdrop-blur-xl p-10 rounded-[4rem] relative z-30 shadow-[0_40px_80px_rgba(0,0,0,0.2)] text-center border-b-8 border-slate-200"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-lg mb-8 mx-auto border-4 border-white"
        >
            <Briefcase className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-6xl font-[1000] text-slate-800 tracking-tighter mb-4 leading-none uppercase italic"
        >
          Rich <span className="text-amber-500">Rush</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-500 font-bold mb-10 text-sm tracking-wide px-4"
        >
          Bangun bisnis impian, kuasai pasar, dan jadilah konglomerat terkaya di kota ini!
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: ["0 12px 0 rgba(30,41,59,0.3)", "0 18px 30px rgba(0,0,0,0.2)", "0 12px 0 rgba(30,41,59,0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={() => onStart()}
          className="w-full py-6 bg-slate-800 text-white font-[900] rounded-full hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 shadow-[0_12px_0_rgba(30,41,59,0.3)] group"
        >
          <span className="text-xl uppercase tracking-widest">Mulai Main</span>
          <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
        </motion.button>
        
        <div className="mt-8 flex justify-center gap-6 opacity-30">
          <Building2 className="w-6 h-6 text-slate-800" />
          <Trees className="w-6 h-6 text-slate-800" />
          <Car className="w-6 h-6 text-slate-800" />
        </div>
      </motion.div>

      <div className="absolute bottom-6 text-[10px] font-black text-white/50 uppercase tracking-[0.4em] z-10">
        v4.2.0-STABLE • dev edition
      </div>
    </div>
  );
};

export default StartScreen;
