interface Report {
    submissions_total: number;
    by_range: Record<string, Record<string, number>>;
    by_sex: Record<string, number>;
}
interface Props {
    campaign: { id: number; name: string };
    report: Report;
}

export default function ReportsIndex({ campaign, report }: Props) {
    return (
        <div className="mx-auto max-w-3xl p-6">
            <h1 className="mb-1 text-2xl font-semibold">Reporte de uso — {campaign.name}</h1>
            <p className="mb-6 text-lg">
                Envíos completados: <strong>{report.submissions_total}</strong>
            </p>

            <section className="mb-6">
                <h2 className="mb-2 font-medium">Distribución por resultado</h2>
                {Object.entries(report.by_range).map(([evaluation, counts]) => (
                    <div key={evaluation} className="mb-3">
                        <h3 className="text-sm font-semibold">{evaluation}</h3>
                        <ul className="text-sm">
                            {Object.entries(counts).map(([text, count]) => (
                                <li key={text}>
                                    {text}: {count}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <section>
                <h2 className="mb-2 font-medium">Por sexo</h2>
                <ul className="text-sm">
                    {Object.entries(report.by_sex).map(([sex, count]) => (
                        <li key={sex}>
                            {sex}: {count}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
