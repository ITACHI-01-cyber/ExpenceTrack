import React, { useRef, useState, useMemo } from 'react';
import { BarChart, Bar, Line, XAxis, ResponsiveContainer, ComposedChart, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const TransactionStatsCard3D = ({ transactions = [] }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // 3D tilt effect on mouse move
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

  // Build monthly data from transactions
  const { chartData, totalExpenses, changeAmount, changePercent } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        value: 0,
      });
    }

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const txDate = new Date(tx.date);
        const entry = months.find(
          (m) => m.monthNum === txDate.getMonth() && m.yearNum === txDate.getFullYear()
        );
        if (entry) entry.value += tx.amount;
      }
    });

    // Add trend line (cumulative-ish for visual)
    let running = 0;
    const chartData = months.map((m) => {
      running += m.value;
      return { ...m, trend: running };
    });

    const totalExpenses = months.reduce((s, m) => s + m.value, 0);
    const currentMonth = months[months.length - 1]?.value || 0;
    const prevMonth = months[months.length - 2]?.value || 0;
    const changeAmount = currentMonth - prevMonth;
    const changePercent = prevMonth > 0 ? ((changeAmount / prevMonth) * 100) : 0;

    return { chartData, totalExpenses, changeAmount, changePercent };
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs">
          <p className="text-white/70">{payload[0].payload.month}</p>
          <p className="text-white font-bold">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
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
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl" />
        
        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-2xl border border-white/10" />
        
        {/* Stars / sparkles */}
        <div className="absolute top-6 right-8 w-1 h-1 bg-white/60 rounded-full animate-pulse" />
        <div className="absolute top-12 right-16 w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse delay-300" />
        <div className="absolute top-8 right-24 w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-20 right-6 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-500" />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full flex-1">
          <div>
            {/* Label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-300/80 mb-2">
              Expenses
            </p>

            {/* Big number */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums tracking-tight mb-1">
              ₹{totalExpenses.toLocaleString()}
            </h2>

            {/* Change */}
            <div className="flex items-center gap-1.5 mb-4">
              {changeAmount !== 0 && (
                <>
                  <span className={`text-sm font-medium ${changeAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {changeAmount > 0 ? '+' : ''}₹{Math.abs(changeAmount).toLocaleString()}
                  </span>
                  <span className={`text-xs flex items-center gap-0.5 ${changeAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                    {changeAmount > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  </span>
                </>
              )}
              {changeAmount === 0 && (
                <span className="text-sm text-white/50">No change from last month</span>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[100px] sm:h-[120px] w-full -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  dy={5}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="value"
                  fill="rgba(255,255,255,0.15)"
                  radius={[3, 3, 0, 0]}
                  animationDuration={1000}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1200}
                />
              </ComposedChart>
            </ResponsiveContainer>
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

export default TransactionStatsCard3D;
