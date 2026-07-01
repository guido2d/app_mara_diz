import { Form } from '@inertiajs/react';

export default function Login() {
    return (
        <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
            <h1 className="text-xl font-semibold">Panel de administración</h1>
            <Form action="/admin/login" method="post" className="flex flex-col gap-3">
                {({ errors, processing }) => (
                    <>
                        <input name="email" type="email" placeholder="Email" required className="rounded border border-gray-300 p-2" />
                        <input name="password" type="password" placeholder="Contraseña" required className="rounded border border-gray-300 p-2" />
                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                        <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                            Ingresar
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
