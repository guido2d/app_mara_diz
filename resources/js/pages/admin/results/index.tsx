import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    CardActions,
    CardList,
    DataTable,
    RecordCard,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface Result {
    evaluation: string;
    total_points: number;
}
interface Row {
    id: number;
    name: string;
    work_email: string;
    submitted_at: string;
    results: Result[];
}
interface Props {
    campaign: { id: number; name: string; form_id: number; form_name: string };
    submissions: Row[];
}

export default function ResultsIndex({ campaign, submissions }: Props) {
    const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        router.delete(`/admin/submissions/${pendingDelete.id}`, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => setPendingDelete(null),
        });
    };

    return (
        <AdminShell title={`Resultados — ${campaign.form_name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Formularios', href: '/admin/forms' },
                    {
                        label: campaign.form_name,
                        href: `/admin/forms/${campaign.form_id}/campaigns`,
                    },
                    { label: `Resultados · ${campaign.name}` },
                ]}
            />
            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    Resultados — {campaign.form_name}
                </h1>
                <p className="mt-1 text-sm text-ink-50">
                    {campaign.name} ·{' '}
                    <span className="font-medium text-ink">
                        {submissions.length}
                    </span>{' '}
                    respuestas
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Esta campaña todavía no tiene respuestas.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Empleado</Th>
                                <Th>Email</Th>
                                <Th>Resultados</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((s) => (
                                <Tr key={s.id} className="align-top">
                                    <Td className="font-medium">{s.name}</Td>
                                    <Td className="text-ink-50">
                                        {s.work_email}
                                    </Td>
                                    <Td>
                                        <div className="flex flex-col gap-1">
                                            {s.results.map((r, i) => (
                                                <span
                                                    key={i}
                                                    className="text-sm"
                                                >
                                                    <span className="text-ink-50">
                                                        {r.evaluation}:
                                                    </span>{' '}
                                                    <strong className="font-mono text-ink">
                                                        {r.total_points} pts
                                                    </strong>
                                                </span>
                                            ))}
                                        </div>
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <Link
                                                href={`/admin/submissions/${s.id}`}
                                                className="text-sm font-medium text-indigo hover:underline"
                                            >
                                                Ver detalle
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPendingDelete(s)
                                                }
                                                className="cursor-pointer text-sm font-medium text-danger hover:underline"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {submissions.map((s) => (
                            <RecordCard key={s.id}>
                                <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                    {s.name}
                                </p>
                                <p className="mt-0.5 text-sm [overflow-wrap:anywhere] text-ink-50">
                                    {s.work_email}
                                </p>
                                <div className="mt-3 flex flex-col gap-1 border-t border-[rgba(26,24,48,0.08)] pt-3">
                                    {s.results.map((r, i) => (
                                        <span
                                            key={i}
                                            className="flex items-baseline justify-between gap-3 text-sm"
                                        >
                                            <span className="text-ink-50">
                                                {r.evaluation}
                                            </span>
                                            <strong className="font-mono text-ink">
                                                {r.total_points} pts
                                            </strong>
                                        </span>
                                    ))}
                                </div>
                                <CardActions>
                                    <Link
                                        href={`/admin/submissions/${s.id}`}
                                        className="text-indigo hover:underline"
                                    >
                                        Ver detalle
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(s)}
                                        className="cursor-pointer text-danger hover:underline"
                                    >
                                        Eliminar
                                    </button>
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                processing={processing}
                title="Eliminar respuesta"
                confirmLabel="Eliminar respuesta"
                description={
                    pendingDelete && (
                        <>
                            Se eliminará la respuesta de{' '}
                            <strong className="font-semibold text-ink">
                                {pendingDelete.name}
                            </strong>{' '}
                            junto con sus resultados. Esta acción no se puede
                            deshacer.
                        </>
                    )
                }
            />
        </AdminShell>
    );
}
