import { Form, router } from '@inertiajs/react';

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

export default function CampaignsIndex({ form, campaigns }: Props) {
    const hasOpen = campaigns.some((c) => c.is_open);

    return (
        <div className="mx-auto max-w-3xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Campañas — {form.name}</h1>

            {!hasOpen && (
                <Form action={`/admin/forms/${form.id}/campaigns`} method="post" className="mb-6 flex flex-wrap items-end gap-2 rounded border p-4">
                    {({ errors, processing }) => (
                        <>
                            <input name="name" placeholder="Nombre (Q1 2026)" required className="rounded border border-gray-300 p-2" />
                            <input name="starts_at" type="date" required className="rounded border border-gray-300 p-2" />
                            <input name="ends_at" type="date" required className="rounded border border-gray-300 p-2" />
                            <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white">
                                Abrir campaña
                            </button>
                            {errors.name && <p className="w-full text-sm text-red-600">{errors.name}</p>}
                        </>
                    )}
                </Form>
            )}

            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Nombre</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Envíos</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((c) => (
                        <tr key={c.id} className="border-b">
                            <td className="py-2">{c.name}</td>
                            <td>{c.starts_at}</td>
                            <td>{c.ends_at}</td>
                            <td>{c.submissions_count}</td>
                            <td>{c.is_open ? 'Abierta' : 'Cerrada'}</td>
                            <td>
                                {c.is_open && (
                                    <button onClick={() => router.post(`/admin/campaigns/${c.id}/close`)} className="text-red-600">
                                        Cerrar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
