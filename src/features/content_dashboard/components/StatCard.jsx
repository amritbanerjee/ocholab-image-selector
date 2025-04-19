import React from 'react';
import { Card, CardContent } from '../../../components/ui/card'; // Adjusted import path
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

const StatCard = ({ title, value, change, changeType, icon }) => (
  <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg overflow-hidden">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
         <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg">
           {icon}
         </div>
         <div>
           <p className="text-3xl font-bold">{value}</p>
           <p className="text-sm text-gray-400">{title}</p>
         </div>
      </div>
      {change && (
        <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${changeType === 'loss' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {changeType === 'loss' ? <FiTrendingDown className="mr-1" /> : <FiTrendingUp className="mr-1" />}
          {change}
        </span>
      )}
    </CardContent>
  </Card>
);

export default StatCard;