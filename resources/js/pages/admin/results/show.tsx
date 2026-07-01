interface Answer {
    question: string;
    value: string | null;
}
interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
}
interface Submission {
    first_name: string;
    last_name: string;
    role_function: string;
    age: number;
    sex: string;
    marital_status: string;
    children_count: number;
    cohabitation_group: string;
    work_email: string;
    phone: string;
    answers: Answer[];
    results: Result[];
}

export default function ResultShow({ submission }: { submission: Submission }) {
    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">
                {submission.first_name} {submission.last_name}
            </h1>

            <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
                <div>Función: {submission.role_function}</div>
                <div>Edad: {submission.age}</div>
                <div>Sexo: {submission.sex}</div>
                <div>Estado civil: {submission.marital_status}</div>
                <div>Hijos: {submission.children_count}</div>
                <div>Convivencia: {submission.cohabitation_group}</div>
                <div>Email: {submission.work_email}</div>
                <div>Celular: {submission.phone}</div>
            </section>

            <section className="mb-6">
                <h2 className="mb-2 font-medium">Resultados</h2>
                {submission.results.map((r, i) => (
                    <div key={i} className="mb-1">
                        {r.evaluation}: <strong>{r.result_text}</strong> ({r.total_points} pts)
                    </div>
                ))}
            </section>

            <section>
                <h2 className="mb-2 font-medium">Respuestas</h2>
                {submission.answers.map((a, i) => (
                    <div key={i} className="mb-1 text-sm">
                        <span className="text-gray-600">{a.question}</span>: {a.value ?? '—'}
                    </div>
                ))}
            </section>
        </div>
    );
}
