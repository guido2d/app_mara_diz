import { Form, Link } from '@inertiajs/react';

interface EvaluationOption {
    id: number;
    name: string;
}
interface Props {
    form: { id: number; name: string; description: string | null; evaluation_ids: number[] };
    evaluations: EvaluationOption[];
}

export default function FormEdit({ form, evaluations }: Props) {
    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Editar formulario</h1>
            <Form action={`/admin/forms/${form.id}`} method="put" className="flex flex-col gap-3">
                {({ errors, processing }) => (
                    <>
                        <input name="name" defaultValue={form.name} required className="rounded border border-gray-300 p-2" />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        <textarea name="description" defaultValue={form.description ?? ''} className="rounded border border-gray-300 p-2" />
                        <fieldset className="flex flex-col gap-1">
                            <legend className="text-sm font-medium">Evaluaciones que lo componen</legend>
                            {evaluations.map((e) => (
                                <label key={e.id} className="flex items-center gap-2">
                                    <input type="checkbox" name="evaluation_ids[]" value={e.id} defaultChecked={form.evaluation_ids.includes(e.id)} />
                                    {e.name}
                                </label>
                            ))}
                        </fieldset>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white">
                                Guardar
                            </button>
                            <Link href="/admin/forms" className="px-4 py-2">
                                Cancelar
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}
