'use client';

import React, { useState } from 'react';
import { 
  Building2, MapPin, Search, BarChart3, 
  Layers, ZoomIn, ZoomOut, ChevronDown, 
  Plus, Target, Info, Zap
} from 'lucide-react';

const VisualDashboard = () => {
  const [view, setView] = useState('before'); // 'before' or 'after'
  
  // Mock data for the grid
  const gridRows = 13;
  const gridCols = 13;
  
  // Logic to simulate rankings from the images
  const getRankColor = (rank) => {
    if (rank === 'X') return 'bg-slate-400 text-white opacity-40';
    const r = parseInt(rank);
    if (r <= 3) return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30';
    if (r <= 7) return 'bg-yellow-400 text-white shadow-lg shadow-yellow-500/30';
    if (r <= 15) return 'bg-orange-500 text-white shadow-lg shadow-orange-500/30';
    return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
  };

  // Simulate the specific pattern from the images
  const getRank = (row, col) => {
    const dist = Math.sqrt(Math.pow(row - 6, 2) + Math.pow(col - 6, 2));
    
    if (view === 'after') {
      // Deterministic "randomness" based on position to avoid hydration errors
      const hash = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
      const pseudoRandom = hash - Math.floor(hash);
      
      if (dist < 8) return (pseudoRandom > 0.9 ? (Math.floor(pseudoRandom * 2) + 5).toString() : (Math.floor(pseudoRandom * 2) + 1).toString());
      return '2';
    } else {
      // Mostly orange/red
      if (dist < 1.5) return '1';
      if (dist < 3) return '3';
      if (dist < 5) return '10';
      if (dist < 7) return '15';
      if (row < 2 || col < 2) return 'X';
      return '20';
    }
  };

  const stats = view === 'after' ? {
    visibility: '94%',
    avgRank: '2.2',
    distribution: [
      { label: 'Top 3', val: '214 pins', color: 'bg-emerald-500' },
      { label: 'Top 10', val: '225 pins', color: 'bg-yellow-400' },
      { label: 'Top 20', val: '226 pins', color: 'bg-orange-500' },
      { label: '20+', val: '0 pins', color: 'bg-slate-300' },
    ]
  } : {
    visibility: '32%',
    avgRank: '11.9',
    distribution: [
      { label: 'Top 3', val: '9 pins', color: 'bg-emerald-500' },
      { label: 'Top 10', val: '45 pins', color: 'bg-yellow-400' },
      { label: 'Top 20', val: '155 pins', color: 'bg-orange-500' },
      { label: '20+', val: '69 pins', color: 'bg-slate-300' },
    ]
  };

  return (
    <div 
      className="w-full flex flex-col lg:flex-row bg-[#f8fafc] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 min-h-[600px] animate-in fade-in zoom-in duration-700 relative"
      suppressHydrationWarning={true}
    >
      
      {/* Before/After Toggle Floating UI */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 lg:left-[calc(320px+50%)] lg:-translate-x-1/2 z-30 flex p-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-xl transition-all">
        <button 
          onClick={() => setView('before')}
          className={`px-6 py-2 rounded-full text-xs font-black transition-all ${view === 'before' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Before
        </button>
        <button 
          onClick={() => setView('after')}
          className={`px-6 py-2 rounded-full text-xs font-black transition-all ${view === 'after' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
        >
          After Result
        </button>
      </div>

      {/* Sidebar - Scan Result Viewer */}
      <div className="w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl overflow-y-auto max-h-[600px] lg:max-h-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">Scan Result Viewer</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Target Business */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Business</span>
            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Uniconnect Immigration Services</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> 1470 Hurontario St #100
                </p>
              </div>
            </div>
          </div>

          {/* Keywords Scanned */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keywords Scanned</span>
            <div className="relative group">
              <input 
                type="text" 
                readOnly 
                value={view === 'after' ? "immigration services near me" : "immigration near me"} 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Scan Analytics */}
          <div className="space-y-2.5">
             <div className="flex items-center gap-2 mb-2">
               <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
               <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Scan Analytics</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-blue-50/30 p-3 rounded-2xl border border-blue-100/30">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Visibility</p>
                 <p className={`text-xl font-black tracking-tight transition-all duration-500 ${view === 'after' ? 'text-emerald-600' : 'text-blue-600'}`}>
                   {stats.visibility}
                 </p>
               </div>
               <div className="bg-purple-50/30 p-3 rounded-2xl border border-purple-100/30">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg. Rank</p>
                 <p className={`text-xl font-black tracking-tight transition-all duration-500 ${view === 'after' ? 'text-emerald-600' : 'text-purple-600'}`}>
                   {stats.avgRank}
                 </p>
               </div>
             </div>
          </div>

          {/* Rank Distribution */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rank Distribution</span>
            <div className="space-y-3 pt-1">
              {stats.distribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color} group-hover:scale-125 transition-transform`} />
                    <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 transition-all duration-500">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Insights */}
          <div className="pt-4">
            <div className="bg-slate-900 rounded-[2rem] p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Search Insights</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/60 font-medium">Best Rank</span>
                    <span className="text-emerald-400 font-black">#1</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/60 font-medium">Total Points</span>
                    <span className="text-white font-black">225</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/60 font-medium">Radius</span>
                    <span className="text-white font-black">3.0 mi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Geo-Grid Heatmap */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* Real Interactive Map Background */}
        <div className="absolute inset-0 pointer-events-none">
          <iframe
            title="Real Map Background"
            src="https://maps.google.com/maps?q=1470+Hurontario+St,+Mississauga,+Ontario+L5G+3H4&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(0.5) contrast(1.1) opacity(0.6)' }}
            allowFullScreen
          ></iframe>
        </div>

        {/* Map Overlay Blur */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        
        {/* Heatmap Grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 lg:p-8">
          <div 
            className="grid gap-1 animate-in fade-in zoom-in duration-1000 delay-300"
            style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
          >
            {Array.from({ length: gridRows * gridCols }).map((_, i) => {
              const row = Math.floor(i / gridCols);
              const col = i % gridCols;
              const rank = getRank(row, col);
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-black pointer-events-auto cursor-pointer hover:scale-[1.7] hover:z-50 hover:shadow-2xl transition-all duration-300 ${getRankColor(rank)}`}
                >
                  {rank}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map UI Elements */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors">
            <Layers className="w-5 h-5 text-slate-800" />
          </button>
          <div className="flex flex-col bg-white shadow-xl rounded-xl overflow-hidden divide-y divide-slate-100">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ZoomIn className="w-5 h-5 text-slate-800" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ZoomOut className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Floating Center Indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1.5px] border-blue-500/30 rounded-full animate-ping-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl z-5 border-4 border-white pointer-events-none">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
        </div>

        {/* Map Attribution Placeholder */}
        <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[8px] font-bold text-slate-500 shadow-sm border border-slate-100">
          Google
        </div>
      </div>

    </div>
  );
};

export default VisualDashboard;
