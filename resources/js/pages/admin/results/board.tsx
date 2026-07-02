import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Select } from '@/components/ui/field';
import {
    CardActions,
    CardField,
    CardList,
    DataTable,
    RecordCard,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface SubmissionRow {
    id: number;
    name: string;
    work_email: string;
    form_name: string;
    campaign_name: string;
    submitted_at: string;
    total_points: number;
}

export default function ResultsBoard({
    submissions,
}: {
    submissions: SubmissionRow[];
}) {
    const [formFilter, setFormFilter] = useState('');
    const forms = Array.from(new Set(submissions.map((s) => s.form_name)));
    const rows = formFilter
        ? submissions.filter((s) => s.form_name === formFilter)
        : submissions;

    return (
        <AdminShell title="Resultados">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Resultados
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Todas las respuestas recibidas, de todas las campañas.
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
                            {forms.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            {rows.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay respuestas.</p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Formulario</Th>
                                <Th>Campaña</Th>
                                <Th>Empleado</Th>
                                <Th>Email</Th>
                                <Th>Fecha</Th>
                                <Th>Puntaje</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => (
                                <Tr key={s.id}>
                                    <Td className="text-ink-50">
                                        {s.form_name}
                                    </Td>
                                    <Td className="text-ink-50">
                                        {s.campaign_name}
                                    </Td>
                                    <Td className="font-medium">{s.name}</Td>
                                    <Td className="text-ink-50">
                                        {s.work_email}
                                    </Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {s.submitted_at}
                                    </Td>
                                    <Td>{s.total_points}</Td>
                                    <Td>
                                        <div className="flex items-center justify-end text-sm font-medium">
                                            <Link
                                                href={`/admin/submissions/${s.id}`}
                                                className="text-indigo hover:underline"
                                            >
                                                Ver detalle
                                            </Link>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {rows.map((s) => (
                            <RecordCard key={s.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                            {s.name}
                                        </p>
                                        <p className="mt-0.5 text-xs [overflow-wrap:anywhere] text-ink-50">
                                            {s.work_email}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-indigo/10 px-2.5 py-1 font-mono text-xs font-semibold text-indigo">
                                        {s.total_points} pts
                                    </span>
                                </div>
                                <div className="mt-3 border-t border-[rgba(26,24,48,0.08)] pt-2">
                                    <CardField label="Formulario">
                                        {s.form_name}
                                    </CardField>
                                    <CardField label="Campaña">
                                        {s.campaign_name}
                                    </CardField>
                                    <CardField label="Fecha">
                                        <span className="font-mono text-xs text-ink-50">
                                            {s.submitted_at}
                                        </span>
                                    </CardField>
                                </div>
                                <CardActions>
                                    <Link
                                        href={`/admin/submissions/${s.id}`}
                                        className="text-indigo hover:underline"
                                    >
                                        Ver detalle
                                    </Link>
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}
        </AdminShell>
    );
}
