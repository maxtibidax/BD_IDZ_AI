import React from 'react';
import { X } from 'lucide-react';

// --- Modal ---
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-slate-100 text-slate-600';
  const s = status.toLowerCase();
  
  if (s.includes('выполнен') || s.includes('success')) colorClass = 'bg-green-100 text-green-700 border border-green-200';
  else if (s.includes('отменен') || s.includes('error')) colorClass = 'bg-red-100 text-red-700 border border-red-200';
  else if (s.includes('процессе') || s.includes('обработке')) colorClass = 'bg-blue-100 text-blue-700 border border-blue-200';
  else if (s.includes('на сегодня')) colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
      {status}
    </span>
  );
};

// --- Button ---
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = 
  ({ className = '', variant = 'primary', ...props }) => {
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600'
  };

  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props} 
    />
  );
};

// --- Input Field ---
export const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    {children}
  </div>
);

// --- Table ---
interface TableProps<T> {
  data: T[];
  columns: { header: string; accessor: keyof T | ((item: T) => React.ReactNode); width?: string }[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

// Fixed: Removed generic constraint `extends { id?: number | string }` to allow inference of types like OrderWithDetails and Client.
export function Table<T>({ data, columns, onRowClick, isLoading }: TableProps<T>) {
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col.width || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr><td colSpan={columns.length} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : paginatedData.length === 0 ? (
               <tr><td colSpan={columns.length} className="p-8 text-center text-slate-400">Нет данных</td></tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors hover:bg-blue-50/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="p-4 text-sm text-slate-700 group-hover:text-slate-900">
                      {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
        <span className="text-xs text-slate-500">
          Показано {Math.min((page - 1) * itemsPerPage + 1, data.length)} - {Math.min(page * itemsPerPage, data.length)} из {data.length}
        </span>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            className="px-2 py-1 text-xs" 
            disabled={page === 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <Button 
            variant="secondary" 
            className="px-2 py-1 text-xs" 
            disabled={page === totalPages || totalPages === 0} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Вперед
          </Button>
        </div>
      </div>
    </div>
  );
}