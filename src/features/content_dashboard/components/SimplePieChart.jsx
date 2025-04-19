import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SimplePieChart = ({ data, title, centerText, centerLabel }) => (
  <div className="flex flex-col items-center w-1/3">
    <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
    <ResponsiveContainer width="100%" height={120}> {/* Adjust height */} 
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={30} // Smaller radius for smaller charts
          outerRadius={45}
          fill="#8884d8"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2328', border: '1px solid #374151', borderRadius: '4px' }}
          itemStyle={{ color: '#d1d5db' }}
          formatter={(value) => `${value}`}
        />
        {/* Center Text */}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="16px" fontWeight="bold">
          {centerText}
        </text>
        <text x="50%" y="50%" dy={15} textAnchor="middle" fill="#9ca3af" fontSize="10px">
          {centerLabel}
        </text>
      </PieChart>
    </ResponsiveContainer>
    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
  </div>
);

export default SimplePieChart;