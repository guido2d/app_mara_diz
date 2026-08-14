/** Semáforo de una opción: verde la respuesta más benigna, rojo la más severa. */
export type SignalTone = 'good' | 'warning' | 'bad';

const TONE_COLOR: Record<SignalTone, string> = {
    good: 'var(--color-signal-good)',
    warning: 'var(--color-signal-warning)',
    bad: 'var(--color-signal-bad)',
};

export interface DistributionCount {
    campaign_id: number;
    /** Cuántas personas eligieron esta opción en la campaña. */
    count: number;
    /** Qué parte entera de quienes respondieron la pregunta representan, o null si nadie la respondió. */
    percent: number | null;
    /** Diferencia contra la campaña anterior, en puntos porcentuales enteros. */
    delta: number | null;
}

export interface DistributionOption {
    id: number;
    label: string;
    /** Si que esta opción crezca es una mejora — lo define el puntaje de la opción. */
    growth_is_good: boolean;
    /** Color de la barra según qué tan severa es la respuesta. */
    tone: SignalTone;
    counts: DistributionCount[];
}

export interface Distribution {
    options: DistributionOption[];
    answers: { campaign_id: number; total: number }[];
}

interface CampaignInfo {
    id: number;
    name: string;
}

/**
 * Grilla compartida por el encabezado, las filas y el pie: una columna para la
 * opción, una por campaña y una para la diferencia. Las tres partes la usan para
 * quedar alineadas aunque vivan en bloques distintos.
 */
function columnsOf(campaigns: number): string {
    return `minmax(7rem, 1.2fr) repeat(${campaigns}, minmax(10rem, 1fr)) 5rem`;
}

/** Ancho mínimo antes de que la tabla empiece a scrollear en horizontal. */
const MIN_WIDTH = '41rem';

/**
 * Cuánto se movió una opción entre campañas. El número es la resta entre ambos
 * porcentajes — 44% contra 55% da 11 — y se rotula con el signo delante para
 * que se lea de un vistazo.
 */
function DeltaBadge({
    delta,
    growthIsGood,
}: {
    delta: number;
    growthIsGood: boolean;
}) {
    if (delta === 0) {
        return <span className="font-mono text-[11px] text-ink-50">0%</span>;
    }

    const improved = delta > 0 === growthIsGood;

    return (
        <span
            className={`font-mono text-[11px] font-medium ${improved ? 'text-emerald-600' : 'text-rose-600'}`}
        >
            {delta > 0 ? '+' : '-'}
            {Math.abs(delta)}%
        </span>
    );
}

/**
 * Celda de una campaña: la barra proporcional más el porcentaje y la cantidad
 * de personas detrás. El color de la barra es el semáforo de la opción y es el
 * mismo en todas las campañas: así una toma se compara contra la otra por el
 * largo de la barra, sin que un cambio de intensidad sugiera otra diferencia.
 */
function CountCell({
    count,
    percent,
    tone,
}: {
    count: number;
    percent: number | null;
    tone: SignalTone;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-4 flex-1 overflow-hidden rounded bg-ink/6">
                {percent !== null && (
                    <div
                        data-tone={tone}
                        className="h-full rounded transition-[width] duration-500"
                        style={{
                            width: `${percent}%`,
                            backgroundColor: TONE_COLOR[tone],
                        }}
                    />
                )}
            </div>
            <span className="w-[5.5rem] shrink-0 text-right font-mono text-xs whitespace-nowrap text-ink">
                {percent === null ? (
                    <span className="text-ink-50">—</span>
                ) : (
                    <>
                        <span className="font-semibold">{percent}%</span>
                        <span className="ml-1 text-ink-50">
                            ({count} per.)
                        </span>
                    </>
                )}
            </span>
        </div>
    );
}

/**
 * Encabezado de columnas de la tabla de distribución. Va una sola vez arriba de
 * todas las preguntas de la evaluación en lugar de repetirse en cada una. Sin
 * muestra de color: acá las barras se distinguen por el semáforo de la opción,
 * no por la campaña, y un punto de color sólo confundiría las dos lecturas.
 */
export function DistributionHeader({ campaigns }: { campaigns: CampaignInfo[] }) {
    return (
        <div
            className="grid items-center gap-x-4 border-b border-[rgba(26,24,48,0.08)] pb-2"
            style={{ gridTemplateColumns: columnsOf(campaigns.length) }}
        >
            <span />
            {campaigns.map((campaign) => (
                <span
                    key={campaign.id}
                    className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase"
                >
                    {campaign.name}
                </span>
            ))}
            <span className="text-right font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                Dif.
            </span>
        </div>
    );
}

/**
 * Cuántas personas eligieron cada opción de una pregunta, campaña por campaña.
 * La última columna resta el porcentaje de la campaña más reciente contra el de
 * la anterior. Es una resta, no una variación relativa: con bases chicas un
 * 3 → 6 daría "+100%" y exageraría un movimiento de tres personas.
 */
export function OptionDistribution({
    distribution,
    campaigns,
}: {
    distribution: Distribution;
    campaigns: CampaignInfo[];
}) {
    const columns = columnsOf(campaigns.length);

    return (
        <div className="flex flex-col gap-1.5">
            {distribution.options.map((option) => {
                const latest = option.counts[option.counts.length - 1];

                return (
                    <div
                        key={option.id}
                        className="grid items-center gap-x-4"
                        style={{ gridTemplateColumns: columns }}
                    >
                        <span className="text-xs text-ink-50">
                            {option.label}
                        </span>
                        {option.counts.map((count, index) => (
                            <CountCell
                                key={count.campaign_id}
                                count={count.count}
                                percent={count.percent}
                                tone={option.tone}
                            />
                        ))}
                        <span className="text-right">
                            {latest?.delta === null ||
                            latest?.delta === undefined ? (
                                <span className="font-mono text-[11px] text-ink-50">
                                    —
                                </span>
                            ) : (
                                <DeltaBadge
                                    delta={latest.delta}
                                    growthIsGood={option.growth_is_good}
                                />
                            )}
                        </span>
                    </div>
                );
            })}

            <div
                className="grid items-center gap-x-4"
                style={{ gridTemplateColumns: columns }}
            >
                <span className="font-mono text-[10px] tracking-[0.06em] text-ink-50 uppercase">
                    respondieron
                </span>
                {distribution.answers.map((answer) => (
                    <span
                        key={answer.campaign_id}
                        className="font-mono text-[10px] text-ink-50"
                    >
                        {answer.total} personas
                    </span>
                ))}
                <span />
            </div>
        </div>
    );
}

export { MIN_WIDTH as DISTRIBUTION_MIN_WIDTH };
