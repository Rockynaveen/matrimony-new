import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Badge } from './Badge';
import { Label } from './Label';
import { Checkbox } from './Checkbox';
import { Search, ChevronDown, X } from 'lucide-react';

// Reusable Required Toggle Component
export interface RequiredToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}

export const RequiredToggle: React.FC<RequiredToggleProps> = ({ checked, onChange, label = 'Required' }) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className="inline-flex items-center gap-2 cursor-pointer select-none"
  >
    <div
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[3px] ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </div>
    <span className="text-xs sm:text-sm font-semibold text-rose-600 tracking-tight">
      {label}
    </span>
  </div>
);

// Reusable Searchable Multi-Select Component using Shadcn UI Dropdown & Checkbox
export interface SearchableMultiSelectItem {
  id: number;
  name: string;
  extra?: string | null;
}

export interface SearchableMultiSelectProps {
  label: string;
  placeholder: string;
  items: SearchableMultiSelectItem[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  isRequired?: boolean;
  onRequiredChange?: (val: boolean) => void;
  levelBadge?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  isRequired,
  onRequiredChange,
  levelBadge,
  disabled = false,
  disabledPlaceholder
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      item => item.name.toLowerCase().includes(lower) || (item.extra && item.extra.toLowerCase().includes(lower))
    );
  }, [items, query]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const toggleItem = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(itemId => itemId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(itemId => itemId !== id));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredItems.map(i => i.id);
    const newSelected = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs sm:text-sm font-bold text-slate-900">{label}</Label>
          {levelBadge && (
            <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
              {levelBadge}
            </Badge>
          )}
        </div>
        {onRequiredChange !== undefined && (
          <RequiredToggle checked={Boolean(isRequired)} onChange={onRequiredChange} />
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          {selectedItems.map(item => (
            <Badge
              key={item.id}
              variant="outline"
              className="pl-2.5 pr-1.5 py-1 bg-white text-slate-800 border-slate-200 flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={e => removeItem(item.id, e)}
                className="h-3.5 w-3.5 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline self-center px-1.5 cursor-pointer ml-auto"
          >
            Clear all ({selectedItems.length})
          </button>
        </div>
      )}

      {/* Search & Trigger Box */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          className={`flex items-center gap-2 w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white transition-all cursor-pointer select-none ${
            disabled
              ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed'
              : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onClick={e => e.stopPropagation()}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={disabled ? disabledPlaceholder || placeholder : selectedItems.length > 0 ? `${selectedItems.length} selected — click to add more...` : placeholder}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
          />
          {selectedItems.length > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              {selectedItems.length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>

        {/* Dropdown Options with Shadcn Checkbox */}
        {isOpen && !disabled && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-slate-500 border-b border-slate-100 mb-1">
              <span>{filteredItems.length} options</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                {selectedIds.length > 0 && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {items.length === 0 ? 'No options available' : 'No matching results'}
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50 text-blue-950 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="peer-checked:bg-blue-600 peer-checked:border-blue-600"
                    />
                    <span className="flex-1">
                      {item.name}
                      {item.extra && (
                        <span className="text-[11px] text-slate-400 font-normal ml-1.5">
                          ({item.extra})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable String Multi-Select Component using Shadcn UI Dropdown & Checkbox
export interface StringMultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isRequired?: boolean;
  onRequiredChange?: (val: boolean) => void;
}

export const StringMultiSelectDropdown: React.FC<StringMultiSelectDropdownProps> = ({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  isRequired,
  onRequiredChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== val));
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs sm:text-sm font-bold text-slate-900">{label}</Label>
        {onRequiredChange !== undefined && (
          <RequiredToggle checked={Boolean(isRequired)} onChange={onRequiredChange} />
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          {selectedValues.map(val => (
            <Badge
              key={val}
              variant="outline"
              className="pl-2.5 pr-1.5 py-1 bg-white text-slate-800 border-slate-200 flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <span>{val}</span>
              <button
                type="button"
                onClick={e => removeValue(val, e)}
                className="h-3.5 w-3.5 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline self-center px-1.5 cursor-pointer ml-auto"
          >
            Clear all ({selectedValues.length})
          </button>
        </div>
      )}

      {/* Trigger Box */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center justify-between w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white transition-all cursor-pointer select-none ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`truncate ${selectedValues.length === 0 ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
            {selectedValues.length > 0 ? selectedValues.join(', ') : placeholder}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {selectedValues.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                {selectedValues.length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </div>
        </div>

        {/* Dropdown Options with Shadcn Checkbox */}
        {isOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-slate-500 border-b border-slate-100 mb-1">
              <span>{options.length} options</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                {selectedValues.length > 0 && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {options.map(opt => {
              const isSelected = selectedValues.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleValue(opt)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50 text-blue-950 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleValue(opt)}
                    className="peer-checked:bg-blue-600 peer-checked:border-blue-600"
                  />
                  <span className="flex-1">{opt}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
