import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PublicShellProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

/** Full-height lavender canvas for the public-facing pages. */
export function PublicShell({ title, children, className }: PublicShellProps) {
    return (
        <>
            {title && <Head title={title} />}
            <main
                className={cn(
                    'relative flex min-h-screen w-full flex-col items-center px-4 py-10 sm:py-16',
                    className,
                )}
            >
                {children}
            </main>
        </>
    );
}
