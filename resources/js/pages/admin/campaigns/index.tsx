import { Form, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
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
    form: { id: number; name: string };
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
                    onClick={() => {
                        if (confirm(`¿Cerrar la campaña “${campaign.name}”?`)) {
                            router.post(
                                `/admin/campaigns/${campaign.id}/close`,
                            );
                        }
                    }}
                    className="cursor-pointer text-danger hover:underline"
                >
                    Cerrar
                </button>
            )}
            {!campaign.is_open && !hasOpen && (
                <button
                    onClick={() => {
                        if (
                            confirm(`¿Reabrir la campaña “${campaign.name}”?`)
                        ) {
                            router.post(
                                `/admin/campaigns/${campaign.id}/reopen`,
                            );
                        }
                    }}
                    className="cursor-pointer text-indigo hover:underline"
                >
                    Reabrir
                </button>
            )}
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
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                    Campañas — {form.name}
                </h1>
                <p className="mt-1 text-sm text-ink-50">
                    Cada campaña abre una ronda de respuestas. Solo puede haber
                    una campaña abierta por vez.
                </p>
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
