import { Link } from '@inertiajs/react';

interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
}
interface Row {
    id: number;
    name: string;
    work_email: string;
    submitted_at: string;
    results: Result[];
}
interface Props {
    campaign: { id: number; name: string; form_name: string };
    submissions: Row[];
}

export default function ResultsIndex({ campaign, submissions }: Props) {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-1 text-2xl font-semibold">Resultados — {campaign.form_name}</h1>
            <p className="mb-4 text-sm text-gray-500">
                {campaign.name} · {submissions.length} envíos
            </p>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Empleado</th>
                        <th>Email</th>
                        <th>Resultados</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((s) => (
                        <tr key={s.id} className="border-b align-top">
                            <td className="py-2">{s.name}</td>
                            <td>{s.work_email}</td>
                            <td>
                                {s.results.map((r, i) => (
                                    <div key={i}>
                                        {r.evaluation}: <strong>{r.result_text}</strong> ({r.total_points})
                                    </div>
                                ))}
                            </td>
                            <td>
                                <Link href={`/admin/submissions/${s.id}`} className="text-blue-600">
                                    Ver detalle
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
