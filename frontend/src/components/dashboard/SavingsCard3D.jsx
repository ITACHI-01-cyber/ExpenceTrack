import React, { useRef, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const SavingsCard3D = ({ goals = [] }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // 3D tilt effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  // Calculate stats from goals
  const { totalTarget, completedAmount, pendingAmount, completedCount, totalCount, completionRate, pieData } = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + (g.amount || 0), 0);
    const completedGoals = goals.filter(g => g.completed);
    const pendingGoals = goals.filter(g => !g.completed);
    const completedAmount = completedGoals.reduce((sum, g) => sum + (g.amount || 0), 0);
    const pendingAmount = pendingGoals.reduce((sum, g) => sum + (g.amount || 0), 0);
    const completedCount = completedGoals.length;
    const totalCount = goals.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const pieData = [
      { name: 'Completed', value: completedAmount || 1 },
      { name: 'Pending', value: pendingAmount || 1 },
    ];

    return { totalTarget, completedAmount, pendingAmount, completedCount, totalCount, completionRate, pieData };
  }, [goals]);

  const COLORS = ['#34d399', '#6366f1'];

  return (
    <div
      className="perspective-[1000px] w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className="relative w-full rounded-2xl overflow-hidden transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background - deep emerald/teal gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-2xl" />

        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-2xl border border-white/10" />

        {/* Sparkles */}
        <div className="absolute top-5 right-6 w-1 h-1 bg-emerald-300/60 rounded-full animate-pulse" />
        <div className="absolute top-10 right-14 w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-16 right-8 w-0.5 h-0.5 bg-emerald-200/30 rounded-full animate-pulse delay-500" />
        <div className="absolute top-16 left-6 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse delay-700" />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
              Savings
            </p>
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <Target size={12} className="text-emerald-300" />
              <span className="text-[10px] font-bold text-white/80">{completedCount}/{totalCount}</span>
            </div>
          </div>

          {/* Big number */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums tracking-tight mb-0.5">
            {formatCurrency(totalTarget)}
          </h2>

          {/* Completion rate */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              <TrendingUp size={14} />
              {completionRate}% achieved
            </span>
          </div>

          {/* Chart + Stats row */}
          <div className="flex items-center gap-4">
            {/* Mini donut chart */}
            <div className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} opacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Completed</p>
                  <p className="text-sm font-bold text-white tabular-nums truncate">{formatCurrency(completedAmount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Pending</p>
                  <p className="text-sm font-bold text-white tabular-nums truncate">{formatCurrency(pendingAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shine effect on hover */}
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${50 + rotation.y * 2}% ${50 + rotation.x * 2}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SavingsCard3D;
