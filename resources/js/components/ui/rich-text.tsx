import { Fragment } from 'react';

/**
 * Renders plain text with a minimal, safe markup subset: `**texto**` becomes
 * bold. Line breaks are preserved by the container (`whitespace-pre-line`).
 * Parses into real React nodes — no `dangerouslySetInnerHTML`, so no XSS risk.
 */
export function RichText({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return (
        <>
            {parts.map((part, i) => {
                const match = part.match(/^\*\*([^*]+)\*\*$/);
                if (match) {
                    return (
                        <strong key={i} className="font-semibold text-ink">
                            {match[1]}
                        </strong>
                    );
                }
                return <Fragment key={i}>{part}</Fragment>;
            })}
        </>
    );
}
