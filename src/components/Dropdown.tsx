import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';

export interface Option {
  id: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onCreateOption?: (label: string) => Promise<void>;
  placeholder?: string;
  label?: string;
  name?: string;
  isCreatable?: boolean;
  className?: string;
  error?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  onCreateOption,
  placeholder = 'Select an option',
  label,
  name,
  isCreatable = false,
  className = '',
  error
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.id === value);

  const handleCreateOption = async () => {
    if (!onCreateOption || !searchTerm.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateOption(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating option:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <div className="sticky top-0 z-10 bg-white px-2 py-1.5">
              <input
                ref={inputRef}
                type="text"
                className="w-full border-0 bg-white p-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pt-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 ${
                    option.id === value ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span className={`block truncate ${option.id === value ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                  {option.id === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <Check className="h-4 w-4 text-blue-600" />
                    </span>
                  )}
                </div>
              ))}
              
              {isCreatable && searchTerm && !filteredOptions.length && (
                <div
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-blue-600 hover:bg-blue-50"
                  onClick={handleCreateOption}
                >
                  <span className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Creating...' : `Create "${searchTerm}"`}
                  </span>
                </div>
              )}

              {!filteredOptions.length && !searchTerm && (
                <div className="relative py-2 pl-3 pr-9 text-gray-500">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}