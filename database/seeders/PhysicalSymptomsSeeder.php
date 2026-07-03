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
            'is_scored' => true,
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
    }
}
