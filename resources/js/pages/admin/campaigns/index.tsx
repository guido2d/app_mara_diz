import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PublicFormController from '@/actions/App/Http/Controllers/PublicFormController';
import { Button, buttonClass } from '@/components/ui/button';
import { campaignActionIcons } from '@/components/ui/campaign-action-icons';
import { GlassCard } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FieldError, Input, Label } from '@/components/ui/field';
import {
    CardActions,
    CardField,
    CardList,
    DataTable,
    RecordCard,
    StatusPill,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface CampaignRow {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
}
interface Props {
    form: { id: number; name: string; slug: string };
    campaigns: CampaignRow[];
}

/** Convierte una fecha `YYYY-MM-DD` a `DD-MM-YYYY` sin tocar zona horaria. */
function formatDate(iso: string): string {
    const [year, month, day] = iso.split('-');

    return `${day}-${month}-${year}`;
}

/** Acciones por campaña reutilizadas en la tabla (desktop) y la tarjeta (mobile). */
function CampaignActions({
    campaign,
    hasOpen,
}: {
    campaign: CampaignRow;
    hasOpen: boolean;
}) {
    const [pendingAction, setPendingAction] = useState<
        'close' | 'reopen' | null
    >(null);
    const [processing, setProcessing] = useState(false);
    const isClose = pendingAction === 'close';

    const runAction = () => {
        if (!pendingAction) {
            return;
        }

        router.post(
            `/admin/campaigns/${campaign.id}/${pendingAction}`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setPendingAction(null),
            },
        );
    };

    return (
        <>
            <Link
                href={`/admin/campaigns/${campaign.id}/results`}
                className="text-indigo hover:underline"
            >
                Resultados
            </Link>
            {campaign.is_open && (
                <button
                    onClick={() => setPendingAction('close')}
                    className="cursor-pointer text-danger hover:underline"
                >
                    Cerrar
                </button>
            )}
            {!campaign.is_open && !hasOpen && (
                <button
                    onClick={() => setPendingAction('reopen')}
                    className="cursor-pointer text-indigo hover:underline"
                >
                    Reabrir
                </button>
            )}

            <ConfirmDialog
                open={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                onConfirm={runAction}
                processing={processing}
                tone={isClose ? 'danger' : 'primary'}
                icon={
                    isClose
                        ? campaignActionIcons.close
                        : campaignActionIcons.reopen
                }
                title={isClose ? 'Cerrar campaña' : 'Reabrir campaña'}
                confirmLabel={isClose ? 'Cerrar campaña' : 'Reabrir campaña'}
                processingLabel={isClose ? 'Cerrando…' : 'Reabriendo…'}
                description={
                    isClose ? (
                        <>
                            Se cerrará la campaña{' '}
                            <strong className="font-semibold text-ink">
                                {campaign.name}
                            </strong>{' '}
                            y dejará de recibir respuestas. Podés reabrirla más
                            adelante.
                        </>
                    ) : (
                        <>
                            Se reabrirá la campaña{' '}
                            <strong className="font-semibold text-ink">
                                {campaign.name}
                            </strong>{' '}
                            para volver a recibir respuestas.
                        </>
                    )
                }
            />
        </>
    );
}

export default function CampaignsIndex({ form, campaigns }: Props) {
    const hasOpen = campaigns.some((c) => c.is_open);

    return (
        <AdminShell title={`Campañas — ${form.name}`}>
            <div className="mb-6">
                <Link
                    href="/admin/forms"
                    className="text-sm font-medium text-ink-50 hover:text-ink"
                >
                    ← Formularios
                </Link>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                            Campañas — {form.name}
                        </h1>
                        <p className="mt-1 text-sm text-ink-50">
                            Cada campaña abre una ronda de respuestas. Solo puede
                            haber una campaña abierta por vez.
                        </p>
                    </div>
                    <a
                        href={PublicFormController.show(form.slug).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass('secondary')}
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
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        Ver formulario público
                    </a>
                </div>
            </div>

            {!hasOpen && (
                <GlassCard className="mb-6">
                    <h2 className="mb-4 text-lg font-semibold text-ink">
                        Abrir una nueva campaña
                    </h2>
                    <Form
                        action={`/admin/forms/${form.id}/campaigns`}
                        method="post"
                        className="flex flex-wrap items-end gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Q1 2026"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="starts_at">Desde</Label>
                                    <Input
                                        id="starts_at"
                                        name="starts_at"
                                        type="date"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="ends_at">Hasta</Label>
                                    <Input
                                        id="ends_at"
                                        name="ends_at"
                                        type="date"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Abriendo…' : 'Abrir campaña'}
                                </Button>
                                <div className="w-full">
                                    <FieldError>{errors.name}</FieldError>
                                </div>
                            </>
                        )}
                    </Form>
                </GlassCard>
            )}

            {campaigns.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay campañas para este formulario.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Nombre</Th>
                                <Th>Desde</Th>
                                <Th>Hasta</Th>
                                <Th>Respuestas</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <Tr key={c.id}>
                                    <Td className="font-medium">{c.name}</Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {formatDate(c.starts_at)}
                                    </Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {formatDate(c.ends_at)}
                                    </Td>
                                    <Td>{c.submissions_count}</Td>
                                    <Td>
                                        <StatusPill active={c.is_open}>
                                            {c.is_open ? 'Abierta' : 'Cerrada'}
                                        </StatusPill>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                            <CampaignActions
                                                campaign={c}
                                                hasOpen={hasOpen}
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {campaigns.map((c) => (
                            <RecordCard key={c.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="min-w-0 font-medium [overflow-wrap:anywhere] text-ink">
                                        {c.name}
                                    </p>
                                    <StatusPill active={c.is_open}>
                                        {c.is_open ? 'Abierta' : 'Cerrada'}
                                    </StatusPill>
                                </div>
                                <div className="mt-3 border-t border-[rgba(26,24,48,0.08)] pt-2">
                                    <CardField label="Desde">
                                        <span className="font-mono text-xs text-ink-50">
                                            {formatDate(c.starts_at)}
                                        </span>
                                    </CardField>
                                    <CardField label="Hasta">
                                        <span className="font-mono text-xs text-ink-50">
                                            {formatDate(c.ends_at)}
                                        </span>
                                    </CardField>
                                    <CardField label="Respuestas">
                                        {c.submissions_count}
                                    </CardField>
                                </div>
                                <CardActions>
                                    <CampaignActions
                                        campaign={c}
                                        hasOpen={hasOpen}
                                    />
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}
        </AdminShell>
    );
}
