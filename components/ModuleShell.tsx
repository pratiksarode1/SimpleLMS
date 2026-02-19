import React from 'react';
import { ModuleConfig } from '../types';
import { Construction } from 'lucide-react';

interface ModuleShellProps {
  module: ModuleConfig;
}

const ModuleShell: React.FC<ModuleShellProps> = ({ module }) => {
  const Icon = module.icon;

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* Module Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-white shadow-sm border border-slate-100 ${module.color}`}>
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{module.label}</h1>
            <p className="text-slate-500">{module.description}</p>
          </div>
        </div>
      </div>

      {/* Module Content Placeholder */}
      <div className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-12">
        <Construction size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-slate-600">Module Under Construction</h3>
        <p className="max-w-md text-center mt-2">
          The <strong>{module.label}</strong> module is currently being built. 
          Check back soon for the full implementation of {module.description.toLowerCase()}
        </p>
        <button className="mt-6 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm">
          Initialize Module
        </button>
      </div>
    </div>
  );
};

export default ModuleShell;