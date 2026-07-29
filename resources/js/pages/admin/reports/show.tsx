import { Link } from '@inertiajs/react';
import { CampaignLegend, GroupedBars } from '@/components/ui/bar-chart';
import type { BarSeries } from '@/components/ui/bar-chart';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

const MAX_POINTS = 3;

interface CampaignInfo {
    id: number;
    name: string;
}

interface CampaignValue {
    campaign_id: number;
    average: number | null;
    answers: number;
}

interface QuestionRow {
    id: number;
    label: string;
    values: CampaignValue[];
}

interface EvaluationBlock {
    id: number;
    name: string;
    lower_is_better: boolean;
    totals: { campaign_id: number; average: number | null }[];
    questions: QuestionRow[];
}

interface Props {
    form: { id: number; name: string };
    campaigns: CampaignInfo[];
    evaluations: EvaluationBlock[];
}

function toSeries(
    values: CampaignValue[],
    campaigns: CampaignInfo[],
): BarSeries[] {
    return values.map((value, index) => ({
        campaign_id: value.campaign_id,
        campaign_name: campaigns[index]?.name ?? '',
        value: value.average,
        answers: value.answers,
    }));
}

/** Variación porcentual del puntaje total entre la primera y la última campaña medidas. */
function totalChange(totals: EvaluationBlock['totals']): number | null {
    const measured = totals.filter((total) => total.average !== null);

    if (measured.length < 2) {
        return null;
    }

    const first = measured[0].average as number;
    const last = measured[measured.length - 1].average as number;

    if (first === 0) {
        return null;
    }

    return ((last - first) / first) * 100;
}

function EvaluationReport({
    evaluation,
    campaigns,
}: {
    evaluation: EvaluationBlock;
    campaigns: CampaignInfo[];
}) {
    const change = totalChange(evaluation.totals);
    const fell = change !== null && change < 0;
    const improved = change !== null && fell === evaluation.lower_is_better;

    return (
        <GlassCard className="mb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink">
                    {evaluation.name}
                </h2>
                <p className="font-mono text-[11px] text-ink-50">
                    {evaluation.lower_is_better
                        ? 'menos puntos es mejor'
                        : 'más puntos es mejor'}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
                {evaluation.totals.map((total, index) => (
                    <div key={total.campaign_id}>
                        <p className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                            {campaigns[index]?.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-semibold text-ink">
                            {total.average === null ? (
                                <span className="text-ink-50">—</span>
                            ) : (
                                total.average.toFixed(1)
                            )}
                        </p>
                    </div>
                ))}
                {change !== null && (
                    <p
                        className={`font-mono text-sm font-semibold ${improved ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                        {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                        <span className="ml-1 font-sans text-[11px] font-normal text-ink-50">
                            puntaje total
                        </span>
                    </p>
                )}
            </div>

            <div className="mt-5 border-t border-[rgba(26,24,48,0.08)] pt-4">
                <CampaignLegend campaigns={campaigns} />
            </div>

            <ol className="mt-5 flex flex-col gap-6">
                {evaluation.questions.map((question, index) => (
                    <li key={question.id}>
                        <p className="mb-2 text-sm text-ink">
                            <span className="mr-2 font-mono text-xs text-ink-50">
                                {index + 1}.
                            </span>
                            {question.label}
                        </p>
                        <GroupedBars
                            series={toSeries(question.values, campaigns)}
                            max={MAX_POINTS}
                            lowerIsBetter={evaluation.lower_is_better}
                            showScale={
                                index === evaluation.questions.length - 1
                            }
                        />
                    </li>
                ))}
            </ol>
        </GlassCard>
    );
}

export default function ReportShow({ form, campaigns, evaluations }: Props) {
    return (
        <AdminShell title={`Reporte — ${form.name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Reportes', href: '/admin/reports' },
                    { label: form.name },
                ]}
            />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Reporte
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">{form.name}</p>
                </div>
                <Link href="/admin/reports" className={buttonClass('ghost')}>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-4 w-4"
                    >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                    </svg>
                    Volver
                </Link>
            </div>

            {evaluations.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay preguntas marcadas para el reporte en las
                        evaluaciones de este formulario.
                    </p>
                </div>
            ) : (
                evaluations.map((evaluation) => (
                    <EvaluationReport
                        key={evaluation.id}
                        evaluation={evaluation}
                        campaigns={campaigns}
                    />
                ))
            )}
        </AdminShell>
    );
}
