export interface BarSeries {
    campaign_id: number;
    campaign_name: string;
    /** Valor de la campaña, o null si no hay respuestas para medir. */
    value: number | null;
    answers: number;
}

/** Qué mide la barra: puntos promedio o porcentaje de respuestas positivas. */
export type BarScale = 'points' | 'percent';

function formatValue(value: number, scale: BarScale): string {
    return scale === 'percent' ? `${Math.round(value)}%` : value.toFixed(1);
}

function describeValue(value: number, max: number, scale: BarScale): string {
    return scale === 'percent'
        ? `${Math.round(value)}% de respuestas positivas`
        : `${value.toFixed(1)} puntos promedio sobre ${max}`;
}

/** Marcas del eje: 0..max de a 1 en puntos, de a 25 en porcentaje. */
function ticksOf(max: number, scale: BarScale): number[] {
    return scale === 'percent'
        ? [0, 25, 50, 75, 100]
        : Array.from({ length: max + 1 }, (_, tick) => tick);
}

/**
 * Tono de indigo de una campaña: la más antigua clara, la más reciente plena.
 * La progresión temporal se lee sin consultar la leyenda.
 */
export function campaignTint(index: number, total: number): string {
    const ratio = total <= 1 ? 1 : index / (total - 1);
    const percent = Math.round(35 + ratio * 65);

    return `color-mix(in srgb, var(--color-indigo) ${percent}%, transparent)`;
}

/** Diferencia contra la campaña anterior, en puntos absolutos. */
function deltaOf(series: BarSeries[], index: number): number | null {
    if (index === 0) {
        return null;
    }

    const current = series[index].value;
    const previous = series[index - 1].value;

    if (current === null || previous === null) {
        return null;
    }

    return current - previous;
}

function DeltaBadge({
    delta,
    lowerIsBetter,
    scale,
}: {
    delta: number;
    lowerIsBetter: boolean;
    scale: BarScale;
}) {
    if (Math.abs(delta) < (scale === 'percent' ? 0.5 : 0.05)) {
        return <span className="font-mono text-[11px] text-ink-50">sin cambio</span>;
    }

    const fell = delta < 0;
    const improved = fell === lowerIsBetter;

    return (
        <span
            className={`font-mono text-[11px] font-medium ${improved ? 'text-emerald-600' : 'text-rose-600'}`}
        >
            {fell ? '▼' : '▲'} {formatValue(Math.abs(delta), scale)}
        </span>
    );
}

/**
 * Barras horizontales de una pregunta: una por campaña, todas sobre la misma
 * escala fija. La escala común es deliberada — si cada gráfico se autoescalara,
 * un promedio de 0.4 se vería tan grave como uno de 2.8.
 */
export function GroupedBars({
    series,
    max,
    lowerIsBetter,
    scale = 'points',
    showScale = false,
}: {
    series: BarSeries[];
    max: number;
    lowerIsBetter: boolean;
    scale?: BarScale;
    showScale?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {series.map((item, index) => {
                const delta = deltaOf(series, index);
                const width = item.value === null ? 0 : Math.min(100, (item.value / max) * 100);

                return (
                    <div key={item.campaign_id} className="flex items-center gap-3">
                        <div className="h-5 flex-1 overflow-hidden rounded-md bg-ink/6">
                            {item.value !== null && (
                                <div
                                    className="h-full rounded-md transition-[width] duration-500"
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: campaignTint(index, series.length),
                                    }}
                                    role="img"
                                    aria-label={`${item.campaign_name}: ${describeValue(item.value, max, scale)}`}
                                />
                            )}
                        </div>
                        <span className="w-12 shrink-0 text-right font-mono text-xs font-semibold text-ink">
                            {item.value === null ? (
                                <span className="font-normal text-ink-50">—</span>
                            ) : (
                                formatValue(item.value, scale)
                            )}
                        </span>
                        <span className="w-20 shrink-0">
                            {item.value === null ? (
                                <span className="font-mono text-[11px] text-ink-50">
                                    {item.answers === 0 ? 'sin datos' : ''}
                                </span>
                            ) : (
                                delta !== null && (
                                    <DeltaBadge
                                        delta={delta}
                                        lowerIsBetter={lowerIsBetter}
                                        scale={scale}
                                    />
                                )
                            )}
                        </span>
                    </div>
                );
            })}

            {showScale && (
                <div className="mt-1 flex items-center gap-3">
                    <div className="flex flex-1 justify-between font-mono text-[10px] text-ink-50">
                        {ticksOf(max, scale).map((tick) => (
                            <span key={tick}>{formatValue(tick, scale)}</span>
                        ))}
                    </div>
                    <span className="w-12 shrink-0" />
                    <span className="w-20 shrink-0" />
                </div>
            )}
        </div>
    );
}

/** Puntitos de color que identifican cada campaña arriba de los gráficos. */
export function CampaignLegend({ campaigns }: { campaigns: { id: number; name: string }[] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {campaigns.map((campaign, index) => (
                <span key={campaign.id} className="flex items-center gap-2 text-xs text-ink-50">
                    <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: campaignTint(index, campaigns.length) }}
                    />
                    {campaign.name}
                </span>
            ))}
        </div>
    );
}
