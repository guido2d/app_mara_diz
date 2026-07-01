import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Shared control class so raw `<input>`s (uncontrolled Inertia forms) stay on-brand. */
export const fieldClass = 'field';

export function Label({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label className={cn('text-sm font-medium text-ink', className)} {...props}>
            {children}
        </label>
    );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select className={cn(fieldClass, 'w-full cursor-pointer appearance-none pr-10', className)} {...props}>
                {children}
            </select>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-50"
                aria-hidden="true"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </div>
    );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn(fieldClass, className)} {...props} />;
}

export function FieldError({ children }: { children?: ReactNode }) {
    if (!children) {
        return null;
    }

    return <p className="text-sm text-danger">{children}</p>;
}
