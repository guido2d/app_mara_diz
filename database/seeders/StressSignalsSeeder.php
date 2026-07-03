<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class StressSignalsSeeder extends Seeder
{
    public function run(): void
    {
        $evaluation = Evaluation::create([
            'name' => 'Síntomas psíquicos',
            'slug' => 'senales-de-estres',
            'description' => 'Indicá con qué frecuencia experimentás cada una de estas situaciones en el último tiempo.',
            'position' => 2,
            'is_scored' => true,
        ]);

        /** @var array<int, array{label: string, points: int}> $frequency */
        $frequency = [
            ['label' => 'Cada 15 días', 'points' => 0],
            ['label' => '1 vez por semana', 'points' => 1],
            ['label' => 'Casi todos los días', 'points' => 3],
        ];

        $questions = [
            'Que no tiene tiempo suficiente y que nunca va a llegar.',
            'Sentir que el trabajo es lo más importante para usted.',
            'Que no va a poder, que va a fallar. Teme fracasar en algo.',
            'Tener preocupaciones persistentes.',
            'Extrañar su trabajo en las vacaciones.',
            'Vivir pensando en tareas futuras en lugar de disfrutar el presente.',
            'Que la vida es un largo camino de obstáculos a superar.',
            'Ver las cosas blancas o negras, nunca grises.',
            'Que se aburre si no trabaja.',
            'Ser muy autocrítico/a con sus errores. No se los perdona.',
            'Que le cuesta escuchar a los otros porque está metido/a en sus preocupaciones.',
            'Comenzar a cometer cada vez más excesos con el cigarrillo, el alcohol, el café o psicofármacos.',
            'Sentir que disminuye o aumenta notablemente su apetito.',
            'Estar perdiendo su capacidad para proyectar a mediano y largo plazo.',
            'Que le cuesta recompensarse cuando tiene éxito y se siente inconforme ante él.',
            'Estar más impulsivo/a, agresivo/a o insatisfecho/a que lo usual.',
            'Tener respuestas de alarma exageradas (se sobresalta con facilidad o tiene pensamientos alarmistas).',
            'Sentirse angustiado/a o tener un nudo en la garganta.',
            'Disminuye su capacidad afectiva o para relacionarse.',
            'Que aumentan sus conflictos interpersonales.',
            'Que crecen sus dificultades para concentrarse en lo que necesita.',
            'Que crecen sus problemas de memoria.',
            'Que baja la calidad de su trabajo y/o rendimiento.',
            'De tener la «mente vacía» o bloqueo mental.',
            'Tener pensamientos catastróficos acerca de su presente o futuro.',
            'Que necesitaría consumir ansiolíticos.',
        ];

        foreach ($questions as $i => $label) {
            $question = $evaluation->questions()->create([
                'label' => $label,
                'type' => QuestionType::Radio,
                'required' => true,
                'position' => $i + 1,
            ]);

            foreach ($frequency as $p => $option) {
                $question->options()->create([...$option, 'position' => $p + 1]);
            }
        }
    }
}
