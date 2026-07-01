<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class WellbeingSeeder extends Seeder
{
    public function run(): void
    {
        $estres = Evaluation::create([
            'name' => 'Nivel de estrés',
            'slug' => 'nivel-de-estres',
            'description' => 'Mide la percepción de estrés en las últimas semanas.',
            'position' => 1,
        ]);

        $frequency = [
            ['label' => 'Nunca', 'points' => 0],
            ['label' => 'A veces', 'points' => 1],
            ['label' => 'Seguido', 'points' => 2],
            ['label' => 'Siempre', 'points' => 3],
        ];

        foreach ([
            '¿Con qué frecuencia te sentiste sobrepasado/a en el trabajo?',
            '¿Con qué frecuencia dormiste mal por preocupaciones laborales?',
            '¿Con qué frecuencia te costó desconectar al terminar el día?',
        ] as $i => $label) {
            $question = $estres->questions()->create([
                'label' => $label,
                'type' => QuestionType::Radio,
                'required' => true,
                'position' => $i + 1,
            ]);
            foreach ($frequency as $p => $option) {
                $question->options()->create([...$option, 'position' => $p + 1]);
            }
        }

        // Pregunta informativa (no puntúa)
        $estres->questions()->create([
            'label' => 'Contanos brevemente qué es lo que más te genera estrés (opcional).',
            'type' => QuestionType::Textarea,
            'required' => false,
            'position' => 4,
        ]);

        // Max posible = 3 preguntas * 3 = 9
        $estres->scoreRanges()->createMany([
            ['min_points' => 0, 'max_points' => 3, 'result_text' => 'Nivel de estrés bajo.', 'position' => 1],
            ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Nivel de estrés moderado.', 'position' => 2],
            ['min_points' => 7, 'max_points' => 9, 'result_text' => 'Nivel de estrés alto.', 'position' => 3],
        ]);
    }
}
