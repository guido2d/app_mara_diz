import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buttonClass } from './button';

interface ConfirmDialogProps {
    /** Controls whether the dialog is mounted and visible. */
    open: boolean;
    /** Fired when the user dismisses the dialog (backdrop, Escape or cancel). */
    onClose: () => void;
    /** Fired when the user confirms the destructive action. */
    onConfirm: () => void;
    title: string;
    description?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Visual tone of the confirm button. */
    tone?: 'danger' | 'primary';
    /** Icon shown inside the header badge. Defaults to a trash can. */
    icon?: React.ReactNode;
    /** Disables the buttons and shows a busy confirm label while an action runs. */
    processing?: boolean;
    /** Label shown on the confirm button while `processing`. */
    processingLabel?: string;
}

/**
 * Accessible confirmation modal styled for the Atelier Glass design system.
 * Renders a frosted-glass panel over a dimmed, blurred backdrop. Closes on
 * Escape or backdrop click, traps initial focus on the cancel button, and
 * restores focus to the previously active element when dismissed.
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    tone = 'danger',
    icon,
    processing = false,
    processingLabel = 'Eliminando…',
}: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (!open) {
            setEntered(false);

            return;
        }

        previouslyFocused.current = document.activeElement as HTMLElement | null;
        const frame = requestAnimationFrame(() => {
            setEntered(true);
            cancelRef.current?.focus();
        });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
                onClose();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = overflow;
            previouslyFocused.current?.focus?.();
        };
    }, [open, processing, onClose]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const isDanger = tone === 'danger';

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? 'confirm-dialog-description' : undefined}
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label={cancelLabel}
                tabIndex={-1}
                onClick={() => !processing && onClose()}
                className={cn(
                    'absolute inset-0 cursor-default bg-ink/30 backdrop-blur-sm transition-opacity duration-200',
                    entered ? 'opacity-100' : 'opacity-0',
                )}
            />

            {/* Panel */}
            <div
                className={cn(
                    'glass relative w-full max-w-md rounded-[26px] p-7 text-center transition-all duration-200 ease-out',
                    entered
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'translate-y-2 scale-[0.97] opacity-0',
                )}
            >
                {/* Icon */}
                <div
                    className={cn(
                        'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl',
                        isDanger
                            ? 'bg-danger/10 text-danger'
                            : 'bg-indigo/10 text-indigo',
                    )}
                >
                    {icon ?? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.75}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7"
                            aria-hidden="true"
                        >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                            <path d="M19 6l-.8 13a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                        </svg>
                    )}
                </div>

                <h2
                    id="confirm-dialog-title"
                    className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink"
                >
                    {title}
                </h2>

                {description && (
                    <p
                        id="confirm-dialog-description"
                        className="mt-2 text-sm leading-relaxed text-ink-50"
                    >
                        {description}
                    </p>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className={buttonClass('outline', 'w-full sm:w-auto')}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={cn(
                            'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-[22px] py-[11px] text-sm font-semibold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-60 sm:w-auto',
                            isDanger
                                ? 'bg-danger shadow-[0_8px_20px_-10px_rgba(153,27,27,0.8)] hover:brightness-110 focus-visible:ring-danger/45 active:translate-y-px'
                                : 'bg-indigo shadow-[0_8px_20px_-10px_rgba(61,58,138,0.7)] hover:brightness-110 focus-visible:ring-indigo/45 active:translate-y-px',
                        )}
                    >
                        {processing && (
                            <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-90"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
                                />
                            </svg>
                        )}
                        {processing ? processingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
