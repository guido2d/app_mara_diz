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
        <select className={cn(fieldClass, 'appearance-none pr-9', className)} {...props}>
            {children}
        </select>
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
