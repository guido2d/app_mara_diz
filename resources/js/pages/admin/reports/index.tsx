import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

interface Report {
    submissions_total: number;
    by_range: Record<string, Record<string, number>>;
    by_sex: Record<string, number>;
}
interface Props {
    campaign: { id: number; name: string; form_id: number; form_name: string };
    report: Report;
}

function BarRow({
    label,
    count,
    max,
}: {
    label: string;
    count: number;
    max: number;
}) {
    const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;

    return (
        <div className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-ink-50">
                {label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/6">
                <div
                    className="h-full rounded-full bg-indigo transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-sm text-ink">
                {count}
            </span>
        </div>
    );
}

export default function ReportsIndex({ campaign, report }: Props) {
    const sexMax = Math.max(0, ...Object.values(report.by_sex));

    return (
        <AdminShell title={`Reporte — ${campaign.name}`}>
            <div className="mx-auto max-w-3xl">
                <Breadcrumbs
                    items={[
                        { label: 'Formularios', href: '/admin/forms' },
                        { label: campaign.form_name, href: `/admin/forms/${campaign.form_id}/campaigns` },
                        { label: `Reporte · ${campaign.name}` },
                    ]}
                />
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    Reporte de uso
                </h1>
                <p className="mt-1 mb-6 text-sm text-ink-50">{campaign.name}</p>

                <GlassCard className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="font-mono text-[11px] tracking-[0.08em] text-ink-50 uppercase">
                            Respuestas completadas
                        </p>
                        <p className="mt-1 font-display text-5xl font-medium tracking-tight text-ink">
                            {report.submissions_total}
                        </p>
                    </div>
                    <span className="grid size-12 place-items-center rounded-2xl bg-indigo/12 text-indigo">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-6"
                            aria-hidden="true"
                        >
                            <path d="M3 3v18h18" />
                            <rect x="7" y="10" width="3" height="8" rx="1" />
                            <rect x="12" y="6" width="3" height="12" rx="1" />
                            <rect x="17" y="13" width="3" height="5" rx="1" />
                        </svg>
                    </span>
                </GlassCard>

                <GlassCard className="mb-5">
                    <h2 className="mb-5 text-sm font-semibold text-ink">
                        Distribución por resultado
                    </h2>
                    {Object.keys(report.by_range).length === 0 ? (
                        <p className="text-sm text-ink-50">
                            Sin datos todavía.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {Object.entries(report.by_range).map(
                                ([evaluation, counts]) => {
                                    const max = Math.max(
                                        0,
                                        ...Object.values(counts),
                                    );

                                    return (
                                        <div key={evaluation}>
                                            <h3 className="mb-3 font-medium text-ink">
                                                {evaluation}
                                            </h3>
                                            <div className="flex flex-col gap-2.5">
                                                {Object.entries(counts).map(
                                                    ([text, count]) => (
                                                        <BarRow
                                                            key={text}
                                                            label={text}
                                                            count={count}
                                                            max={max}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </GlassCard>

                <GlassCard>
                    <h2 className="mb-5 text-sm font-semibold text-ink">
                        Por sexo
                    </h2>
                    {Object.keys(report.by_sex).length === 0 ? (
                        <p className="text-sm text-ink-50">
                            Sin datos todavía.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {Object.entries(report.by_sex).map(
                                ([sex, count]) => (
                                    <BarRow
                                        key={sex}
                                        label={sex}
                                        count={count}
                                        max={sexMax}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>
        </AdminShell>
    );
}
