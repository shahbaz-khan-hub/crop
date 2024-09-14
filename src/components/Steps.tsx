import React from 'react';
import clsx from 'clsx';

interface StepsProps {
  current: number;
  steps: string[];
  onChange?: (step: number) => void;
}

export const Steps: React.FC<StepsProps> = ({ current, steps, onChange }) => {
  return (
    <ul className="grid grid-cols-3 gap-0 p-0 relative">
    {steps.map((step, i) => (
      <li
        key={i}
        className={clsx(
          "cursor-pointer text-center text-white mt-3 py-4 px-4 relative",
          { "text-primary": current === i }
        )}
        onClick={() => {
          onChange?.(i);
        }}
      >
        <span
          className={clsx(
            "block pt-8", // Added padding-top to text
            current === i ? "text-primary" : "text-white"
          )}
        >
          {step}
        </span>
        <span
          className={clsx(
            "absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 flex justify-center items-center border rounded-full",
            current === i
              ? "bg-primary text-black border-primary"
              : "bg-transparent text-primary-foreground border-white"
          )}
          aria-hidden="true"
        >
          {i + 1}
        </span>
      </li>
    ))}
    
  </ul>
  
  
  

  );
};