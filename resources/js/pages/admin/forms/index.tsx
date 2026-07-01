import { Link, router } from '@inertiajs/react';

interface FormRow {
    id: number;
    name: string;
    slug: string;
    evaluations_count: number;
    is_active: boolean;
}

export default function FormsIndex({ forms }: { forms: FormRow[] }) {
    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Formularios</h1>
                <Link href="/admin/forms/create" className="rounded bg-black px-3 py-2 text-sm text-white">
                    Nuevo formulario
                </Link>
            </div>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Nombre</th>
                        <th>Evaluaciones</th>
                        <th>Estado</th>
                        <th>Link público</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map((form) => (
                        <tr key={form.id} className="border-b">
                            <td className="py-2">{form.name}</td>
                            <td>{form.evaluations_count}</td>
                            <td>{form.is_active ? 'Activo' : 'Inactivo'}</td>
                            <td>
                                <code>/f/{form.slug}</code>
                            </td>
                            <td className="flex gap-2">
                                <Link href={`/admin/forms/${form.id}/edit`} className="text-blue-600">
                                    Editar
                                </Link>
                                <Link href={`/admin/forms/${form.id}/campaigns`} className="text-blue-600">
                                    Campañas
                                </Link>
                                <button onClick={() => router.delete(`/admin/forms/${form.id}`)} className="text-red-600">
                                    Borrar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
