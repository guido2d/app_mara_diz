import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/field';
import { PublicShell } from '@/layouts/public-shell';

export default function Login() {
    return (
        <PublicShell title="Ingresar" className="justify-center">
            <GlassCard className="w-full max-w-sm p-8">
                <div className="mb-6 text-center">
                    <span className="mx-auto mb-4 grid size-10 place-items-center rounded-xl bg-indigo text-sm font-semibold text-indigo-ink">
                        B
                    </span>
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        Panel de <em className="italic">administración</em>
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Ingresá con tu cuenta para continuar.
                    </p>
                </div>
                <Form
                    action="/admin/login"
                    method="post"
                    className="flex flex-col gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <FieldError>{errors.email}</FieldError>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="mt-1 w-full"
                            >
                                {processing ? 'Ingresando…' : 'Ingresar'}
                            </Button>
                        </>
                    )}
                </Form>
            </GlassCard>
        </PublicShell>
    );
}
