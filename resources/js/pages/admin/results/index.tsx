import { Link } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { DataTable, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
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
    return (
        <AdminShell title={`Resultados — ${campaign.form_name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Formularios', href: '/admin/forms' },
                    { label: campaign.form_name, href: `/admin/forms/${campaign.form_id}/campaigns` },
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
                                <Td className="text-ink-50">{s.work_email}</Td>
                                <Td>
                                    <div className="flex flex-col gap-1">
                                        {s.results.map((r, i) => (
                                            <span key={i} className="text-sm">
                                                <span className="text-ink-50">
                                                    {r.evaluation}:
                                                </span>{' '}
                                                <strong className="text-ink">
                                                    {r.result_text}
                                                </strong>{' '}
                                                <span className="font-mono text-xs text-ink-50">
                                                    ({r.total_points})
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </Td>
                                <Td className="text-right">
                                    <Link
                                        href={`/admin/submissions/${s.id}`}
                                        className="text-sm font-medium text-indigo hover:underline"
                                    >
                                        Ver detalle
                                    </Link>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}
        </AdminShell>
    );
}
