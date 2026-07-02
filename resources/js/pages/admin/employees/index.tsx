import { Link } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
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

interface Employee {
    email: string;
    name: string;
    campaigns_answered: number;
    last_submitted_at: string;
}
interface Props {
    form: { id: number; name: string };
    employees: Employee[];
}

export default function EmployeesIndex({ form, employees }: Props) {
    return (
        <AdminShell title={`Comparativo — ${form.name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Formularios', href: '/admin/forms' },
                    {
                        label: form.name,
                        href: `/admin/forms/${form.id}/campaigns`,
                    },
                    { label: 'Comparativo por empleado' },
                ]}
            />
            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    Comparativo por empleado
                </h1>
                <p className="mt-1 text-sm text-ink-50">
                    {form.name} ·{' '}
                    <span className="font-medium text-ink">
                        {employees.length}
                    </span>{' '}
                    {employees.length === 1 ? 'empleado' : 'empleados'}
                </p>
            </div>

            {employees.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay respuestas para este formulario.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Empleado</Th>
                                <Th>Email</Th>
                                <Th>Campañas respondidas</Th>
                                <Th>Última</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((e) => (
                                <Tr key={e.email}>
                                    <Td className="font-medium">{e.name}</Td>
                                    <Td className="text-ink-50">{e.email}</Td>
                                    <Td className="font-mono text-sm">
                                        {e.campaigns_answered}
                                    </Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {e.last_submitted_at}
                                    </Td>
                                    <Td className="text-right">
                                        <Link
                                            href={`/admin/forms/${form.id}/employees/compare?email=${encodeURIComponent(e.email)}`}
                                            className="text-sm font-medium text-indigo hover:underline"
                                        >
                                            Comparar
                                        </Link>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {employees.map((e) => (
                            <RecordCard key={e.email}>
                                <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                    {e.name}
                                </p>
                                <p className="mt-0.5 text-sm [overflow-wrap:anywhere] text-ink-50">
                                    {e.email}
                                </p>
                                <div className="mt-3 border-t border-[rgba(26,24,48,0.08)] pt-2">
                                    <CardField label="Campañas respondidas">
                                        <span className="font-mono">
                                            {e.campaigns_answered}
                                        </span>
                                    </CardField>
                                    <CardField label="Última">
                                        <span className="font-mono text-xs text-ink-50">
                                            {e.last_submitted_at}
                                        </span>
                                    </CardField>
                                </div>
                                <CardActions>
                                    <Link
                                        href={`/admin/forms/${form.id}/employees/compare?email=${encodeURIComponent(e.email)}`}
                                        className="text-indigo hover:underline"
                                    >
                                        Comparar
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
