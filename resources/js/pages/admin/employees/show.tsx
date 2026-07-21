import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

interface Cell {
    campaign_id: number;
    answered: boolean;
    display: string | null;
}
interface Total {
    campaign_id: number;
    total: number | null;
}
type MarkColor = 'red' | 'green';
interface QuestionRow {
    id: number;
    label: string;
    mark: MarkColor | null;
    cells: Cell[];
}
interface EvaluationBlock {
    id: number;
    name: string;
    scored: boolean;
    markable: boolean;
    questions: QuestionRow[];
    totals: Total[];
}
interface CampaignCol {
    id: number;
    name: string;
    starts_at: string;
    answered: boolean;
}
interface Props {
    form: { id: number; name: string };
    employee: {
        email: string;
        name: string;
        profile: {
            role_function: string;
            age: number;
            sex: string;
            marital_status: string;
            children_count: number;
            cohabitation_group: string;
            phone: string;
        };
    };
    campaigns: CampaignCol[];
    evaluations: EvaluationBlock[];
    general_totals: Total[];
}

function ProfileItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                {label}
            </dt>
            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
    );
}

function CampaignHeader({
    campaigns,
    markable,
}: {
    campaigns: CampaignCol[];
    markable: boolean;
}) {
    return (
        <thead>
            <tr className="border-b border-[rgba(26,24,48,0.10)]">
                <th className="w-[38%] px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                    Pregunta
                </th>
                {campaigns.map((c) => (
                    <th
                        key={c.id}
                        className="px-3 py-2 text-left text-sm font-semibold text-ink"
                    >
                        {c.name}
                        {!c.answered && (
                            <span className="block font-mono text-[10px] font-normal text-ink-50">
                                no respondió
                            </span>
                        )}
                    </th>
                ))}
                {markable && (
                    <th className="w-[84px] px-3 py-2 text-right font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                        Marca
                    </th>
                )}
            </tr>
        </thead>
    );
}

const markRowClass: Record<MarkColor, string> = {
    red: 'bg-rose-100',
    green: 'bg-emerald-100',
};

const markButtonClass: Record<MarkColor, { on: string; off: string }> = {
    red: {
        on: 'border-rose-500 bg-rose-500',
        off: 'border-rose-400 bg-rose-200 hover:bg-rose-300',
    },
    green: {
        on: 'border-emerald-500 bg-emerald-500',
        off: 'border-emerald-400 bg-emerald-200 hover:bg-emerald-300',
    },
};

/**
 * One question row. The colour flag is kept in local state so the click feels
 * instant, and rolled back if the request fails.
 */
function QuestionRowItem({
    question,
    formId,
    email,
    markable,
}: {
    question: QuestionRow;
    formId: number;
    email: string;
    markable: boolean;
}) {
    const [mark, setMark] = useState<MarkColor | null>(question.mark);
    const [saving, setSaving] = useState(false);

    useEffect(() => setMark(question.mark), [question.mark]);

    const pick = (color: MarkColor) => {
        const previous = mark;
        setMark(previous === color ? null : color);
        setSaving(true);

        router.post(
            `/admin/forms/${formId}/employees/marks`,
            { email, question_id: question.id, color },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setMark(previous),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <tr
            className={`border-b border-[rgba(26,24,48,0.06)] ${mark ? markRowClass[mark] : ''}`}
        >
            <td className="px-3 py-2.5 text-ink">{question.label}</td>
            {question.cells.map((cell) => (
                <td
                    key={cell.campaign_id}
                    className="px-3 py-2.5 font-medium text-ink"
                >
                    {cell.display ?? <span className="text-ink-50">—</span>}
                </td>
            ))}
            {markable && (
                <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                        {(['red', 'green'] as const).map((color) => (
                            <button
                                key={color}
                                type="button"
                                disabled={saving}
                                onClick={() => pick(color)}
                                aria-pressed={mark === color}
                                title={
                                    mark === color
                                        ? 'Quitar marca'
                                        : color === 'red'
                                          ? 'Marcar en rojo'
                                          : 'Marcar en verde'
                                }
                                className={`h-5 w-5 cursor-pointer rounded-full border-2 transition-colors disabled:cursor-wait disabled:opacity-60 ${
                                    mark === color
                                        ? markButtonClass[color].on
                                        : markButtonClass[color].off
                                }`}
                            >
                                <span className="sr-only">
                                    {color === 'red'
                                        ? 'Marcar en rojo'
                                        : 'Marcar en verde'}
                                </span>
                            </button>
                        ))}
                    </div>
                </td>
            )}
        </tr>
    );
}

function EvaluationCard({
    evaluation,
    campaigns,
    formId,
    email,
}: {
    evaluation: EvaluationBlock;
    campaigns: CampaignCol[];
    formId: number;
    email: string;
}) {
    const [open, setOpen] = useState(false);
    const panelId = `eval-${evaluation.id}`;

    return (
        <GlassCard className="mb-5">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer items-center gap-3 text-left"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 shrink-0 text-ink-50 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
                <h2 className="flex-1 text-sm font-semibold text-ink">
                    {evaluation.name}
                    {!evaluation.scored && (
                        <span className="ml-2 font-normal text-ink-50">
                            (sin puntaje)
                        </span>
                    )}
                </h2>
            </button>

            {open && (
                <div id={panelId} className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <CampaignHeader
                            campaigns={campaigns}
                            markable={evaluation.markable}
                        />
                        <tbody>
                            {evaluation.questions.map((q) => (
                                <QuestionRowItem
                                    key={q.id}
                                    question={q}
                                    formId={formId}
                                    email={email}
                                    markable={evaluation.markable}
                                />
                            ))}
                            {evaluation.scored && (
                                <tr className="border-t border-[rgba(26,24,48,0.14)]">
                                    <td className="px-3 py-2.5 font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                                        Total
                                    </td>
                                    {evaluation.totals.map((t) => (
                                        <td
                                            key={t.campaign_id}
                                            className="px-3 py-2.5 font-mono font-semibold text-ink"
                                        >
                                            {t.total ?? '—'}
                                        </td>
                                    ))}
                                    {evaluation.markable && <td />}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </GlassCard>
    );
}

function ScoreSummary({
    campaigns,
    evaluations,
}: {
    campaigns: CampaignCol[];
    evaluations: EvaluationBlock[];
}) {
    const scored = evaluations.filter((e) => e.scored);

    if (scored.length === 0 || campaigns.length === 0) {
        return null;
    }

    const totalFor = (evaluation: EvaluationBlock, campaignId: number) =>
        evaluation.totals.find((t) => t.campaign_id === campaignId)?.total ?? null;

    const first = campaigns[0];
    const last = campaigns[campaigns.length - 1];
    const showDiff = campaigns.length >= 2 && first.id !== last.id;

    const diffFor = (evaluation: EvaluationBlock) => {
        const a = totalFor(evaluation, first.id);
        const b = totalFor(evaluation, last.id);
        if (a === null || b === null || a === 0) {
            return null;
        }
        return ((b - a) / a) * 100;
    };

    return (
        <GlassCard className="mb-5 overflow-x-auto">
            <h2 className="mb-4 text-sm font-semibold text-ink">
                Puntajes por campaña
            </h2>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-[rgba(26,24,48,0.10)]">
                        <th className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                            Campaña
                        </th>
                        {scored.map((e) => (
                            <th
                                key={e.id}
                                className="px-3 py-2 text-left text-sm font-semibold text-ink"
                            >
                                {e.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((c) => (
                        <tr
                            key={c.id}
                            className="border-b border-[rgba(26,24,48,0.06)]"
                        >
                            <td className="px-3 py-2.5 font-medium text-ink">
                                {c.name}
                                {!c.answered && (
                                    <span className="block font-mono text-[10px] font-normal text-ink-50">
                                        no respondió
                                    </span>
                                )}
                            </td>
                            {scored.map((e) => {
                                const total = totalFor(e, c.id);
                                return (
                                    <td
                                        key={e.id}
                                        className="px-3 py-2.5 font-mono font-semibold text-ink"
                                    >
                                        {total ?? (
                                            <span className="text-ink-50">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {showDiff && (
                        <tr className="border-t border-[rgba(26,24,48,0.14)]">
                            <td className="px-3 py-2.5 font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                                Diferencia %
                                <span className="block font-sans text-[10px] tracking-normal normal-case">
                                    {first.name} → {last.name}
                                </span>
                            </td>
                            {scored.map((e) => {
                                const diff = diffFor(e);
                                return (
                                    <td
                                        key={e.id}
                                        className="px-3 py-2.5 font-mono font-semibold"
                                    >
                                        {diff === null ? (
                                            <span className="text-ink-50">—</span>
                                        ) : (
                                            <span
                                                className={
                                                    diff > 0
                                                        ? 'text-emerald-600'
                                                        : diff < 0
                                                          ? 'text-rose-600'
                                                          : 'text-ink'
                                                }
                                            >
                                                {diff > 0 ? '+' : ''}
                                                {diff.toFixed(1)}%
                                            </span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    )}
                </tbody>
            </table>
        </GlassCard>
    );
}

export default function EmployeeCompare({
    form,
    employee,
    campaigns,
    evaluations,
}: Props) {
    return (
        <AdminShell title={`${employee.name} — ${form.name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Formularios', href: '/admin/forms' },
                    { label: form.name, href: `/admin/forms/${form.id}/campaigns` },
                    {
                        label: 'Comparativo',
                        href: `/admin/forms/${form.id}/employees`,
                    },
                    { label: employee.name },
                ]}
            />

            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        {employee.name}
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">{employee.email}</p>
                </div>
                <Link
                    href={`/admin/forms/${form.id}/employees`}
                    className={buttonClass('ghost')}
                >
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

            <GlassCard className="mb-5">
                <h2 className="mb-4 text-sm font-semibold text-ink">
                    Perfil <span className="text-ink-50">(último envío)</span>
                </h2>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <ProfileItem label="Función" value={employee.profile.role_function} />
                    <ProfileItem label="Edad" value={employee.profile.age} />
                    <ProfileItem label="Sexo" value={employee.profile.sex} />
                    <ProfileItem label="Estado civil" value={employee.profile.marital_status} />
                    <ProfileItem label="Hijos" value={employee.profile.children_count} />
                    <ProfileItem label="Convivencia" value={employee.profile.cohabitation_group} />
                    <ProfileItem label="Celular" value={employee.profile.phone} />
                </dl>
            </GlassCard>

            <ScoreSummary campaigns={campaigns} evaluations={evaluations} />

            {evaluations.map((evaluation) => (
                <EvaluationCard
                    key={evaluation.id}
                    evaluation={evaluation}
                    campaigns={campaigns}
                    formId={form.id}
                    email={employee.email}
                />
            ))}
        </AdminShell>
    );
}
