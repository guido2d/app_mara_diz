import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SplitAction {
    label: string;
    href: string;
}

/** Ancho del panel desplegable, en px (coincide con `w-44`). */
const MENU_WIDTH = 176;
/** Alto aproximado de cada ítem, para decidir si el panel abre hacia arriba. */
const ITEM_HEIGHT = 40;
const MENU_PADDING = 12;

interface MenuPosition {
    top: number;
    left: number;
}

/**
 * Acción principal pegada a un caret que despliega las secundarias. Reemplaza a
 * la fila de links sueltos cuando un registro acumula demasiadas acciones.
 *
 * El panel se renderiza en un portal sobre `document.body` con posición fija:
 * dentro del flujo normal quedaba recortado por el `overflow-hidden` que
 * `DataTable` usa para redondear sus esquinas.
 */
export function SplitButton({
    primary,
    actions,
}: {
    primary: SplitAction;
    actions: SplitAction[];
}) {
    const [position, setPosition] = useState<MenuPosition | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const open = position !== null;

    const toggle = () => {
        if (open) {
            setPosition(null);

            return;
        }

        const trigger = triggerRef.current?.getBoundingClientRect();

        if (!trigger) {
            return;
        }

        const menuHeight = actions.length * ITEM_HEIGHT + MENU_PADDING;
        const fitsBelow = trigger.bottom + menuHeight + 8 <= window.innerHeight;

        setPosition({
            top: fitsBelow ? trigger.bottom + 6 : trigger.top - menuHeight - 6,
            left: Math.max(8, trigger.right - MENU_WIDTH),
        });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const close = () => setPosition(null);

        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                triggerRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            close();
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        // El panel está posicionado contra la ventana: si la página se mueve
        // debajo, cerrarlo es preferible a dejarlo flotando desalineado.
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    return (
        <div ref={triggerRef} className="inline-flex">
            <div className="inline-flex items-stretch overflow-hidden rounded-2xl border border-[rgba(26,24,48,0.18)] bg-ink/10">
                <Link
                    href={primary.href}
                    className="px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/70"
                >
                    {primary.label}
                </Link>
                <span className="w-px self-stretch bg-[rgba(26,24,48,0.18)]" />
                <button
                    type="button"
                    onClick={toggle}
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

            {position !== null &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{
                            position: 'fixed',
                            top: position.top,
                            left: position.left,
                            width: MENU_WIDTH,
                        }}
                        className="z-50 flex flex-col rounded-2xl border border-[rgba(26,24,48,0.12)] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(26,24,48,0.35)]"
                    >
                        {actions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                role="menuitem"
                                onClick={() => setPosition(null)}
                                className="rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors duration-200 hover:bg-lift"
                            >
                                {action.label}
                            </Link>
                        ))}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
