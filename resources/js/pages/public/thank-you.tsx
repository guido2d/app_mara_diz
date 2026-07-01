interface Props {
    form: { name: string };
}

export default function ThankYou({ form }: Props) {
    return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">¡Gracias por participar!</h1>
            <p className="text-gray-600">Recibimos tus respuestas del formulario "{form.name}".</p>
        </div>
    );
}
