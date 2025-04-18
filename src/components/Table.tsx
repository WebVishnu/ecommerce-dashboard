import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  actions?: (item: T) => React.ReactNode;
  pagination: PaginationState;
  onPaginationChange: (page: number, pageSize: number) => void;
}

const itemsPerPageOptions = [5, 10, 25, 50, 100];

export default function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  isLoading,
  actions,
  pagination,
  onPaginationChange
}: TableProps<T>) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');

  useEffect(() => {
    if (localSearchValue === '' && onSearchChange) {
      onSearchChange('');
    }
  }, [localSearchValue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;

  const handlePageChange = (page: number) => {
    onPaginationChange(page, pagination.pageSize);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value);
    onPaginationChange(1, newPageSize);
  };

  const handleSearch = () => {
    if (onSearchChange) {
      onSearchChange(localSearchValue);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          {onSearchChange && (
            <div className="flex-1 flex gap-2">
              <div className="flex-1 flex items-center px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search..."}
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="ml-2 flex-1 outline-none bg-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Search
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
              Show
            </label>
            <select
              id="itemsPerPage"
              value={pagination.pageSize}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md shadow-sm py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor] || '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + data.length, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}