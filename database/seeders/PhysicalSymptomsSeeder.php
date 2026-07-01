<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class PhysicalSymptomsSeeder extends Seeder
{
    public function run(): void
    {
        $evaluation = Evaluation::create([
            'name' => 'Síntomas físicos',
            'slug' => 'sintomas-fisicos',
            'description' => 'Mide la frecuencia de manifestaciones físicas asociadas al estrés.',
            'position' => 3,
        ]);

        $frequency = [
            ['label' => 'Cada 15 días o menos', 'points' => 0],
            ['label' => '1 vez por semana', 'points' => 1],
            ['label' => 'Casi todos los días', 'points' => 3],
        ];

        foreach ([
            'Padece de insomnio, duerme mal o demasiado.',
            'Contracturas musculares.',
            'Se siente débil, con pocas energías.',
            'Disfunción sexual o disminución del deseo sexual.',
            'Problemas gástricos: estreñimiento, diarrea, dolor abdominal.',
            'Problemas digestivos: acidez, ardor.',
            'Tiene dificultad para respirar o su respiración es agitada.',
            'Dolor en el pecho.',
            'Palpitaciones o pulso acelerado.',
            'Erupciones en la piel, eczemas, alergia, etc.',
            'Problemas odontológicos: apretar las mandíbulas, gingivitis.',
            'Agotamiento.',
        ] as $i => $label) {
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

        // Max posible = 12 preguntas * 3 = 36
        $evaluation->scoreRanges()->createMany([
            ['min_points' => 0, 'max_points' => 6, 'result_text' => 'Nivel de síntomas físicos bajo.', 'position' => 1],
            ['min_points' => 7, 'max_points' => 18, 'result_text' => 'Nivel de síntomas físicos moderado.', 'position' => 2],
            ['min_points' => 19, 'max_points' => 36, 'result_text' => 'Nivel de síntomas físicos alto.', 'position' => 3],
        ]);
    }
}
