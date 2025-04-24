import React, { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  checked?: boolean;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, id, checked = false, disabled = false, ...props }) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          className="sr-only" /* Invisible mais accessible */
          {...props}
        />
        <div 
          className={`w-6 h-6 flex items-center justify-center rounded ${checked ? 'bg-indigo-600' : 'bg-white dark:bg-gray-700'} border-2 ${checked ? 'border-indigo-600' : 'border-gray-300 dark:border-gray-600'} cursor-pointer`}
          onClick={!disabled ? () => {
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) {
              input.click();
            }
          } : undefined}
        >
          {checked && (
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5}
                d="M5 13l4 4L19 7" 
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkbox;
