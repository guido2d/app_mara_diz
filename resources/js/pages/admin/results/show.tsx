import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button, buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/field';
import { AdminShell } from '@/layouts/admin-shell';

interface Answer {
    question: string;
    value: string | null;
    points: number | null;
}
interface EvaluationGroup {
    evaluation: string;
    total_points: number | null;
    answers: Answer[];
}
interface Submission {
    id: number;
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
    authorizes_medical_access: boolean;
    evaluations: EvaluationGroup[];
}

function ProfileItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="min-w-0 rounded-xl border border-[rgba(26,24,48,0.08)] bg-white/40 px-4 py-3">
            <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm [overflow-wrap:anywhere] text-ink">
                {value}
            </dd>
        </div>
    );
}

function EditableEmail({
    submissionId,
    email,
}: {
    submissionId: number;
    email: string;
}) {
    const [editing, setEditing] = useState(false);

    if (!editing) {
        return (
            <div className="min-w-0 rounded-xl border border-[rgba(26,24,48,0.08)] bg-white/40 px-4 py-3">
                <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                    Email
                </dt>
                <dd className="mt-1 flex items-start justify-between gap-2 text-sm text-ink">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                        {email}
                    </span>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="shrink-0 cursor-pointer font-mono text-[11px] text-indigo hover:underline"
                    >
                        Editar
                    </button>
                </dd>
            </div>
        );
    }

    return (
        <div className="min-w-0 rounded-xl border border-indigo/30 bg-white/40 px-4 py-3 sm:col-span-2 lg:col-span-3">
            <Form
                action={`/admin/submissions/${submissionId}/email`}
                method="patch"
                onSuccess={() => setEditing(false)}
                className="flex flex-col gap-2"
            >
                {({ errors, processing }) => (
                    <>
                        <Label
                            htmlFor="work_email"
                            className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase"
                        >
                            Corregir email
                        </Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <Input
                                id="work_email"
                                name="work_email"
                                type="email"
                                defaultValue={email}
                                required
                                className="sm:flex-1"
                            />
                            <div className="flex items-center gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Guardando…' : 'Guardar'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className={buttonClass('ghost')}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                        <FieldError>{errors.work_email}</FieldError>
                        <p className="text-xs text-ink-50">
                            Corregí el email mal tipeado para unir los envíos de
                            la misma persona en el comparativo.
                        </p>
                    </>
                )}
            </Form>
        </div>
    );
}

function EvaluationPanel({ group }: { group: EvaluationGroup }) {
    const [open, setOpen] = useState(false);
    const panelId = `eval-${group.evaluation.replace(/\s+/g, '-')}`;

    return (
        <div className="overflow-hidden rounded-xl border border-[rgba(26,24,48,0.08)] bg-white/40">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/50"
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
                <span className="flex-1 text-sm font-medium text-ink">
                    {group.evaluation}
                </span>
                <span className="font-mono text-[11px] text-ink-50">
                    {group.answers.length} resp.
                </span>
                {group.total_points !== null && (
                    <span className="rounded-full bg-indigo/10 px-2.5 py-1 font-mono text-xs font-semibold text-indigo">
                        {group.total_points} pts
                    </span>
                )}
            </button>

            {open && (
                <div
                    id={panelId}
                    className="flex flex-col divide-y divide-[rgba(26,24,48,0.07)] border-t border-[rgba(26,24,48,0.08)] px-4"
                >
                    {group.answers.map((a, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:justify-between sm:gap-4"
                        >
                            <span className="order-2 text-ink-50 sm:order-1">
                                {a.question}
                            </span>
                            <span className="order-1 flex items-center gap-2 sm:order-2 sm:shrink-0 sm:text-right">
                                <span className="font-medium text-ink">
                                    {a.value ?? '—'}
                                </span>
                                {a.points !== null && (
                                    <span className="font-mono text-[11px] text-ink-50">
                                        {a.points} pts
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
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
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        <EditableEmail
                            submissionId={submission.id}
                            email={submission.work_email}
                        />
                        <ProfileItem label="Celular" value={submission.phone} />
                        <ProfileItem
                            label="Autoriza acceso médico"
                            value={
                                submission.authorizes_medical_access
                                    ? 'Sí'
                                    : 'No'
                            }
                        />
                    </dl>
                </GlassCard>

                <GlassCard>
                    <h2 className="mb-1 text-sm font-semibold text-ink">
                        Resultados
                    </h2>
                    <p className="mb-4 text-xs text-ink-50">
                        Desplegá cada evaluación para ver las respuestas
                        asociadas.
                    </p>
                    <div className="flex flex-col gap-3">
                        {submission.evaluations.map((group, i) => (
                            <EvaluationPanel key={i} group={group} />
                        ))}
                    </div>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
