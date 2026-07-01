import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { AdminShell } from '@/layouts/admin-shell';

interface Range {
    min_points: number;
    max_points: number;
    result_text: string;
}
interface Props {
    evaluation: {
        id: number;
        name: string;
        max_points: number;
        locked: boolean;
        ranges: Range[];
    };
}

export default function RangesEdit({ evaluation }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        ranges: Range[];
    }>({
        ranges: evaluation.ranges.length
            ? evaluation.ranges
            : [
                  {
                      min_points: 0,
                      max_points: evaluation.max_points,
                      result_text: '',
                  },
              ],
    });

    const update = (i: number, key: keyof Range, value: string) => {
        const next = [...data.ranges];
        next[i] = {
            ...next[i],
            [key]: key === 'result_text' ? value : Number(value),
        };
        setData('ranges', next);
    };

    return (
        <AdminShell title={`Rangos — ${evaluation.name}`}>
            <div className="mx-auto max-w-2xl">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    Rangos — {evaluation.name}
                </h1>
                <p className="mt-1 mb-6 text-sm text-ink-50">
                    Puntaje máximo posible:{' '}
                    <span className="font-medium text-ink">
                        {evaluation.max_points}
                    </span>
                    . Los rangos deben cubrir de 0 a {evaluation.max_points} sin
                    huecos ni solapes.
                </p>

                {evaluation.locked && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[rgba(26,24,48,0.12)] bg-ink/6 p-4 text-sm text-ink">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-0.5 size-4 shrink-0 text-indigo"
                            aria-hidden="true"
                        >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                        </svg>
                        <span>
                            Bloqueado: hay una campaña abierta que usa esta
                            evaluación. Cerrala para poder editar los rangos.
                        </span>
                    </div>
                )}
                {errors.ranges && (
                    <p className="mb-5 text-sm text-danger">{errors.ranges}</p>
                )}

                <GlassCard>
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-[5rem_1rem_5rem_1fr_2rem] items-center gap-2 px-1 font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                            <span>Desde</span>
                            <span />
                            <span>Hasta</span>
                            <span>Texto de resultado</span>
                            <span />
                        </div>
                        {data.ranges.map((r, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[5rem_1rem_5rem_1fr_2rem] items-center gap-2"
                            >
                                <input
                                    type="number"
                                    value={r.min_points}
                                    onChange={(e) =>
                                        update(i, 'min_points', e.target.value)
                                    }
                                    className="field"
                                />
                                <span className="text-center text-ink-50">
                                    –
                                </span>
                                <input
                                    type="number"
                                    value={r.max_points}
                                    onChange={(e) =>
                                        update(i, 'max_points', e.target.value)
                                    }
                                    className="field"
                                />
                                <input
                                    value={r.result_text}
                                    onChange={(e) =>
                                        update(i, 'result_text', e.target.value)
                                    }
                                    placeholder="Ej. Nivel de estrés bajo"
                                    className="field"
                                />
                                <button
                                    onClick={() =>
                                        setData(
                                            'ranges',
                                            data.ranges.filter(
                                                (_, j) => j !== i,
                                            ),
                                        )
                                    }
                                    aria-label="Quitar rango"
                                    className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-50 transition-colors duration-200 hover:bg-danger/10 hover:text-danger"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="size-4"
                                        aria-hidden="true"
                                    >
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() =>
                                setData('ranges', [
                                    ...data.ranges,
                                    {
                                        min_points: 0,
                                        max_points: 0,
                                        result_text: '',
                                    },
                                ])
                            }
                        >
                            Agregar rango
                        </Button>
                        <Button
                            disabled={processing || evaluation.locked}
                            onClick={() =>
                                put(
                                    `/admin/evaluations/${evaluation.id}/ranges`,
                                )
                            }
                        >
                            {processing ? 'Guardando…' : 'Guardar'}
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
