import { Link } from '@inertiajs/react';
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

interface FormRow {
    id: number;
    name: string;
    campaigns_count: number;
    submissions_count: number;
}

interface Props {
    title: string;
    description: string;
    action: string;
    suffix: string;
    forms: FormRow[];
}

export default function FormPicker({
    title,
    description,
    action,
    suffix,
    forms,
}: Props) {
    const linkFor = (form: FormRow) => `${action}/${form.id}/${suffix}`;

    return (
        <AdminShell title={title}>
            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    {title}
                </h1>
                <p className="mt-1 text-sm text-ink-50">{description}</p>
            </div>

            {forms.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay formularios. Creá el primero desde la
                        sección Formularios.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Formulario</Th>
                                <Th>Campañas</Th>
                                <Th>Respuestas</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map((form) => (
                                <Tr key={form.id}>
                                    <Td className="font-medium">{form.name}</Td>
                                    <Td className="font-mono">
                                        {form.campaigns_count}
                                    </Td>
                                    <Td className="font-mono">
                                        {form.submissions_count}
                                    </Td>
                                    <Td>
                                        <div className="flex justify-end text-sm font-medium">
                                            <Link
                                                href={linkFor(form)}
                                                className="text-indigo hover:underline"
                                            >
                                                Ver
                                            </Link>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {forms.map((form) => (
                            <RecordCard key={form.id}>
                                <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                    {form.name}
                                </p>
                                <p className="mt-0.5 text-xs text-ink-50">
                                    {form.campaigns_count}{' '}
                                    {form.campaigns_count === 1
                                        ? 'campaña'
                                        : 'campañas'}{' '}
                                    · {form.submissions_count}{' '}
                                    {form.submissions_count === 1
                                        ? 'respuesta'
                                        : 'respuestas'}
                                </p>
                                <CardActions>
                                    <Link
                                        href={linkFor(form)}
                                        className="text-indigo hover:underline"
                                    >
                                        Ver
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
