import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { NavLink } from '@/components/ui/nav-link';
import { accountNavItems, adminNavItems } from '@/config/nav';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    title?: string;
    children: ReactNode;
}

/** Chrome for the authenticated admin panel: glass top bar + centred content. */
export function AdminShell({ title, children }: AdminShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const { props, url } = usePage();
    const userName = props.auth.user.name;
    const logout = () => router.post('/admin/logout');

    /** Ítem activo = el que tiene el `match` más largo que prefija la URL actual. */
    const activeHref = [...adminNavItems, ...accountNavItems]
        .filter((item) => url.startsWith(item.match))
        .sort((a, b) => b.match.length - a.match.length)[0]?.href;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&color=7F9CF5&background=EBF4FF`;

    useEffect(() => {
        if (!accountOpen) {
            return;
        }
        const handleClick = (event: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [accountOpen]);

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
                                    <NavLink
                                        key={item.href}
                                        href={item.href}
                                        match={item.match}
                                        active={item.href === activeHref}
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        <div ref={accountRef} className="relative hidden md:block">
                            <button
                                type="button"
                                onClick={() => setAccountOpen((open) => !open)}
                                aria-haspopup="menu"
                                aria-expanded={accountOpen}
                                className={cn(buttonClass('ghost'), 'inline-flex')}
                            >
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="size-6 rounded-full"
                                />
                                {userName}
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={cn(
                                        'size-4 transition-transform duration-200',
                                        accountOpen && 'rotate-180',
                                    )}
                                    aria-hidden="true"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {accountOpen && (
                                <div
                                    role="menu"
                                    className="glass absolute right-0 mt-2 flex w-48 flex-col gap-1 rounded-2xl p-2"
                                >
                                    {accountNavItems.map((item) => (
                                        <NavLink
                                            key={item.href}
                                            href={item.href}
                                            match={item.match}
                                            active={item.href === activeHref}
                                            onNavigate={() => setAccountOpen(false)}
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
                        </div>

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
                            {[...adminNavItems, ...accountNavItems].map((item) => (
                                <NavLink
                                    key={item.href}
                                    href={item.href}
                                    match={item.match}
                                    active={item.href === activeHref}
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
