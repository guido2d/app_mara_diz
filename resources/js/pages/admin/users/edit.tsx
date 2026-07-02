import { Form, Link } from '@inertiajs/react';
import { Button, buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/field';
import { AdminShell } from '@/layouts/admin-shell';

interface Props {
    user: { id: number; name: string; email: string };
}

export default function UserEdit({ user }: Props) {
    return (
        <AdminShell title={`Editar — ${user.name}`}>
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
                    Editar usuario
                </h1>
                <GlassCard>
                    <Form
                        action={`/admin/users/${user.id}`}
                        method="put"
                        className="flex flex-col gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" name="name" defaultValue={user.name} required />
                                    <FieldError>{errors.name}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={user.email}
                                        required
                                    />
                                    <FieldError>{errors.email}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input id="password" name="password" type="password" />
                                    <p className="text-xs text-ink-50">
                                        Dejala en blanco para no cambiarla.
                                    </p>
                                    <FieldError>{errors.password}</FieldError>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando…' : 'Guardar'}
                                    </Button>
                                    <Link href="/admin/users" className={buttonClass('ghost')}>
                                        Cancelar
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
