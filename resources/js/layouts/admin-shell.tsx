import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { NavLink } from '@/components/ui/nav-link';
import { adminNavItems } from '@/config/nav';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    title?: string;
    children: ReactNode;
}

/** Chrome for the authenticated admin panel: glass top bar + centred content. */
export function AdminShell({ title, children }: AdminShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const logout = () => router.post('/admin/logout');

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
                            <div className="hidden items-center gap-1 md:flex">
                                {adminNavItems.map((item) => (
                                    <NavLink key={item.href} href={item.href} match={item.match}>
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className={cn(buttonClass('ghost'), 'hidden md:inline-flex')}
                        >
                            Cerrar sesión
                        </button>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            aria-label="Abrir menú"
                            aria-expanded={mobileOpen}
                            className="grid size-9 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-white/50 md:hidden"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-5"
                                aria-hidden="true"
                            >
                                {mobileOpen ? (
                                    <>
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M4 6h16" />
                                        <path d="M4 12h16" />
                                        <path d="M4 18h16" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </nav>

                    {mobileOpen && (
                        <div className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-[22px] p-3 md:hidden">
                            {adminNavItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    href={item.href}
                                    match={item.match}
                                    onNavigate={() => setMobileOpen(false)}
                                    className="px-4 py-2.5"
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                            <button
                                onClick={logout}
                                className={cn(
                                    buttonClass('ghost'),
                                    'justify-start px-4 py-2.5 text-left',
                                )}
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </header>
                <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
            </div>
        </>
    );
}
