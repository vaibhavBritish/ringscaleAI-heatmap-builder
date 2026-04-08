'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function OptimizationScore({ score }) {
  const data = [
    { name: 'Completed', value: score },
    { name: 'Remaining', value: 100 - score },
  ]

  const COLORS = ['#22c55e', '#f1f5f9'] // Green-500, Slate-100

  return (
    <div className="relative w-full h-[250px] sm:h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={110}
            startAngle={90}
            endAngle={450}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-5xl font-black text-green-500">{score}%</span>
        <span className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">Optimization Score</span>
      </div>
    </div>
  )
}
