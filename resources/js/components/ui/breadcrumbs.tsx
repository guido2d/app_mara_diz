import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export interface Crumb {
    label: string;
    href?: string;
}

/** Simple breadcrumb trail. The last item is rendered as the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Migas de pan" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-50">
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    return (
                        <Fragment key={i}>
                            <li>
                                {item.href && !isLast ? (
                                    <Link href={item.href} className="transition-colors duration-200 hover:text-ink">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className={isLast ? 'font-medium text-ink' : undefined} aria-current={isLast ? 'page' : undefined}>
                                        {item.label}
                                    </span>
                                )}
                            </li>
                            {!isLast && (
                                <li aria-hidden="true" className="text-ink-50/60">
                                    /
                                </li>
                            )}
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
