import React, { useRef, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';

const COLORS = [
  '#a78bfa', // Violet/Purple
  '#60a5fa', // Blue
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#94a3b8'  // Slate / Others
];

const CategoryStatsCard3D = ({ transactions = [] }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [selectedType, setSelectedType] = useState('expense'); // 'expense' | 'income'
  const [showDropdown, setShowDropdown] = useState(false);

  // 3D tilt effect on mouse move
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  // Group and sum transactions by category
  const { categoryData, totalAmount } = useMemo(() => {
    const filtered = transactions.filter(t => t.type === selectedType);
    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    const categoriesMap = {};
    filtered.forEach(t => {
      const cat = t.category || 'Others';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    let categoryData = [];
    if (sortedCategories.length > 4) {
      categoryData = sortedCategories.slice(0, 3);
      const othersValue = sortedCategories.slice(3).reduce((sum, item) => sum + item.value, 0);
      categoryData.push({ name: 'Others', value: othersValue });
    } else {
      categoryData = sortedCategories;
    }

    return { categoryData, totalAmount };
  }, [transactions, selectedType]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percent = totalAmount > 0 ? ((payload[0].value / totalAmount) * 100).toFixed(0) : 0;
      return (
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs">
          <p className="text-white/70 font-semibold">{payload[0].name}</p>
          <p className="text-white font-bold">
            ₹{payload[0].value.toLocaleString()} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };  return (
    <div
      className="perspective-[1000px] w-full h-full flex"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className="relative w-full h-full min-h-[300px] md:min-h-[320px] rounded-2xl overflow-hidden transition-transform duration-200 ease-out will-change-transform flex flex-col justify-between"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.015 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl" />
        
        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl border border-white/10" />

        {/* Content wrapper */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col h-full justify-between flex-grow">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-300/80">
              Statistics
            </h3>
            
            <div className="flex gap-2 items-center relative">
              <button 
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-[10px] font-bold text-white/90 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/25 transition-all cursor-pointer select-none"
              >
                <span className="capitalize">{selectedType}</span>
                <ChevronDown size={11} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-7 w-24 bg-[#16213e] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 py-1">
                  <button 
                    type="button"
                    onClick={() => { setSelectedType('expense'); setShowDropdown(false); }}
                    className={`w-full text-left text-xs px-3 py-1.5 text-white/80 hover:bg-white/10 transition-colors ${selectedType === 'expense' ? 'font-bold text-purple-300' : ''}`}
                  >
                    Expense
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setSelectedType('income'); setShowDropdown(false); }}
                    className={`w-full text-left text-xs px-3 py-1.5 text-white/80 hover:bg-white/10 transition-colors ${selectedType === 'income' ? 'font-bold text-purple-300' : ''}`}
                  >
                    Income
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle comment */}
          <p className="text-[10px] text-white/55 mb-3">
            {totalAmount > 0 
              ? `You have dynamic transactions in multiple categories.`
              : `No transactions recorded for ${selectedType}s.`
            }
          </p>

          {/* Chart & Legend Row */}
          <div className="flex flex-row items-center gap-5 flex-1 min-h-0 mt-1">
            {/* Center Donut Chart */}
            <div className="relative w-[40%] aspect-square shrink-0 flex items-center justify-center">
              {totalAmount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={44}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-20 h-20 rounded-full border-8 border-white/5 flex items-center justify-center" />
              )}

              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
                <span className="text-[7.5px] uppercase tracking-wider text-white/40 leading-none">
                  {selectedType === 'expense' ? 'Expenses' : 'Income'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white mt-0.5 truncate max-w-[75px] px-0.5 leading-none">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex-1 flex flex-col justify-center space-y-2.5 overflow-y-auto pr-1 pl-4 border-l border-white/5 h-full">
              {categoryData.length > 0 ? (
                categoryData.map((item, index) => {
                  const percent = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(0) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="text-white/80 font-medium truncate capitalize">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-white/40 tabular-nums shrink-0 ml-1">
                        {percent}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-white/35 text-center italic py-2">No categories found</p>
              )}
            </div>
          </div>

        </div>

        {/* Shine effect on hover */}
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${50 + rotation.y * 2}% ${50 + rotation.x * 2}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            }}
          />
        )}

      </div>
    </div>
  );
};

export default CategoryStatsCard3D;
