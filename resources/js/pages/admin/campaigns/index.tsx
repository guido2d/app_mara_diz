import { Form, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PublicFormController from '@/actions/App/Http/Controllers/PublicFormController';
import { Button, buttonClass } from '@/components/ui/button';
import { campaignActionIcons } from '@/components/ui/campaign-action-icons';
import { GlassCard } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FieldError, Input, Label } from '@/components/ui/field';
import {
    CardActions,
    CardField,
    CardList,
    DataTable,
    RecordCard,
    StatusPill,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface CampaignRow {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
    evaluations: string[];
}
interface EvaluationOption {
    id: number;
    name: string;
}
interface Props {
    form: { id: number; name: string; slug: string };
    evaluations: EvaluationOption[];
    campaigns: CampaignRow[];
}

/** Convierte una fecha `YYYY-MM-DD` a `DD-MM-YYYY` sin tocar zona horaria. */
function formatDate(iso: string): string {
    const [year, month, day] = iso.split('-');

    return `${day}-${month}-${year}`;
}

/**
 * Copia texto al portapapeles. La API moderna necesita permiso y contexto
 * seguro, así que cuando el navegador la rechaza se recurre a un textarea
 * temporal con el método legado.
 */
async function writeToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);

        return true;
    } catch {
        // Sin permiso: se intenta el método legado más abajo.
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        textarea.remove();
    }
}

/**
 * Copia al portapapeles la URL absoluta del formulario público, para pegarla en
 * un mail o un chat sin tener que abrirlo primero.
 */
function CopyPublicLinkButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        const url = new URL(
            PublicFormController.show(slug).url,
            window.location.origin,
        ).toString();

        if (await writeToClipboard(url)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);

            return;
        }

        window.prompt('Copiá el link del formulario:', url);
    };

    return (
        <Button variant="secondary" onClick={copy} aria-live="polite">
            {copied ? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-4 w-4"
                >
                    <path d="m20 6-11 11-5-5" />
                </svg>
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-4 w-4"
                >
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            )}
            {copied ? 'Link copiado' : 'Copiar link'}
        </Button>
    );
}

/**
 * Cuántas evaluaciones tiene la campaña sobre el total del formulario, con el
 * detalle en un tooltip. La tabla es angosta, así que el listado completo solo
 * se muestra al pasar el mouse o al enfocar con el teclado. El tooltip va en un
 * portal porque el contenedor de la tabla recorta con `overflow-hidden`.
 */
function EvaluationsCount({ names, total }: { names: string[]; total: number }) {
    const triggerRef = useRef<HTMLSpanElement>(null);
    const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
        null,
    );

    if (names.length === 0) {
        return <span className="text-ink-50">—</span>;
    }

    const label =
        names.length >= total
            ? `Todas (${names.length})`
            : `${names.length} de ${total}`;

    const show = () => {
        const rect = triggerRef.current?.getBoundingClientRect();

        if (rect) {
            setAnchor({ top: rect.bottom + 8, left: rect.left });
        }
    };

    return (
        <>
            <span
                ref={triggerRef}
                tabIndex={0}
                onMouseEnter={show}
                onMouseLeave={() => setAnchor(null)}
                onFocus={show}
                onBlur={() => setAnchor(null)}
                className="inline-flex cursor-default items-center gap-1 rounded text-xs text-ink-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo/40"
            >
                {label}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 opacity-60"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
            </span>

            {anchor !== null &&
                createPortal(
                    <span
                        role="tooltip"
                        style={{ top: anchor.top, left: anchor.left }}
                        className="pointer-events-none fixed z-50 flex w-max max-w-64 flex-col gap-1 rounded-xl border border-[rgba(26,24,48,0.1)] bg-white px-3 py-2.5 text-left text-xs leading-snug text-ink shadow-[0_12px_32px_rgba(26,24,48,0.16)]"
                    >
                        {names.map((name) => (
                            <span key={name}>{name}</span>
                        ))}
                    </span>,
                    document.body,
                )}
        </>
    );
}

/** Acciones por campaña reutilizadas en la tabla (desktop) y la tarjeta (mobile). */
function CampaignActions({
    campaign,
    hasOpen,
}: {
    campaign: CampaignRow;
    hasOpen: boolean;
}) {
    const [pendingAction, setPendingAction] = useState<
        'close' | 'reopen' | 'delete' | null
    >(null);
    const [processing, setProcessing] = useState(false);
    const hasSubmissions = campaign.submissions_count > 0;

    const runAction = () => {
        if (!pendingAction) {
            return;
        }

        const options = {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => setPendingAction(null),
        };

        if (pendingAction === 'delete') {
            router.delete(`/admin/campaigns/${campaign.id}`, options);

            return;
        }

        router.post(
            `/admin/campaigns/${campaign.id}/${pendingAction}`,
            {},
            options,
        );
    };

    const name = (
        <strong className="font-semibold text-ink">{campaign.name}</strong>
    );

    /** Copy of the confirmation dialog for each action. */
    const dialogs = {
        close: {
            tone: 'danger' as const,
            icon: campaignActionIcons.close,
            title: 'Cerrar campaña',
            confirmLabel: 'Cerrar campaña',
            processingLabel: 'Cerrando…',
            description: (
                <>
                    Se cerrará la campaña {name} y dejará de recibir respuestas.
                    Podés reabrirla más adelante.
                </>
            ),
        },
        reopen: {
            tone: 'primary' as const,
            icon: campaignActionIcons.reopen,
            title: 'Reabrir campaña',
            confirmLabel: 'Reabrir campaña',
            processingLabel: 'Reabriendo…',
            description: (
                <>
                    Se reabrirá la campaña {name} para volver a recibir
                    respuestas.
                </>
            ),
        },
        delete: {
            tone: 'danger' as const,
            icon: campaignActionIcons.delete,
            title: hasSubmissions
                ? 'Eliminar campaña y sus respuestas'
                : 'Eliminar campaña',
            confirmLabel: 'Eliminar campaña',
            processingLabel: 'Eliminando…',
            description: hasSubmissions ? (
                <>
                    La campaña {name} ya tiene{' '}
                    <strong className="font-semibold text-ink">
                        {campaign.submissions_count}{' '}
                        {campaign.submissions_count === 1
                            ? 'respuesta'
                            : 'respuestas'}
                    </strong>
                    . Al eliminarla se borran también todas esas respuestas y
                    los resultados calculados a partir de ellas. Esta acción no
                    se puede deshacer.
                </>
            ) : (
                <>
                    Se eliminará la campaña {name}. Todavía no tiene respuestas,
                    así que no se pierde ningún dato. Esta acción no se puede
                    deshacer.
                </>
            ),
        },
    };

    const dialog = dialogs[pendingAction ?? 'close'];

    return (
        <>
            <Link
                href={`/admin/campaigns/${campaign.id}/results`}
                className="text-indigo hover:underline"
            >
                Resultados
            </Link>
            {campaign.is_open && (
                <button
                    onClick={() => setPendingAction('close')}
                    className="cursor-pointer text-danger hover:underline"
                >
                    Cerrar
                </button>
            )}
            {!campaign.is_open && !hasOpen && (
                <button
                    onClick={() => setPendingAction('reopen')}
                    className="cursor-pointer text-indigo hover:underline"
                >
                    Reabrir
                </button>
            )}
            <button
                onClick={() => setPendingAction('delete')}
                className="cursor-pointer text-danger hover:underline"
            >
                Eliminar
            </button>

            <ConfirmDialog
                open={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                onConfirm={runAction}
                processing={processing}
                tone={dialog.tone}
                icon={dialog.icon}
                title={dialog.title}
                confirmLabel={dialog.confirmLabel}
                processingLabel={dialog.processingLabel}
                description={dialog.description}
            />
        </>
    );
}

export default function CampaignsIndex({
    form,
    evaluations,
    campaigns,
}: Props) {
    const hasOpen = campaigns.some((c) => c.is_open);

    return (
        <AdminShell title={`Campañas — ${form.name}`}>
            <div className="mb-6">
                <Link
                    href="/admin/forms"
                    className="text-sm font-medium text-ink-50 hover:text-ink"
                >
                    ← Formularios
                </Link>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                            Campañas — {form.name}
                        </h1>
                        <p className="mt-1 text-sm text-ink-50">
                            Cada campaña abre una ronda de respuestas. Solo puede
                            haber una campaña abierta por vez.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={PublicFormController.show(form.slug).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonClass('secondary')}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="h-4 w-4"
                            >
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            </svg>
                            Ver formulario público
                        </a>
                        <CopyPublicLinkButton slug={form.slug} />
                    </div>
                </div>
            </div>

            {!hasOpen && (
                <GlassCard className="mb-6">
                    <h2 className="mb-4 text-lg font-semibold text-ink">
                        Abrir una nueva campaña
                    </h2>
                    {evaluations.length === 0 ? (
                        <p className="text-sm text-ink-50">
                            Este formulario todavía no tiene evaluaciones
                            asignadas. Agregale al menos una desde{' '}
                            <Link
                                href={`/admin/forms/${form.id}/edit`}
                                className="text-indigo hover:underline"
                            >
                                editar formulario
                            </Link>{' '}
                            para poder abrir una campaña.
                        </p>
                    ) : (
                        <Form
                            action={`/admin/forms/${form.id}/campaigns`}
                            method="post"
                            className="flex flex-col gap-5"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="flex flex-wrap items-end gap-4">
                                        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                                            <Label htmlFor="name">Nombre</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Q1 2026"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="starts_at">
                                                Desde
                                            </Label>
                                            <Input
                                                id="starts_at"
                                                name="starts_at"
                                                type="date"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="ends_at">
                                                Hasta
                                            </Label>
                                            <Input
                                                id="ends_at"
                                                name="ends_at"
                                                type="date"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <fieldset className="flex flex-col gap-2">
                                        <legend className="mb-1 text-sm font-medium text-ink">
                                            Evaluaciones que la componen
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
                                        <FieldError>
                                            {errors.evaluation_ids}
                                        </FieldError>
                                    </fieldset>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Abriendo…'
                                                : 'Abrir campaña'}
                                        </Button>
                                        <FieldError>{errors.name}</FieldError>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                </GlassCard>
            )}

            {campaigns.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay campañas para este formulario.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Nombre</Th>
                                <Th>Evaluaciones</Th>
                                <Th>Desde</Th>
                                <Th>Hasta</Th>
                                <Th>Respuestas</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <Tr key={c.id}>
                                    <Td className="font-medium">{c.name}</Td>
                                    <Td className="whitespace-nowrap">
                                        <EvaluationsCount
                                            names={c.evaluations}
                                            total={evaluations.length}
                                        />
                                    </Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {formatDate(c.starts_at)}
                                    </Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {formatDate(c.ends_at)}
                                    </Td>
                                    <Td>{c.submissions_count}</Td>
                                    <Td>
                                        <StatusPill active={c.is_open}>
                                            {c.is_open ? 'Abierta' : 'Cerrada'}
                                        </StatusPill>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                            <CampaignActions
                                                campaign={c}
                                                hasOpen={hasOpen}
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {campaigns.map((c) => (
                            <RecordCard key={c.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="min-w-0 font-medium [overflow-wrap:anywhere] text-ink">
                                        {c.name}
                                    </p>
                                    <StatusPill active={c.is_open}>
                                        {c.is_open ? 'Abierta' : 'Cerrada'}
                                    </StatusPill>
                                </div>
                                <div className="mt-3 border-t border-[rgba(26,24,48,0.08)] pt-2">
                                    <CardField label="Evaluaciones">
                                        <span className="text-xs text-ink-50">
                                            {c.evaluations.length === 0
                                                ? '—'
                                                : c.evaluations.join(', ')}
                                        </span>
                                    </CardField>
                                    <CardField label="Desde">
                                        <span className="font-mono text-xs text-ink-50">
                                            {formatDate(c.starts_at)}
                                        </span>
                                    </CardField>
                                    <CardField label="Hasta">
                                        <span className="font-mono text-xs text-ink-50">
                                            {formatDate(c.ends_at)}
                                        </span>
                                    </CardField>
                                    <CardField label="Respuestas">
                                        {c.submissions_count}
                                    </CardField>
                                </div>
                                <CardActions>
                                    <CampaignActions
                                        campaign={c}
                                        hasOpen={hasOpen}
                                    />
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}
        </AdminShell>
    );
}
