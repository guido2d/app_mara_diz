import { GlassCard } from '@/components/ui/card';
import { PublicShell } from '@/layouts/public-shell';

interface Props {
    form: { name: string };
}

export default function Unavailable({ form }: Props) {
    return (
        <PublicShell title={form.name} className="justify-center">
            <GlassCard className="w-full max-w-lg p-8 text-center sm:p-10">
                <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-ink/5 text-ink-50">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-7"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5" />
                        <path d="M12 16h.01" />
                    </svg>
                </div>
                <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
                    {form.name}
                </h1>
                <p className="mx-auto mt-4 max-w-sm text-[1.0625rem] leading-relaxed text-ink-50">
                    Este formulario no está{' '}
                    <em className="font-display italic">disponible</em> en este
                    momento. Volvé a intentarlo cuando la campaña esté abierta.
                </p>
            </GlassCard>
        </PublicShell>
    );
}
