/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, NewsItem, BuildingStatus } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { motion, AnimatePresence } from 'motion/react';

// Initialize empty grid with island shape generation for 3D visual interest
const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  // const center = GRID_SIZE / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  return grid;
};

function App() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ 
    money: INITIAL_MONEY, 
    population: 0, 
    day: 1,
    reputation: 50
  });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  
  // --- City HUD State ---
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); // Keep last few
  }, []);

  const fetchNews = useCallback(async () => {
    // Chance to fetch news
    if (Math.random() > 0.2) return; 

    // Varied news pool
    const events = [
      { text: "Karyawan merasa produktivitas meningkat di lingkungan kerja yang nyaman.", type: 'positive', cond: statsRef.current.population > 20 },
      { text: "Aset bisnis baru saja mengalami kenaikan nilai pasar yang signifikan.", type: 'positive', cond: statsRef.current.money > 1000 },
      { text: "Laporan harian: Penggunaan energi operasional berada di level efisien.", type: 'positive', cond: true },
      { text: "Beberapa karyawan mengeluhkan jarak tempuh antar aset yang jauh.", type: 'negative', cond: statsRef.current.population > 50 },
      { text: "Isu: Biaya pemeliharaan infrastruktur dasar mulai meningkat.", type: 'negative', cond: statsRef.current.day > 10 },
      { text: "Headline: Anda dinobatkan sebagai pengusaha muda paling agresif tahun ini.", type: 'positive', cond: statsRef.current.population > 100 },
      { text: "Kabar Pasar: Sektor retail sedang mengalami masa kejayaan.", type: 'neutral', cond: true },
      { text: "Rumor: Investor asing mulai melirik portofolio aset Anda.", type: 'neutral', cond: statsRef.current.money > 5000 },
      { text: "Data: Jumlah SDM yang bergabung dengan perusahaan Anda terus bertambah.", type: 'positive', cond: true },
      { text: "Warning: Kapasitas hunian karyawan mendekati ambang batas.", type: 'negative', cond: statsRef.current.population > 0 },
    ].filter(e => e.cond);

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    if (randomEvent) {
      addNewsItem({ id: Date.now().toString() + Math.random(), text: randomEvent.text, type: randomEvent.type as NewsItem['type'] });
    }
  }, [addNewsItem]);


  // --- Initial Setup ---
  useEffect(() => {
    if (!gameStarted) return;

    addNewsItem({ id: Date.now().toString(), text: "Inisialisasi RICH RUSH... Koneksi pasar terjalin. Analisis aset selesai.", type: 'positive' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);


  // --- Game Loop ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      // 1. Calculate income/pop gen
      let dailyIncome = 0;
      let dailyPopGrowth = 0;
      let buildingCounts: Record<string, number> = {};

      gridRef.current.flat().forEach(tile => {
        // Only count buildings from their origin tile to avoid duplicates for multi-tile ones
        if (tile.buildingType !== BuildingType.None && (tile.isOrigin !== false)) {
          // Status check
          const isOperational = !tile.status || tile.status === BuildingStatus.Normal;
          
          if (isOperational) {
            const config = BUILDINGS[tile.buildingType];
            dailyIncome += config.incomeGen;
            dailyPopGrowth += config.popGen;
            buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;
          } else if (tile.status === BuildingStatus.Fire) {
            dailyPopGrowth -= 2; // Fires scare people away
          }
        }
      });

      // Cap population growth by residential count just for some logic
      const resCount = (buildingCounts[BuildingType.Residential] || 0) + (buildingCounts[BuildingType.BigHouse] || 0) * 4;
      const maxPop = resCount * 50; // 50 people per house max

      // 2. Update Stats
      setStats(prev => {
        let newPop = prev.population + dailyPopGrowth;
        if (newPop > maxPop) newPop = maxPop; // limit
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5); // people leave if no homes

        // Update Reputation logic
        let dailyRepChange = 0;
        if (dailyPopGrowth > 0) dailyRepChange += 0.1;
        if (dailyIncome > 100) dailyRepChange += 0.05;

        const newStats = {
          ...prev,
          money: prev.money + dailyIncome,
          population: newPop,
          day: prev.day + 1,
          reputation: Math.max(0, Math.min(100, prev.reputation + dailyRepChange)),
        };
        
        return newStats;
      });

      // 3. Status Expansions & Incident Logic
      setGrid(currentGrid => {
        let hasChanges = false;
        const newGrid = currentGrid.map(row => row.map(tile => {
          // Automatic cooldown clearance
          if (tile.status === BuildingStatus.TheftCooldown && tile.statusExpiry && Date.now() >= tile.statusExpiry) {
            hasChanges = true;
            return { ...tile, status: BuildingStatus.Normal, statusExpiry: undefined };
          }
          return tile;
        }));

        // Incident Trigger (1-3% chance if money > 1500)
        const stats = statsRef.current;
        const incidentChance = stats.money > 1500 ? 0.02 : 0;
        if (Math.random() < incidentChance) {
           const buildings = newGrid.flat().filter(t => 
             t.buildingType !== BuildingType.None && 
             t.buildingType !== BuildingType.Road && 
             t.isOrigin !== false &&
             (!t.status || t.status === BuildingStatus.Normal)
           );

           if (buildings.length > 0) {
              const target = buildings[Math.floor(Math.random() * buildings.length)];
              const type = Math.random();
              
              const isBusiness = [
                BuildingType.Commercial, 
                BuildingType.Laundry, 
                BuildingType.Apotek, 
                BuildingType.Bengkel, 
                BuildingType.WarungMakan
              ].includes(target.buildingType);

              if (type < 0.4) { // 40% Fire (Any building)
                target.status = BuildingStatus.Fire;
                addNewsItem({ id: `fire-${Date.now()}`, text: `DARURAT: Kebakaran di ${BUILDINGS[target.buildingType].name}! Segera klik untuk padamkan ($50)!`, type: 'negative' });
                setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5) }));
              } else if (type < 0.7 && isBusiness) { // 30% Robbery (Retail/Outlets only)
                target.status = BuildingStatus.Robbed;
                addNewsItem({ id: `rob-${Date.now()}`, text: `KRIMINAL: Perampokan di ${BUILDINGS[target.buildingType].name}. Beroperasi terhenti! Butuh suntik dana.`, type: 'negative' });
                setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 2) }));
              } else if (isBusiness) { // 30% Theft (Retail/Outlets only)
                target.status = BuildingStatus.TheftCooldown;
                target.statusExpiry = Date.now() + 15000; // 15 seconds cooldown
                addNewsItem({ id: `theft-${Date.now()}`, text: `LAPORAN: Terjadi pencurian di ${BUILDINGS[target.buildingType].name}. Investigasi polisi berjalan...`, type: 'neutral' });
                setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 1) }));
              }
              hasChanges = true;
           }
        }

        return hasChanges ? newGrid : currentGrid;
      });

      // 4. Trigger news (with Missions/Advice)
      const currentStats = statsRef.current;
      if (currentStats.day % 5 === 0) {
        // Mission logic
        if (currentStats.population === 0) {
          addNewsItem({ id: `mission-${currentStats.day}`, text: "MISI: Bangun hunian (Rumah Kontrakan) untuk menarik penduduk!", type: 'info' });
        } else if (buildingCounts[BuildingType.Commercial] === undefined && currentStats.money > 500) {
          addNewsItem({ id: `mission-${currentStats.day}`, text: "MISI: Bangun Outlet Retail untuk meningkatkan profit harian.", type: 'info' });
        } else if (currentStats.population > 50 && buildingCounts[BuildingType.WarungMakan] === undefined) {
          addNewsItem({ id: `mission-${currentStats.day}`, text: "SARAN: Populasi meningkat! Bangun Rumah Makan untuk layanan tambahan.", type: 'info' });
        } else {
          fetchNews();
        }
      } else {
        fetchNews();
      }

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted]);


  // --- Interaction Logic ---

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return; // Prevent clicking through start screen

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const tool = selectedTool; // Capture current tool
    const currentTile = currentGrid[y][x];

    // Identify origin for potential incident handling
    const originX = currentTile.isOrigin ? x : (currentTile.parentTile?.x ?? x);
    const originY = currentTile.isOrigin ? y : (currentTile.parentTile?.y ?? y);
    const originTile = currentGrid[originY][originX];

    // --- Incident Handling Logic ---
    if (originTile.status && originTile.status !== BuildingStatus.Normal) {
      if (originTile.status === BuildingStatus.Fire) {
        const fireFixCost = 50;
        if (currentStats.money >= fireFixCost) {
          setStats(prev => ({ ...prev, money: prev.money - fireFixCost }));
          setGrid(g => {
            const next = [...g];
            next[originY] = [...next[originY]];
            next[originY][originX] = { ...next[originY][originX], status: BuildingStatus.Normal };
            return next;
          });
          addNewsItem({ id: `fixed-${Date.now()}`, text: "Kebakaran dipadamkan! Aset kembali aman.", type: 'positive' });
        } else {
          addNewsItem({ id: `fix-fail-${Date.now()}`, text: "Dana darurat ($50) tidak cukup untuk pemadaman!", type: 'negative' });
        }
        return; // Consume click
      }

      if (originTile.status === BuildingStatus.Robbed) {
        const repairCost = Math.floor(BUILDINGS[originTile.buildingType].cost * 0.5);
        if (currentStats.money >= repairCost) {
           setStats(prev => ({ ...prev, money: prev.money - repairCost }));
           setGrid(g => {
            const next = [...g];
            next[originY] = [...next[originY]];
            next[originY][originX] = { ...next[originY][originX], status: BuildingStatus.Normal };
            return next;
           });
           addNewsItem({ id: `fixed-rob-${Date.now()}`, text: "Suntik dana berhasil! Operasional aset dilanjutkan.", type: 'positive' });
        } else {
           addNewsItem({ id: `rob-fail-${Date.now()}`, text: `Dana tidak cukup untuk pemulihan ($${repairCost}).`, type: 'negative' });
        }
        return; // Consume click
      }

      if (originTile.status === BuildingStatus.TheftCooldown) {
        addNewsItem({ id: `theft-wait-${Date.now()}`, text: "Investigasi polisi sedang berlangsung. Mohon tunggu.", type: 'neutral' });
        return;
      }
    }

    const buildingConfig = BUILDINGS[tool];

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const originX = currentTile.isOrigin ? x : (currentTile.parentTile?.x ?? x);
            const originY = currentTile.isOrigin ? y : (currentTile.parentTile?.y ?? y);
            const originTile = currentGrid[originY][originX];
            const type = originTile.buildingType;
            const config = BUILDINGS[type];
            const width = config.width || 1;
            const depth = config.depth || 1;

            const newGrid = currentGrid.map(row => [...row]);
            for (let dy = 0; dy < depth; dy++) {
              for (let dx = 0; dx < width; dx++) {
                const tx = originX + dx;
                const ty = originY + dy;
                if (tx < GRID_SIZE && ty < GRID_SIZE) {
                  newGrid[ty][tx] = { ...newGrid[ty][tx], buildingType: BuildingType.None, isOrigin: false, parentTile: undefined };
                }
              }
            }
            
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
        } else {
            addNewsItem({id: Date.now().toString(), text: "Dana tidak cukup untuk pembongkaran.", type: 'negative'});
        }
      }
      return;
    }

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      const width = buildingConfig.width || 1;
      const depth = buildingConfig.depth || 1;

      // Check if all tiles are available
      let canPlace = true;
      for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          // Allow placing on empty land or roads
          const currentBuilding = currentGrid[ty][tx].buildingType;
          if (tx >= GRID_SIZE || ty >= GRID_SIZE || (currentBuilding !== BuildingType.None && currentBuilding !== BuildingType.Road)) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace && currentStats.money >= buildingConfig.cost) {
        // Deduct cost
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        // Place building
        const newGrid = currentGrid.map(row => [...row]);
        for (let dy = 0; dy < depth; dy++) {
          for (let dx = 0; dx < width; dx++) {
            const isOrigin = dx === 0 && dy === 0;
            newGrid[y + dy][x + dx] = { 
              ...currentGrid[y+dy][x+dx], 
              buildingType: tool,
              isOrigin,
              parentTile: isOrigin ? undefined : { x, y }
            };
          }
        }
        setGrid(newGrid);
      } else if (!canPlace) {
          addNewsItem({id: Date.now().toString() + Math.random(), text: `Lahan tidak cukup untuk ${buildingConfig.name}.`, type: 'negative'});
      } else {
        // Not enough money feedback
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Kas kota tidak cukup untuk ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  }, [selectedTool, addNewsItem, gameStarted]);

  const handleStart = () => {
    setGameStarted(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-slate-950">
      {/* 3D Rendering Layer - Always visible now, providing background for start screen */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        gameStarted={gameStarted}
      />
      
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950"
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStarted && (
        <motion.div
          key="game-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-40 pointer-events-none"
        >
          <UIOverlay
            stats={stats}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            newsFeed={newsFeed}
          />
        </motion.div>
      )}

      {/* CSS for animations and utility */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        
        /* Vertical text for toolbar label */
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        
        /* Custom scrollbar for news */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

export default App;