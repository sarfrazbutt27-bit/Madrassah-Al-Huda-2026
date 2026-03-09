import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress: rawProgress, label, color = 'bg-emerald-500', size = 'md' }) => {
  const progress = isNaN(rawProgress) ? 0 : rawProgress;
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
          <span className="text-[10px] font-black text-madrassah-950 italic">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height} shadow-inner`}>
        <div 
          className={`${color} h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
