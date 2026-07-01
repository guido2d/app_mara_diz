import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/button';
import { DataTable, StatusPill, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface FormRow {
    id: number;
    name: string;
    slug: string;
    evaluations_count: number;
    is_active: boolean;
}

/** Acciones sobre el link público de un formulario: abrir en pestaña nueva y copiar la URL. */
function PublicLinkActions({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);
    const path = `/f/${slug}`;

    const copyUrl = async () => {
        const url = `${window.location.origin}${path}`;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback para contextos no seguros (HTTP), donde navigator.clipboard no existe.
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            window.prompt('Copiá la URL:', url);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <code className="rounded-md bg-ink/6 px-2 py-1 font-mono text-xs text-ink-50">
                {path}
            </code>
            <a
                href={path}
                target="_blank"
                rel="noreferrer"
                title="Abrir en pestaña nueva"
                className="cursor-pointer text-ink-50 hover:text-indigo"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                </svg>
            </a>
            <button
                type="button"
                onClick={copyUrl}
                title={copied ? 'Copiado' : 'Copiar URL'}
                className="cursor-pointer text-ink-50 hover:text-indigo"
            >
                {copied ? (
                    <span className="text-xs font-medium text-emerald-600">
                        Copiado
                    </span>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                        />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default function FormsIndex({ forms }: { forms: FormRow[] }) {
    return (
        <AdminShell title="Formularios">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Formularios
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Componé formularios a partir de evaluaciones y gestioná
                        sus campañas.
                    </p>
                </div>
                <Link
                    href="/admin/forms/create"
                    className={buttonClass('primary')}
                >
                    Nuevo formulario
                </Link>
            </div>

            {forms.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay formularios. Creá el primero para
                        empezar.
                    </p>
                </div>
            ) : (
                <DataTable>
                    <thead>
                        <tr>
                            <Th>Nombre</Th>
                            <Th>Evaluaciones</Th>
                            <Th>Estado</Th>
                            <Th>Link público</Th>
                            <Th className="text-right">Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.map((form) => (
                            <Tr key={form.id}>
                                <Td className="font-medium">{form.name}</Td>
                                <Td>{form.evaluations_count}</Td>
                                <Td>
                                    <StatusPill active={form.is_active}>
                                        {form.is_active ? 'Activo' : 'Inactivo'}
                                    </StatusPill>
                                </Td>
                                <Td>
                                    <PublicLinkActions slug={form.slug} />
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                        <Link
                                            href={`/admin/forms/${form.id}/edit`}
                                            className="text-indigo hover:underline"
                                        >
                                            Editar
                                        </Link>
                                        <Link
                                            href={`/admin/forms/${form.id}/campaigns`}
                                            className="text-indigo hover:underline"
                                        >
                                            Campañas
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `¿Borrar el formulario “${form.name}”?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/admin/forms/${form.id}`,
                                                    );
                                                }
                                            }}
                                            className="cursor-pointer text-danger hover:underline"
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}
        </AdminShell>
    );
}
