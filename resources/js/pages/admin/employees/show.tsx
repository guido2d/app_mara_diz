import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
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
interface QuestionRow {
    id: number;
    label: string;
    cells: Cell[];
}
interface EvaluationBlock {
    id: number;
    name: string;
    scored: boolean;
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

function CampaignHeader({ campaigns }: { campaigns: CampaignCol[] }) {
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
            </tr>
        </thead>
    );
}

function EvaluationCard({
    evaluation,
    campaigns,
}: {
    evaluation: EvaluationBlock;
    campaigns: CampaignCol[];
}) {
    const [open, setOpen] = useState(true);
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
                        <CampaignHeader campaigns={campaigns} />
                        <tbody>
                            {evaluation.questions.map((q) => (
                                <tr
                                    key={q.id}
                                    className="border-b border-[rgba(26,24,48,0.06)]"
                                >
                                    <td className="px-3 py-2.5 text-ink-50">
                                        {q.label}
                                    </td>
                                    {q.cells.map((cell) => (
                                        <td
                                            key={cell.campaign_id}
                                            className="px-3 py-2.5 font-medium text-ink"
                                        >
                                            {cell.display ?? (
                                                <span className="text-ink-50">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
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
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </GlassCard>
    );
}

export default function EmployeeCompare({
    form,
    employee,
    campaigns,
    evaluations,
    general_totals,
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

            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    {employee.name}
                </h1>
                <p className="mt-1 text-sm text-ink-50">{employee.email}</p>
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

            {evaluations.map((evaluation) => (
                <EvaluationCard
                    key={evaluation.id}
                    evaluation={evaluation}
                    campaigns={campaigns}
                />
            ))}

            <GlassCard className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <CampaignHeader campaigns={campaigns} />
                    <tbody>
                        <tr>
                            <td className="px-3 py-2.5 font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                                Total general
                            </td>
                            {general_totals.map((t) => (
                                <td
                                    key={t.campaign_id}
                                    className="px-3 py-2.5 font-mono text-base font-semibold text-ink"
                                >
                                    {t.total ?? '—'}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </GlassCard>
        </AdminShell>
    );
}
