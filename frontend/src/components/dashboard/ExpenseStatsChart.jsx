import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ExpenseStatsChart = ({ data }) => {
  return (
    <div className="bg-white rounded-card shadow-sm border border-border p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-neutral-text text-lg">Expenses Statistics</h3>
        <select className="text-sm bg-transparent border-none text-neutral-muted focus:ring-0 cursor-pointer outline-none">
          <option>Day</option>
          <option>Week</option>
          <option>Month</option>
        </select>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C5CBF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7C5CBF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value === 0 ? '0' : `${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 24px rgba(124, 92, 191, 0.1)' }}
              itemStyle={{ color: '#7C5CBF', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#7C5CBF" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseStatsChart;
