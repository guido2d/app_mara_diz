import { Form, Link } from '@inertiajs/react';
import { Button, buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label, Textarea } from '@/components/ui/field';
import { AdminShell } from '@/layouts/admin-shell';

interface EvaluationOption {
    id: number;
    name: string;
}

/** Texto que se precarga en la descripción de todo formulario nuevo. */
const DEFAULT_DESCRIPTION = `A continuación encontrará cinco evaluaciones que le ayudarán a identificar algunos síntomas que pueden ser consecuencia del estrés sostenido. Sea franco/a en sus respuestas. Este registro será revisado exclusivamente por mí guardando **absoluta confidencialidad**. La empresa solo recibirá un informe general con la cantidad de síntomas promedio por persona sin ningún tipo de individualización.  **Solo si usted lo autoriza al final de la hoja este registro podrá ser leído por el Servicio de Salud**.

Pasado un tiempo de terminado el programa le volveré a enviar las 4 primeras tablas para evaluar los cambios que se hayan producido y acordaremos un encuentro virtual para hacerle sugerencias con el objetivo de seguir introduciendo cambios saludables en su vida.`;

export default function FormCreate({
    evaluations,
}: {
    evaluations: EvaluationOption[];
}) {
    return (
        <AdminShell title="Nuevo formulario">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
                    Nuevo formulario
                </h1>
                <GlassCard>
                    <Form
                        action="/admin/forms"
                        method="post"
                        className="flex flex-col gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" name="name" required />
                                    <FieldError>{errors.name}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="description">
                                        Descripción (opcional)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        rows={10}
                                        defaultValue={DEFAULT_DESCRIPTION}
                                    />
                                    <p className="text-xs text-ink-50">
                                        Usá{' '}
                                        <code className="rounded bg-ink/6 px-1 font-mono">
                                            **texto**
                                        </code>{' '}
                                        para resaltar en negrita. Los saltos de
                                        línea se respetan.
                                    </p>
                                </div>
                                <fieldset className="flex flex-col gap-2">
                                    <legend className="mb-1 text-sm font-medium text-ink">
                                        Evaluaciones que lo componen
                                    </legend>
                                    {evaluations.map((e) => (
                                        <label
                                            key={e.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(26,24,48,0.1)] bg-white/50 px-3.5 py-2.5 text-sm text-ink transition-colors duration-200 hover:border-[rgba(61,58,138,0.4)] has-[:checked]:border-indigo has-[:checked]:bg-indigo/8"
                                        >
                                            <input
                                                type="checkbox"
                                                name="evaluation_ids[]"
                                                value={e.id}
                                                defaultChecked
                                                className="size-4 accent-indigo"
                                            />
                                            {e.name}
                                        </label>
                                    ))}
                                </fieldset>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando…' : 'Guardar'}
                                    </Button>
                                    <Link
                                        href="/admin/forms"
                                        className={buttonClass('ghost')}
                                    >
                                        Cancelar
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
