import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SplitAction {
    label: string;
    href: string;
}

/**
 * Acción principal pegada a un caret que despliega las secundarias. Reemplaza a
 * la fila de links sueltos cuando un registro acumula demasiadas acciones.
 */
export function SplitButton({
    primary,
    actions,
}: {
    primary: SplitAction;
    actions: SplitAction[];
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-flex">
            <div className="glass inline-flex items-stretch overflow-hidden rounded-2xl">
                <Link
                    href={primary.href}
                    className="px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/70"
                >
                    {primary.label}
                </Link>
                <span className="w-px self-stretch bg-[rgba(26,24,48,0.12)]" />
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label="Más acciones"
                    className="cursor-pointer px-2.5 text-ink-50 transition-colors duration-200 hover:bg-white/70 hover:text-ink"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={cn(
                            'size-4 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>
            </div>

            {open && (
                <div
                    role="menu"
                    className="glass absolute top-full right-0 z-20 mt-1.5 flex w-44 flex-col rounded-2xl p-1.5"
                >
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors duration-200 hover:bg-white/70"
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
