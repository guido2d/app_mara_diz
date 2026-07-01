import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/** Frosted glass card — the primary content surface in Atelier Glass. */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('glass rounded-[22px] p-6 sm:p-7', className)} {...props} />;
}
