import { useForm } from '@inertiajs/react';

interface Range {
    min_points: number;
    max_points: number;
    result_text: string;
}
interface Props {
    evaluation: { id: number; name: string; max_points: number; locked: boolean; ranges: Range[] };
}

export default function RangesEdit({ evaluation }: Props) {
    const { data, setData, put, processing, errors } = useForm<{ ranges: Range[] }>({
        ranges: evaluation.ranges.length ? evaluation.ranges : [{ min_points: 0, max_points: evaluation.max_points, result_text: '' }],
    });

    const update = (i: number, key: keyof Range, value: string) => {
        const next = [...data.ranges];
        next[i] = { ...next[i], [key]: key === 'result_text' ? value : Number(value) };
        setData('ranges', next);
    };

    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold">Rangos — {evaluation.name}</h1>
            <p className="mb-4 text-sm text-gray-500">
                Puntaje máximo posible: {evaluation.max_points}. Los rangos deben cubrir de 0 a {evaluation.max_points} sin huecos ni solapes.
            </p>

            {evaluation.locked && <p className="mb-4 rounded bg-yellow-100 p-2 text-sm">Bloqueado: hay una campaña abierta que usa esta evaluación.</p>}
            {errors.ranges && <p className="mb-4 text-sm text-red-600">{errors.ranges}</p>}

            <div className="flex flex-col gap-2">
                {data.ranges.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input type="number" value={r.min_points} onChange={(e) => update(i, 'min_points', e.target.value)} className="w-20 rounded border p-2" />
                        <span>–</span>
                        <input type="number" value={r.max_points} onChange={(e) => update(i, 'max_points', e.target.value)} className="w-20 rounded border p-2" />
                        <input value={r.result_text} onChange={(e) => update(i, 'result_text', e.target.value)} placeholder="Texto de resultado" className="flex-1 rounded border p-2" />
                        <button onClick={() => setData('ranges', data.ranges.filter((_, j) => j !== i))} className="text-red-600">
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                <button onClick={() => setData('ranges', [...data.ranges, { min_points: 0, max_points: 0, result_text: '' }])} className="rounded border px-3 py-2">
                    Agregar rango
                </button>
                <button
                    disabled={processing || evaluation.locked}
                    onClick={() => put(`/admin/evaluations/${evaluation.id}/ranges`)}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    Guardar
                </button>
            </div>
        </div>
    );
}
