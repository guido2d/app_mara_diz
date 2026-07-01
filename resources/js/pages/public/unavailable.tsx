interface Props {
    form: { name: string };
}

export default function Unavailable({ form }: Props) {
    return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">{form.name}</h1>
            <p className="text-gray-600">
                Este formulario no está disponible en este momento. Volvé a intentarlo cuando la campaña esté abierta.
            </p>
        </div>
    );
}
