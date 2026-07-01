import { GlassCard } from '@/components/ui/card';
import { PublicShell } from '@/layouts/public-shell';

interface Props {
    form: { name: string };
}

export default function ThankYou({ form }: Props) {
    return (
        <PublicShell title="¡Gracias!" className="justify-center">
            <GlassCard className="w-full max-w-lg p-8 text-center sm:p-10">
                <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-indigo/12 text-indigo">
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
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </div>
                <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
                    ¡Gracias por <em className="italic">participar</em>!
                </h1>
                <p className="mx-auto mt-4 max-w-sm text-[1.0625rem] leading-relaxed text-ink-50">
                    Recibimos tus respuestas del formulario{' '}
                    <span className="font-medium text-ink">“{form.name}”</span>.
                    Tu aporte es confidencial y nos ayuda a cuidar el bienestar
                    del equipo.
                </p>
            </GlassCard>
        </PublicShell>
    );
}
