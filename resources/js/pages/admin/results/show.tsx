import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

interface Answer {
    question: string;
    value: string | null;
}
interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
}
interface Submission {
    first_name: string;
    last_name: string;
    role_function: string;
    age: number;
    sex: string;
    marital_status: string;
    children_count: number;
    cohabitation_group: string;
    work_email: string;
    phone: string;
    answers: Answer[];
    results: Result[];
}

function ProfileItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div>
            <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                {label}
            </dt>
            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
    );
}

export default function ResultShow({ submission }: { submission: Submission }) {
    return (
        <AdminShell title={`${submission.first_name} ${submission.last_name}`}>
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
                    {submission.first_name} {submission.last_name}
                </h1>

                <GlassCard className="mb-5">
                    <h2 className="mb-4 text-sm font-semibold text-ink">
                        Perfil
                    </h2>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <ProfileItem
                            label="Función"
                            value={submission.role_function}
                        />
                        <ProfileItem label="Edad" value={submission.age} />
                        <ProfileItem label="Sexo" value={submission.sex} />
                        <ProfileItem
                            label="Estado civil"
                            value={submission.marital_status}
                        />
                        <ProfileItem
                            label="Hijos"
                            value={submission.children_count}
                        />
                        <ProfileItem
                            label="Convivencia"
                            value={submission.cohabitation_group}
                        />
                        <ProfileItem
                            label="Email"
                            value={submission.work_email}
                        />
                        <ProfileItem label="Celular" value={submission.phone} />
                    </dl>
                </GlassCard>

                <GlassCard className="mb-5">
                    <h2 className="mb-4 text-sm font-semibold text-ink">
                        Resultados
                    </h2>
                    <div className="flex flex-col gap-3">
                        {submission.results.map((r, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-xl border border-[rgba(26,24,48,0.08)] bg-white/40 px-4 py-3"
                            >
                                <span className="text-sm text-ink-50">
                                    {r.evaluation}
                                </span>
                                <span className="flex items-baseline gap-2">
                                    <strong className="text-ink">
                                        {r.result_text}
                                    </strong>
                                    <span className="font-mono text-xs text-ink-50">
                                        {r.total_points} pts
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard>
                    <h2 className="mb-4 text-sm font-semibold text-ink">
                        Respuestas
                    </h2>
                    <div className="flex flex-col divide-y divide-[rgba(26,24,48,0.07)]">
                        {submission.answers.map((a, i) => (
                            <div
                                key={i}
                                className="flex justify-between gap-4 py-2.5 text-sm"
                            >
                                <span className="text-ink-50">
                                    {a.question}
                                </span>
                                <span className="text-right font-medium text-ink">
                                    {a.value ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
