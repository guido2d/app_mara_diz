import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Select } from '@/components/ui/field';
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
    form_id: number;
    form_name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
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

export default function CampaignsBoard({
    campaigns,
}: {
    campaigns: CampaignRow[];
}) {
    const [formFilter, setFormFilter] = useState('');
    const forms = Array.from(
        new Map(campaigns.map((c) => [c.form_id, c.form_name])).entries(),
    ).map(([id, name]) => ({ id, name }));
    const hasOpen = campaigns.some((c) => c.is_open);
    const rows = formFilter
        ? campaigns.filter((c) => String(c.form_id) === formFilter)
        : campaigns;

    return (
        <AdminShell title="Campañas">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Campañas
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Todas las campañas de todos los formularios en un solo
                        lugar.
                    </p>
                </div>
                {forms.length > 1 && (
                    <div className="w-full sm:w-56">
                        <Select
                            value={formFilter}
                            onChange={(e) => setFormFilter(e.target.value)}
                            aria-label="Filtrar por formulario"
                        >
                            <option value="">Todos los formularios</option>
                            {forms.map((f) => (
                                <option key={f.id} value={String(f.id)}>
                                    {f.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            {rows.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay campañas.</p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Formulario</Th>
                                <Th>Campaña</Th>
                                <Th>Desde</Th>
                                <Th>Hasta</Th>
                                <Th>Respuestas</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((c) => (
                                <Tr key={c.id}>
                                    <Td className="text-ink-50">
                                        {c.form_name}
                                    </Td>
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
                        {rows.map((c) => (
                            <RecordCard key={c.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                            {c.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-ink-50">
                                            {c.form_name}
                                        </p>
                                    </div>
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
