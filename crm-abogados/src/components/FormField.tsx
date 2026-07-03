'use client'

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseFieldProps {
  label: string
  error?: string
  hint?: string
}

interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {}
interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}
interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

function ErrorMsg({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-xs text-red-600 flex items-center gap-1 mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 flex-shrink-0">
        <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  )
}

export const FormField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, id, className = '', required, ...props }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          required={required}
          className={`input ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''} ${className}`}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-400 mt-1">{hint}</p>
        )}
        {error && <ErrorMsg id={errorId} message={error} />}
      </div>
    )
  }
)
FormField.displayName = 'FormField'

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, id, className = '', required, children, ...props }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
        <select
          ref={ref}
          id={fieldId}
          required={required}
          className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-400 mt-1">{hint}</p>
        )}
        {error && <ErrorMsg id={errorId} message={error} />}
      </div>
    )
  }
)
SelectField.displayName = 'SelectField'

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, id, className = '', required, ...props }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          className={`input resize-none ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-400 mt-1">{hint}</p>
        )}
        {error && <ErrorMsg id={errorId} message={error} />}
      </div>
    )
  }
)
TextareaField.displayName = 'TextareaField'
