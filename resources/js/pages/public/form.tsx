import { useForm } from '@inertiajs/react';
import { useState  } from 'react';
import type {ReactNode} from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label, Select } from '@/components/ui/field';
import { PublicShell } from '@/layouts/public-shell';
import { cn } from '@/lib/utils';

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
    form: { name: string; slug: string; description: string | null };
    campaign: { id: number; name: string };
    evaluations: Evaluation[];
}

type ProfileKey =
    | 'first_name'
    | 'last_name'
    | 'role_function'
    | 'age'
    | 'sex'
    | 'marital_status'
    | 'children_count'
    | 'cohabitation_group'
    | 'work_email'
    | 'phone';

const PROFILE_KEYS: ProfileKey[] = [
    'first_name',
    'last_name',
    'role_function',
    'age',
    'sex',
    'marital_status',
    'children_count',
    'cohabitation_group',
    'work_email',
    'phone',
];

interface FormData {
    first_name: string;
    last_name: string;
    role_function: string;
    age: string;
    sex: string;
    marital_status: string;
    children_count: string;
    cohabitation_group: string;
    work_email: string;
    phone: string;
    answers: Record<number, string>;
}

export default function PublicForm({ form, campaign, evaluations }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        first_name: '',
        last_name: '',
        role_function: '',
        age: '',
        sex: '',
        marital_status: '',
        children_count: '',
        cohabitation_group: '',
        work_email: '',
        phone: '',
        answers: {},
    });

    const totalSteps = 1 + evaluations.length;
    const [step, setStep] = useState(0);
    const [attempted, setAttempted] = useState(false);

    const setAnswer = (id: number, value: string) => setData('answers', { ...data.answers, [id]: value });
    const isBlank = (value: string | undefined) => (value ?? '').trim() === '';

    /** Which wizard step a given server-side validation key belongs to. */
    const stepForErrorKey = (key: string): number => {
        if (PROFILE_KEYS.includes(key as ProfileKey)) {
            return 0;
        }

        const match = key.match(/^answers\.(\d+)$/);

        if (match) {
            const questionId = Number(match[1]);
            const index = evaluations.findIndex((e) => e.questions.some((q) => q.id === questionId));

            if (index >= 0) {
                return index + 1;
            }
        }

        return 0;
    };

    const stepIsComplete = (s: number): boolean => {
        if (s === 0) {
            return PROFILE_KEYS.every((key) => !isBlank(data[key]));
        }

        return evaluations[s - 1].questions.every((q) => !q.required || !isBlank(data.answers[q.id]));
    };

    const goTo = (next: number) => {
        setAttempted(false);
        setStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        setAttempted(true);

        if (stepIsComplete(step)) {
            goTo(step + 1);
        }
    };

    const handleSubmit = () => {
        setAttempted(true);

        if (!stepIsComplete(step)) {
            return;
        }

        post(`/f/${form.slug}`, {
            onError: (serverErrors) => {
                const firstKey = Object.keys(serverErrors)[0];

                if (firstKey) {
                    setStep(stepForErrorKey(firstKey));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
        });
    };

    const stepTitle = step === 0 ? 'Tus datos' : evaluations[step - 1].name;

    return (
        <PublicShell title={form.name}>
            <div className="w-full max-w-2xl">
                <header className="mb-6 px-1">
                    <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink-50 uppercase">{campaign.name}</p>
                    <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">{form.name}</h1>
                    {form.description && <p className="mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-ink-50">{form.description}</p>}
                </header>

                <div className="mb-6 px-1">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-mono text-[11px] tracking-[0.08em] text-ink-50 uppercase">
                            Paso {step + 1} de {totalSteps}
                        </span>
                        <span className="font-medium text-ink">{stepTitle}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink/8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
                        <div className="h-full rounded-full bg-indigo transition-all duration-500" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    {step === 0 ? (
                        <GlassCard>
                            <h2 className="mb-1 text-lg font-semibold text-ink">Tus datos</h2>
                            <p className="mb-5 text-sm text-ink-50">Nos ayudan a interpretar los resultados de forma agrupada y confidencial.</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Nombre" invalid={attempted && isBlank(data.first_name)}>
                                    <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                </Field>
                                <Field label="Apellido" invalid={attempted && isBlank(data.last_name)}>
                                    <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                </Field>
                                <Field label="Función que desempeñás" className="sm:col-span-2" invalid={attempted && isBlank(data.role_function)}>
                                    <Input value={data.role_function} onChange={(e) => setData('role_function', e.target.value)} />
                                </Field>
                                <Field label="Edad" invalid={attempted && isBlank(data.age)}>
                                    <Input type="number" min={16} max={99} value={data.age} onChange={(e) => setData('age', e.target.value)} />
                                </Field>
                                <Field label="Sexo" invalid={attempted && isBlank(data.sex)}>
                                    <Select value={data.sex} onChange={(e) => setData('sex', e.target.value)}>
                                        <option value="" disabled>
                                            Elegí una opción
                                        </option>
                                        <option value="femenino">Femenino</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="otro">Otro / Prefiere no decir</option>
                                    </Select>
                                </Field>
                                <Field label="Estado civil" invalid={attempted && isBlank(data.marital_status)}>
                                    <Select value={data.marital_status} onChange={(e) => setData('marital_status', e.target.value)}>
                                        <option value="" disabled>
                                            Elegí una opción
                                        </option>
                                        <option value="soltero">Soltero/a</option>
                                        <option value="en_pareja">En pareja</option>
                                        <option value="casado">Casado/a</option>
                                        <option value="divorciado">Divorciado/a</option>
                                        <option value="viudo">Viudo/a</option>
                                    </Select>
                                </Field>
                                <Field label="Cantidad de hijos" invalid={attempted && isBlank(data.children_count)}>
                                    <Input type="number" min={0} max={20} value={data.children_count} onChange={(e) => setData('children_count', e.target.value)} />
                                </Field>
                                <Field label="Grupo de convivencia" className="sm:col-span-2" invalid={attempted && isBlank(data.cohabitation_group)}>
                                    <Select value={data.cohabitation_group} onChange={(e) => setData('cohabitation_group', e.target.value)}>
                                        <option value="" disabled>
                                            Elegí una opción
                                        </option>
                                        <option value="solo">Solo/a</option>
                                        <option value="con_pareja">Con pareja</option>
                                        <option value="con_pareja_e_hijos">Con pareja e hijos</option>
                                        <option value="con_hijos">Con hijos</option>
                                        <option value="con_padres_familia">Con padres/familia</option>
                                        <option value="con_companeros_otros">Con compañeros/otros</option>
                                    </Select>
                                </Field>
                                <Field label="Email laboral" invalid={attempted && isBlank(data.work_email)}>
                                    <Input type="email" value={data.work_email} onChange={(e) => setData('work_email', e.target.value)} />
                                </Field>
                                <Field label="Celular" invalid={attempted && isBlank(data.phone)}>
                                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                </Field>
                            </div>
                            <div className="mt-3 space-y-1">
                                <FieldError>{errors.work_email}</FieldError>
                                {attempted && !stepIsComplete(0) && <p className="text-sm text-danger">Completá todos los campos para continuar.</p>}
                            </div>
                        </GlassCard>
                    ) : (
                        (() => {
                            const evaluation = evaluations[step - 1];

                            return (
                                <GlassCard>
                                    <h2 className="text-lg font-semibold text-ink">{evaluation.name}</h2>
                                    {evaluation.description && <p className="mt-1 text-sm text-ink-50">{evaluation.description}</p>}
                                    <div className="mt-5 flex flex-col gap-5">
                                        {evaluation.questions.map((question) => {
                                            const invalid = attempted && question.required && isBlank(data.answers[question.id]);

                                            return (
                                                <div key={question.id} className="flex flex-col gap-2">
                                                    <Label>
                                                        {question.label} {question.required && <span className="text-indigo">*</span>}
                                                    </Label>
                                                    <QuestionField
                                                        question={question}
                                                        value={data.answers[question.id] ?? ''}
                                                        invalid={invalid}
                                                        onChange={(v) => setAnswer(question.id, v)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {attempted && !stepIsComplete(step) && <p className="mt-4 text-sm text-danger">Respondé todas las preguntas obligatorias para continuar.</p>}
                                </GlassCard>
                            );
                        })()
                    )}

                    <div className="mt-6 flex items-center justify-between gap-4 px-1">
                        <div>
                            {step > 0 && (
                                <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
                                    ← Atrás
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            {step === totalSteps - 1 ? (
                                <>
                                    <p className="hidden text-sm text-ink-50 sm:block">Tus respuestas son confidenciales.</p>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Enviando…' : 'Enviar respuestas'}
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" onClick={handleNext}>
                                    Siguiente →
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </PublicShell>
    );
}

function QuestionField({ question, value, invalid, onChange }: { question: Question; value: string; invalid: boolean; onChange: (value: string) => void }) {
    if (question.type === 'radio') {
        return (
            <fieldset className={cn('flex flex-col gap-2 rounded-xl', invalid && 'ring-2 ring-danger/40 ring-offset-4 ring-offset-transparent')}>
                {question.options.map((o) => (
                    <label
                        key={o.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(26,24,48,0.1)] bg-white/50 px-3.5 py-2.5 text-sm text-ink transition-colors duration-200 hover:border-[rgba(61,58,138,0.4)] has-[:checked]:border-indigo has-[:checked]:bg-indigo/8"
                    >
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={o.id}
                            checked={value === String(o.id)}
                            onChange={() => onChange(String(o.id))}
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
            <Select value={value} onChange={(e) => onChange(e.target.value)} className={cn(invalid && 'field-invalid')}>
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
        return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cn('field', invalid && 'field-invalid')} />;
    }

    return (
        <Input
            type={question.type === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(invalid && 'field-invalid')}
        />
    );
}

function Field({ label, className, invalid, children }: { label: string; className?: string; invalid?: boolean; children: ReactNode }) {
    return (
        <div data-invalid={invalid ? 'true' : undefined} className={cn('flex flex-col gap-1.5', className)}>
            <Label>{label}</Label>
            {children}
        </div>
    );
}
