import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { CampaignLegend, GroupedBars } from '@/components/ui/bar-chart';
import type { BarScale, BarSeries } from '@/components/ui/bar-chart';
import {
    DISTRIBUTION_MIN_WIDTH,
    DistributionHeader,
    OptionDistribution,
} from '@/components/ui/option-distribution';
import type { Distribution } from '@/components/ui/option-distribution';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

/** Qué mide el reporte de una evaluación, definido en el seeder. */
type ReportMetric = 'average' | 'positive_rate' | 'yes_rate';

/** Tope de la escala de las barras: 3 puntos o 100%. */
const MAX: Record<ReportMetric, number> = {
    average: 3,
    positive_rate: 100,
    yes_rate: 100,
};

const SCALE: Record<ReportMetric, BarScale> = {
    average: 'points',
    positive_rate: 'percent',
    yes_rate: 'percent',
};

const CAPTION: Record<ReportMetric, string> = {
    average: 'promedio de puntos por pregunta',
    positive_rate: '% de personas que puntúan positivamente',
    yes_rate: '% de personas con el síntoma o enfermedad',
};

/** Leyenda de las evaluaciones que se desglosan respuesta por respuesta. */
const DISTRIBUTION_CAPTION = 'cantidad de personas por respuesta';

interface CampaignInfo {
    id: number;
    name: string;
}

interface CampaignValue {
    campaign_id: number;
    value: number | null;
    answers: number;
}

interface QuestionRow {
    id: number;
    label: string;
    values: CampaignValue[];
    /** Desglose por opción, o null en las evaluaciones que se informan como %. */
    distribution: Distribution | null;
}

interface EvaluationBlock {
    id: number;
    name: string;
    is_scored: boolean;
    lower_is_better: boolean;
    metric: ReportMetric;
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
        value: value.value,
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
    const [open, setOpen] = useState(false);
    const panelId = `report-eval-${evaluation.id}`;
    const change = totalChange(evaluation.totals);
    const fell = change !== null && change < 0;
    const improved = change !== null && fell === evaluation.lower_is_better;
    const breaksDown = evaluation.questions.some(
        (question) => question.distribution !== null,
    );

    return (
        <GlassCard
            className="mb-5 cursor-pointer"
            onClick={() => setOpen((value) => !value)}
        >
            {/*
                El toggle vive en la card entera: el click del botón — también el
                que dispara Enter o Espacio — burbujea hasta acá. El botón sigue
                existiendo para el foco y el rol accesible, sin handler propio.
            */}
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 text-left"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 shrink-0 self-center text-ink-50 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
                <h2 className="flex-1 text-sm font-semibold text-ink">
                    {evaluation.name}
                </h2>
                <p className="font-mono text-[11px] text-ink-50">
                    {breaksDown
                        ? DISTRIBUTION_CAPTION
                        : CAPTION[evaluation.metric]}{' '}
                    ·{' '}
                    {evaluation.lower_is_better
                        ? 'menos es mejor'
                        : 'más es mejor'}
                </p>
            </button>

            {!open && (
                <p className="mt-1 pl-7 font-mono text-[11px] text-ink-50">
                    {evaluation.questions.length} preguntas
                </p>
            )}

            {open && (
                <div
                    id={panelId}
                    onClick={(event) => event.stopPropagation()}
                    className="cursor-default"
                >
                    {/*
                        Las evaluaciones que sólo clasifican — Síntomas o
                        enfermedades — no suman puntaje: no hay total que mostrar
                        y el bloque queda fuera en vez de rellenarse con guiones.
                    */}
                    {evaluation.is_scored && (
                        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
                            {evaluation.totals.map((total, index) => (
                                <div key={total.campaign_id}>
                                    <p className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                                        {campaigns[index]?.name}
                                    </p>
                                    <p className="mt-0.5 font-mono text-xl font-semibold text-ink">
                                        {total.average === null ? (
                                            <span className="text-ink-50">
                                                —
                                            </span>
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
                                    {change > 0 ? '▲' : '▼'}{' '}
                                    {Math.abs(change).toFixed(1)}%
                                    <span className="ml-1 font-sans text-[11px] font-normal text-ink-50">
                                        puntaje total
                                    </span>
                                </p>
                            )}
                        </div>
                    )}

                    {/*
                        El desglose por opción trae su propio encabezado de
                        columnas — con el nombre y el color de cada campaña — así
                        que la leyenda sólo hace falta en los gráficos de barras.
                    */}
                    {!breaksDown && (
                        <div className="mt-5 border-t border-[rgba(26,24,48,0.08)] pt-4">
                            <CampaignLegend campaigns={campaigns} />
                        </div>
                    )}

                    {/*
                        Un único contenedor con scroll horizontal para toda la
                        evaluación: si cada pregunta tuviera el suyo, en pantallas
                        angostas las tablas se desplazarían por separado y
                        dejarían de estar alineadas con el encabezado.
                    */}
                    <div className="mt-5 overflow-x-auto border-t border-[rgba(26,24,48,0.08)] pt-4">
                        <div
                            style={
                                breaksDown
                                    ? { minWidth: DISTRIBUTION_MIN_WIDTH }
                                    : undefined
                            }
                        >
                            {breaksDown && (
                                <DistributionHeader campaigns={campaigns} />
                            )}

                            <ol className="mt-4 flex flex-col gap-6">
                                {evaluation.questions.map((question, index) => (
                                    <li key={question.id}>
                                        <p className="mb-2 text-sm text-ink">
                                            <span className="mr-2 font-mono text-xs text-ink-50">
                                                {index + 1}.
                                            </span>
                                            {question.label}
                                        </p>
                                        {question.distribution === null ? (
                                            <GroupedBars
                                                series={toSeries(
                                                    question.values,
                                                    campaigns,
                                                )}
                                                max={MAX[evaluation.metric]}
                                                scale={SCALE[evaluation.metric]}
                                                lowerIsBetter={
                                                    evaluation.lower_is_better
                                                }
                                                showScale={
                                                    index ===
                                                    evaluation.questions
                                                        .length -
                                                        1
                                                }
                                            />
                                        ) : (
                                            <OptionDistribution
                                                distribution={
                                                    question.distribution
                                                }
                                                campaigns={campaigns}
                                            />
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )}
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
