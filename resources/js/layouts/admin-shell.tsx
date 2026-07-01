import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    title?: string;
    children: ReactNode;
}

function NavLink({ href, label }: { href: string; label: string }) {
    const { url } = usePage();
    const active = url.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                active ? 'bg-indigo/12 text-ink' : 'text-ink-50 hover:text-ink',
            )}
        >
            {label}
        </Link>
    );
}

/** Chrome for the authenticated admin panel: glass top bar + centred content. */
export function AdminShell({ title, children }: AdminShellProps) {
    return (
        <>
            {title && <Head title={title} />}
            <div className="min-h-screen">
                <header className="sticky top-4 z-30 mx-4 mt-4">
                    <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-4 py-2 sm:px-5">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link
                                href="/admin/forms"
                                className="mr-2 flex items-center gap-2 px-2"
                            >
                                <span className="grid size-7 place-items-center rounded-lg bg-indigo text-[13px] font-semibold text-indigo-ink">
                                    M
                                </span>
                                <span className="font-display text-lg leading-none font-semibold text-ink">
                                    Mara Diz
                                </span>
                            </Link>
                            <NavLink href="/admin/forms" label="Formularios" />
                        </div>
                        <button
                            onClick={() => router.post('/admin/logout')}
                            className={buttonClass('ghost')}
                        >
                            Cerrar sesión
                        </button>
                    </nav>
                </header>
                <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
                    {children}
                </main>
            </div>
        </>
    );
}
