import { Form } from '@inertiajs/react';

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
    const common = 'w-full rounded border border-gray-300 p-2';

    if (question.type === 'radio') {
        return (
            <fieldset className="flex flex-col gap-1">
                {question.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2">
                        <input type="radio" name={name} value={o.id} required={question.required} />
                        {o.label}
                    </label>
                ))}
            </fieldset>
        );
    }
    if (question.type === 'select') {
        return (
            <select name={name} required={question.required} className={common} defaultValue="">
                <option value="" disabled>
                    Elegí una opción
                </option>
                {question.options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    }
    if (question.type === 'textarea') {
        return <textarea name={name} required={question.required} className={common} rows={3} />;
    }
    return <input type={question.type === 'date' ? 'date' : 'text'} name={name} required={question.required} className={common} />;
}

export default function PublicForm({ form, campaign, evaluations }: Props) {
    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold">{form.name}</h1>
            <p className="mb-6 text-sm text-gray-500">{campaign.name}</p>

            <Form action={`/f/${form.slug}`} method="post" className="flex flex-col gap-8">
                {({ errors, processing }) => (
                    <>
                        <section className="flex flex-col gap-3 rounded border border-gray-200 p-4">
                            <h2 className="font-medium">Tus datos</h2>
                            <input name="first_name" placeholder="Nombre" required className="rounded border border-gray-300 p-2" />
                            <input name="last_name" placeholder="Apellido" required className="rounded border border-gray-300 p-2" />
                            <input name="role_function" placeholder="Función que desempeñás" required className="rounded border border-gray-300 p-2" />
                            <input name="age" type="number" min={16} max={99} placeholder="Edad" required className="rounded border border-gray-300 p-2" />
                            <select name="sex" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>
                                    Sexo
                                </option>
                                <option value="femenino">Femenino</option>
                                <option value="masculino">Masculino</option>
                                <option value="otro">Otro / Prefiere no decir</option>
                            </select>
                            <select name="marital_status" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>
                                    Estado civil
                                </option>
                                <option value="soltero">Soltero/a</option>
                                <option value="en_pareja">En pareja</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                            </select>
                            <input name="children_count" type="number" min={0} max={20} placeholder="Cantidad de hijos" required className="rounded border border-gray-300 p-2" />
                            <select name="cohabitation_group" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>
                                    Grupo de convivencia
                                </option>
                                <option value="solo">Solo/a</option>
                                <option value="con_pareja">Con pareja</option>
                                <option value="con_pareja_e_hijos">Con pareja e hijos</option>
                                <option value="con_hijos">Con hijos</option>
                                <option value="con_padres_familia">Con padres/familia</option>
                                <option value="con_companeros_otros">Con compañeros/otros</option>
                            </select>
                            <input name="work_email" type="email" placeholder="Email laboral" required className="rounded border border-gray-300 p-2" />
                            <input name="phone" placeholder="Celular" required className="rounded border border-gray-300 p-2" />
                            {errors.work_email && <p className="text-sm text-red-600">{errors.work_email}</p>}
                        </section>

                        {evaluations.map((evaluation) => (
                            <section key={evaluation.id} className="flex flex-col gap-4 rounded border border-gray-200 p-4">
                                <h2 className="font-medium">{evaluation.name}</h2>
                                {evaluation.questions.map((question) => (
                                    <div key={question.id} className="flex flex-col gap-1">
                                        <label className="text-sm">
                                            {question.label} {question.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <QuestionField question={question} />
                                    </div>
                                ))}
                            </section>
                        ))}

                        <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                            Enviar
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
