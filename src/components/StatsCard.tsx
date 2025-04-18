import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <h3 className="text-2xl font-bold mt-1 truncate" title={value.toString()}>
            {value}
          </h3>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon size={24} className="text-blue-600" />
        </div>
      </div>
    </div>
  );
}