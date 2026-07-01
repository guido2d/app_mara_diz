import { Link, router } from '@inertiajs/react';
import { buttonClass } from '@/components/ui/button';
import { DataTable, StatusPill, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface FormRow {
    id: number;
    name: string;
    slug: string;
    evaluations_count: number;
    is_active: boolean;
}

export default function FormsIndex({ forms }: { forms: FormRow[] }) {
    return (
        <AdminShell title="Formularios">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Formularios
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Componé formularios a partir de evaluaciones y gestioná
                        sus campañas.
                    </p>
                </div>
                <Link
                    href="/admin/forms/create"
                    className={buttonClass('primary')}
                >
                    Nuevo formulario
                </Link>
            </div>

            {forms.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay formularios. Creá el primero para
                        empezar.
                    </p>
                </div>
            ) : (
                <DataTable>
                    <thead>
                        <tr>
                            <Th>Nombre</Th>
                            <Th>Evaluaciones</Th>
                            <Th>Estado</Th>
                            <Th>Link público</Th>
                            <Th className="text-right">Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.map((form) => (
                            <Tr key={form.id}>
                                <Td className="font-medium">{form.name}</Td>
                                <Td>{form.evaluations_count}</Td>
                                <Td>
                                    <StatusPill active={form.is_active}>
                                        {form.is_active ? 'Activo' : 'Inactivo'}
                                    </StatusPill>
                                </Td>
                                <Td>
                                    <code className="rounded-md bg-ink/6 px-2 py-1 font-mono text-xs text-ink-50">
                                        /f/{form.slug}
                                    </code>
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                        <Link
                                            href={`/admin/forms/${form.id}/edit`}
                                            className="text-indigo hover:underline"
                                        >
                                            Editar
                                        </Link>
                                        <Link
                                            href={`/admin/forms/${form.id}/campaigns`}
                                            className="text-indigo hover:underline"
                                        >
                                            Campañas
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `¿Borrar el formulario “${form.name}”?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/admin/forms/${form.id}`,
                                                    );
                                                }
                                            }}
                                            className="cursor-pointer text-danger hover:underline"
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}
        </AdminShell>
    );
}
