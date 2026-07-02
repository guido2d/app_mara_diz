import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react';

/**
 * Glass-framed data table shell. Hidden on mobile by default so a matching
 * `CardList` can take over; pass `alwaysVisible` to keep it on every breakpoint.
 */
export function DataTable({
    children,
    className,
    alwaysVisible = false,
}: {
    children: ReactNode;
    className?: string;
    alwaysVisible?: boolean;
}) {
    return (
        <div className={cn('glass overflow-hidden rounded-[22px]', !alwaysVisible && 'hidden md:block', className)}>
            <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
    );
}

/** Mobile-only stack of cards that replaces a `DataTable` on small screens. */
export function CardList({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex flex-col gap-3 md:hidden', className)}>{children}</div>;
}

/** A single record rendered as a glass card on mobile. */
export function RecordCard({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('glass rounded-[22px] p-4', className)}>{children}</div>;
}

/** Label / value row inside a `RecordCard`. */
export function CardField({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-start justify-between gap-3 py-1', className)}>
            <span className="shrink-0 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-50 uppercase">
                {label}
            </span>
            <span className="min-w-0 text-right text-sm text-ink [overflow-wrap:anywhere]">{children}</span>
        </div>
    );
}

/** Divider-separated footer holding a record's inline actions on a card. */
export function CardActions({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[rgba(26,24,48,0.08)] pt-3 text-sm font-medium',
                className,
            )}
        >
            {children}
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
