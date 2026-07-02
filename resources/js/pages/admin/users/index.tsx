import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    CardActions,
    CardField,
    CardList,
    DataTable,
    RecordCard,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface UserRow {
    id: number;
    name: string;
    email: string;
    created_at: string;
    is_self: boolean;
}

export default function UsersIndex({ users }: { users: UserRow[] }) {
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setProcessing(true);
        router.delete(`/admin/users/${toDelete.id}`, {
            onFinish: () => {
                setProcessing(false);
                setToDelete(null);
            },
        });
    };

    return (
        <AdminShell title="Usuarios">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Gestioná quién puede acceder al panel.
                    </p>
                </div>
                <Link
                    href="/admin/users/create"
                    className={buttonClass('primary', 'w-full sm:w-auto')}
                >
                    Nuevo usuario
                </Link>
            </div>

            {users.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay usuarios.</p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Nombre</Th>
                                <Th>Email</Th>
                                <Th>Creado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <Tr key={u.id}>
                                    <Td className="font-medium">{u.name}</Td>
                                    <Td className="text-ink-50">{u.email}</Td>
                                    <Td className="font-mono text-xs text-ink-50">
                                        {u.created_at}
                                    </Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                            <Link
                                                href={`/admin/users/${u.id}/edit`}
                                                className="text-indigo hover:underline"
                                            >
                                                Editar
                                            </Link>
                                            {!u.is_self && (
                                                <button
                                                    onClick={() =>
                                                        setToDelete(u)
                                                    }
                                                    className="cursor-pointer text-danger hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {users.map((u) => (
                            <RecordCard key={u.id}>
                                <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                    {u.name}
                                </p>
                                <div className="mt-3 border-t border-[rgba(26,24,48,0.08)] pt-2">
                                    <CardField label="Email">
                                        {u.email}
                                    </CardField>
                                    <CardField label="Creado">
                                        <span className="font-mono text-xs text-ink-50">
                                            {u.created_at}
                                        </span>
                                    </CardField>
                                </div>
                                <CardActions>
                                    <Link
                                        href={`/admin/users/${u.id}/edit`}
                                        className="text-indigo hover:underline"
                                    >
                                        Editar
                                    </Link>
                                    {!u.is_self && (
                                        <button
                                            onClick={() => setToDelete(u)}
                                            className="cursor-pointer text-danger hover:underline"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}

            <ConfirmDialog
                open={toDelete !== null}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar usuario"
                description={
                    toDelete
                        ? `Se eliminará a ${toDelete.name}. Esta acción no se puede deshacer.`
                        : undefined
                }
                processing={processing}
            />
        </AdminShell>
    );
}
