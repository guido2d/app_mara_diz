import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    /** Prefijo de URL que activa el estado resaltado. */
    match: string;
    /** Fuerza el estado activo; si se omite se calcula con `match`. */
    active?: boolean;
    /** Callback tras el click (p. ej. cerrar el menú mobile). */
    onNavigate?: () => void;
    className?: string;
    children: ReactNode;
}

export function NavLink({ href, match, active, onNavigate, className, children }: NavLinkProps) {
    const { url } = usePage();
    const isActive = active ?? url.startsWith(match);

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                isActive ? 'bg-indigo/12 text-ink' : 'text-ink-50 hover:text-ink',
                className,
            )}
        >
            {children}
        </Link>
    );
}
