import React from 'react';
import type { TypeOption, RuleOption } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: readonly TypeOption[] | readonly RuleOption[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  helpText,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        className={`
          w-full px-3 py-2 border rounded-lg text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors
          ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-blue-200 focus:ring-blue-500 focus:border-blue-500'
          }
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
} 