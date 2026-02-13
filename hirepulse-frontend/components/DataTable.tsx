import React from 'react';
import { Eye, Edit, Trash } from 'lucide-react';

export interface Column<T> {
  key: keyof T | 'actions';
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  sticky?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onAction?: (action: string, item: T) => void;
  isLoading?: boolean;
}

export const DataTable = <T extends { id: string }>({ data, columns, onAction, isLoading }: DataTableProps<T>) => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollLeft > 0);
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-[2rem] border border-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Artifacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div 
        className="overflow-x-auto custom-scrollbar"
        onScroll={handleScroll}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  className={`
                    py-3 md:py-4 px-3 md:px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap
                    ${col.sticky ? 'sticky left-0 z-10 bg-slate-50' : ''}
                    ${col.sticky && isScrolled ? 'shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]' : ''}
                  `}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx}
                    className={`
                      py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-slate-700 whitespace-nowrap
                      ${col.sticky ? 'sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 transition-colors' : ''}
                      ${col.sticky && isScrolled ? 'shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]' : ''}
                    `}
                  >
                    {col.key === 'actions' ? (
                      <div className="flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onAction && onAction('view', row)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onAction && onAction('edit', row)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    ) : col.render ? (
                      col.render(row, rowIdx)
                    ) : (
                      (row as any)[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.length && (
        <div className="px-4 md:px-6 py-10 text-center text-slate-400 text-sm font-medium">
          No records found.
        </div>
      )}
    </div>
  );
};
