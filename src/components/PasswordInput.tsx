'use client';

import { useState, type InputHTMLAttributes } from 'react';

const LabelClasses =
  'mb-2 block text-[0.625rem] font-medium uppercase tracking-[0.25em] text-brand-espresso/60';

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 5.42c.34-.06.68-.09 1.02-.09a9.5 9.5 0 0 1 8.71 5.56l-2.34 4.33c-.25-.4-2.07-3.76-2.07-3.76a9.5 9.5 0 0 0-4.32-2.04c-.34-.06-.68-.09-1.01-.09" />
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7Z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
}

export function PasswordInput({
  label,
  labelClassName,
  className,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={props.id}
          className={labelClassName ?? LabelClasses}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-brand-espresso/40 transition-colors hover:text-brand-espresso focus:text-brand-antiqueGold focus:outline-none"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
