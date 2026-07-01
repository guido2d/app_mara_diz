import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-indigo text-indigo-ink px-[22px] py-[11px] shadow-[0_8px_20px_-10px_rgba(61,58,138,0.7)] hover:brightness-110 active:translate-y-px',
    secondary: 'glass rounded-2xl text-ink px-[22px] py-[11px] hover:bg-white/70',
    outline: 'border border-[rgba(26,24,48,0.18)] text-ink px-[22px] py-[11px] hover:bg-white/50',
    ghost: 'text-ink-50 px-4 py-[10px] hover:bg-white/50 hover:text-ink',
    danger: 'text-danger px-3 py-2 hover:bg-danger/10',
};

/**
 * Class string for an Atelier Glass button. Use directly on Inertia `<Link>`
 * elements that should look like buttons.
 */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string): string {
    return cn(base, variants[variant], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
    return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
