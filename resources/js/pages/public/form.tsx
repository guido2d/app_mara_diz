import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label, Select } from '@/components/ui/field';
import { PublicShell } from '@/layouts/public-shell';

interface Option {
    id: number;
    label: string;
}
interface Question {
    id: number;
    label: string;
    type: 'input' | 'select' | 'radio' | 'date' | 'textarea';
    required: boolean;
    options: Option[];
}
interface Evaluation {
    id: number;
    name: string;
    description: string | null;
    questions: Question[];
}
interface Props {
    form: { name: string; slug: string };
    campaign: { id: number; name: string };
    evaluations: Evaluation[];
}

function QuestionField({ question }: { question: Question }) {
    const name = `answers[${question.id}]`;

    if (question.type === 'radio') {
        return (
            <fieldset className="flex flex-col gap-2">
                {question.options.map((o) => (
                    <label
                        key={o.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(26,24,48,0.1)] bg-white/50 px-3.5 py-2.5 text-sm text-ink transition-colors duration-200 hover:border-[rgba(61,58,138,0.4)] has-[:checked]:border-indigo has-[:checked]:bg-indigo/8"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={o.id}
                            required={question.required}
                            className="size-4 accent-indigo"
                        />
                        {o.label}
                    </label>
                ))}
            </fieldset>
        );
    }

    if (question.type === 'select') {
        return (
            <Select name={name} required={question.required} defaultValue="">
                <option value="" disabled>
                    Elegí una opción
                </option>
                {question.options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </Select>
        );
    }

    if (question.type === 'textarea') {
        return (
            <textarea
                name={name}
                required={question.required}
                className="field"
                rows={3}
            />
        );
    }

    return (
        <Input
            type={question.type === 'date' ? 'date' : 'text'}
            name={name}
            required={question.required}
        />
    );
}

export default function PublicForm({ form, campaign, evaluations }: Props) {
    return (
        <PublicShell title={form.name}>
            <div className="w-full max-w-2xl">
                <header className="mb-8 px-1">
                    <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink-50 uppercase">
                        {campaign.name}
                    </p>
                    <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
                        {form.name}
                    </h1>
                </header>

                <Form
                    action={`/f/${form.slug}`}
                    method="post"
                    className="flex flex-col gap-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <GlassCard>
                                <h2 className="mb-1 text-lg font-semibold text-ink">
                                    Tus datos
                                </h2>
                                <p className="mb-5 text-sm text-ink-50">
                                    Nos ayudan a interpretar los resultados de
                                    forma agrupada y confidencial.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Nombre">
                                        <Input name="first_name" required />
                                    </Field>
                                    <Field label="Apellido">
                                        <Input name="last_name" required />
                                    </Field>
                                    <Field
                                        label="Función que desempeñás"
                                        className="sm:col-span-2"
                                    >
                                        <Input name="role_function" required />
                                    </Field>
                                    <Field label="Edad">
                                        <Input
                                            name="age"
                                            type="number"
                                            min={16}
                                            max={99}
                                            required
                                        />
                                    </Field>
                                    <Field label="Sexo">
                                        <Select
                                            name="sex"
                                            required
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                Elegí una opción
                                            </option>
                                            <option value="femenino">
                                                Femenino
                                            </option>
                                            <option value="masculino">
                                                Masculino
                                            </option>
                                            <option value="otro">
                                                Otro / Prefiere no decir
                                            </option>
                                        </Select>
                                    </Field>
                                    <Field label="Estado civil">
                                        <Select
                                            name="marital_status"
                                            required
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                Elegí una opción
                                            </option>
                                            <option value="soltero">
                                                Soltero/a
                                            </option>
                                            <option value="en_pareja">
                                                En pareja
                                            </option>
                                            <option value="casado">
                                                Casado/a
                                            </option>
                                            <option value="divorciado">
                                                Divorciado/a
                                            </option>
                                            <option value="viudo">
                                                Viudo/a
                                            </option>
                                        </Select>
                                    </Field>
                                    <Field label="Cantidad de hijos">
                                        <Input
                                            name="children_count"
                                            type="number"
                                            min={0}
                                            max={20}
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Grupo de convivencia"
                                        className="sm:col-span-2"
                                    >
                                        <Select
                                            name="cohabitation_group"
                                            required
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                Elegí una opción
                                            </option>
                                            <option value="solo">Solo/a</option>
                                            <option value="con_pareja">
                                                Con pareja
                                            </option>
                                            <option value="con_pareja_e_hijos">
                                                Con pareja e hijos
                                            </option>
                                            <option value="con_hijos">
                                                Con hijos
                                            </option>
                                            <option value="con_padres_familia">
                                                Con padres/familia
                                            </option>
                                            <option value="con_companeros_otros">
                                                Con compañeros/otros
                                            </option>
                                        </Select>
                                    </Field>
                                    <Field label="Email laboral">
                                        <Input
                                            name="work_email"
                                            type="email"
                                            required
                                        />
                                    </Field>
                                    <Field label="Celular">
                                        <Input name="phone" required />
                                    </Field>
                                </div>
                                <div className="mt-3">
                                    <FieldError>{errors.work_email}</FieldError>
                                </div>
                            </GlassCard>

                            {evaluations.map((evaluation) => (
                                <GlassCard key={evaluation.id}>
                                    <h2 className="text-lg font-semibold text-ink">
                                        {evaluation.name}
                                    </h2>
                                    {evaluation.description && (
                                        <p className="mt-1 mb-1 text-sm text-ink-50">
                                            {evaluation.description}
                                        </p>
                                    )}
                                    <div className="mt-5 flex flex-col gap-5">
                                        {evaluation.questions.map(
                                            (question) => (
                                                <div
                                                    key={question.id}
                                                    className="flex flex-col gap-2"
                                                >
                                                    <Label>
                                                        {question.label}{' '}
                                                        {question.required && (
                                                            <span className="text-indigo">
                                                                *
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <QuestionField
                                                        question={question}
                                                    />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </GlassCard>
                            ))}

                            <div className="flex items-center justify-end gap-4 px-1">
                                <p className="text-sm text-ink-50">
                                    Tus respuestas son confidenciales.
                                </p>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Enviando…'
                                        : 'Enviar respuestas'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </PublicShell>
    );
}

function Field({
    label,
    className,
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
            <Label>{label}</Label>
            {children}
        </div>
    );
}
