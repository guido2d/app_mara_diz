<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class HealthyHabitsSeeder extends Seeder
{
    public function run(): void
    {
        $evaluation = Evaluation::create([
            'name' => 'Conductas y hábitos saludables',
            'slug' => 'conductas-habitos-saludables',
            'description' => 'Evalúa la presencia de conductas y hábitos que favorecen el bienestar.',
            'position' => 4,
            'is_scored' => true,
        ]);

        $yesNo = [
            ['label' => 'Sí', 'points' => 1],
            ['label' => 'No', 'points' => 0],
        ];

        foreach ([
            'Cuido mi dieta (consumo verduras, frutas, pescado y poco azúcar, carbohidratos y fritos).',
            'Tomo un desayuno nutritivo y disfruto de él.',
            'Salgo con tiempo para llegar al trabajo sin apuro.',
            'Hago ejercicio al menos 3 veces por semana o camino 40\' 5 días a la semana.',
            'Duermo 7 horas o más todos los días.',
            'Medito o hago relajación cuando lo necesito.',
            'No hablo de trabajo ni de problemas mientras almuerzo o ceno.',
            'Me tomo un tiempo de descanso entre el trabajo y las tareas domésticas.',
            'Disfruto y descanso en los fines de semana.',
            'Dedico regularmente tiempo para un hobbie.',
            'Dedico al menos media hora diaria para mí.',
            'Expreso adecuadamente mis sentimientos y necesidades con mis seres queridos.',
            'Expreso adecuadamente mis sentimientos y necesidades en mi trabajo.',
            'Pienso que mantener la calma es mi responsabilidad.',
            'Dejo las preocupaciones laborales en la oficina.',
            'Soy feliz en casa.',
            'Me gusta mi trabajo.',
            'Me llevo bien con mis compañeros.',
            'Me llevo bien con mi o mis líderes.',
            'Disfruto y descanso en mis vacaciones.',
            'Espero cambios positivos en mi vida y/o trabajo.',
            'Veo el aspecto positivo de los cambios.',
            'Experimento cierta "tensión positiva" en mi vida.',
            'Tengo una vida social activa.',
            'Me siento querido y apoyado por mi familia y/o amigos.',
            'Me siento a gusto en el silencio.',
            'Ayudo a los demás siempre que puedo.',
        ] as $i => $label) {
            $question = $evaluation->questions()->create([
                'label' => $label,
                'type' => QuestionType::Radio,
                'required' => true,
                'position' => $i + 1,
            ]);

            foreach ($yesNo as $p => $option) {
                $question->options()->create([...$option, 'position' => $p + 1]);
            }
        }
    }
}
