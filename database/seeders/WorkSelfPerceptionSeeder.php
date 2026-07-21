<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class WorkSelfPerceptionSeeder extends Seeder
{
    public function run(): void
    {
        $evaluation = Evaluation::create([
            'name' => 'Autopercepciones del trabajo',
            'slug' => 'autopercepciones-del-trabajo',
            'description' => 'Preguntas de respuesta numérica sobre la percepción del propio trabajo. No genera puntaje ni interpretación.',
            'position' => 5,
            'is_scored' => false,
            'allows_row_marks' => true,
        ]);

        // Todas las preguntas son de respuesta numérica libre, sin puntaje ni rangos.
        foreach ([
            '¿Qué tan feliz se siente en su trabajo? (de 0 a 10)',
            '¿Qué tan estresado se siente en su trabajo? (de 0 a 10)',
            '¿Siente que su trabajo tiene algún propósito? (de 0 a 10)',
            '¿Con cuántas personas de su trabajo podría contar si tiene problemas emocionales?',
        ] as $i => $label) {
            $evaluation->questions()->create([
                'label' => $label,
                'type' => QuestionType::Input,
                'required' => true,
                'position' => $i + 1,
            ]);
        }
    }
}
