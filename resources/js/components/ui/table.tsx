import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react';

/** Glass-framed data table shell. */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('glass overflow-hidden rounded-[22px]', className)}>
            <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
    );
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={cn('border-b border-[rgba(26,24,48,0.1)] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-50 uppercase', className)}
            {...props}
        >
            {children}
        </th>
    );
}

export function Tr({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className={cn('border-b border-[rgba(26,24,48,0.07)] transition-colors duration-200 last:border-0 hover:bg-white/40', className)} {...props}>
            {children}
        </tr>
    );
}

export function Td({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={cn('px-4 py-3 align-middle text-ink', className)} {...props}>
            {children}
        </td>
    );
}

/** Small status pill used across admin tables. */
export function StatusPill({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                active ? 'bg-indigo/12 text-indigo' : 'bg-ink/6 text-ink-50',
            )}
        >
            <span className={cn('size-1.5 rounded-full', active ? 'bg-indigo' : 'bg-ink-50')} />
            {children}
        </span>
    );
}
