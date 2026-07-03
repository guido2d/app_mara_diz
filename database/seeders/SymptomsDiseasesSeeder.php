<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class SymptomsDiseasesSeeder extends Seeder
{
    public function run(): void
    {
        $evaluation = Evaluation::create([
            'name' => 'Síntomas o enfermedades',
            'slug' => 'sintomas-o-enfermedades',
            'description' => 'Indicá si presentás alguno de los siguientes síntomas o enfermedades.',
            'position' => 6,
            'is_scored' => false,
        ]);

        /** @var array<int, array{label: string, points: int}> $yesNoDontKnow */
        $yesNoDontKnow = [
            ['label' => 'Sí', 'points' => 0],
            ['label' => 'No', 'points' => 0],
            ['label' => 'No sabe', 'points' => 0],
        ];

        /** @var array<int, array{label: string, type: QuestionType}> $questions */
        $questions = [
            ['label' => 'Aumento del nivel de azúcar en sangre', 'type' => QuestionType::Radio],
            ['label' => 'Diabetes', 'type' => QuestionType::Radio],
            ['label' => 'Aumento del colesterol', 'type' => QuestionType::Radio],
            ['label' => 'Hipertensión', 'type' => QuestionType::Radio],
            ['label' => 'Cardiopatía', 'type' => QuestionType::Radio],
            ['label' => 'Cáncer', 'type' => QuestionType::Radio],
            ['label' => 'Aumento de enfermedades tanto infecciosas como virales', 'type' => QuestionType::Radio],
            ['label' => 'Trastornos de ansiedad: fobias, ataque de pánico', 'type' => QuestionType::Radio],
            ['label' => 'En caso de tener algún trastorno de ansiedad, indicar cuál', 'type' => QuestionType::Input],
            ['label' => 'Aumento de accidentes: laborales, domésticos, de tránsito', 'type' => QuestionType::Radio],
            ['label' => 'Depresión diagnosticada', 'type' => QuestionType::Radio],
            ['label' => 'Empeoramiento y/o desencadenamiento de ataques de asma', 'type' => QuestionType::Radio],
            ['label' => 'Úlcera del aparato gástrico', 'type' => QuestionType::Radio],
            ['label' => 'Consume ansiolíticos', 'type' => QuestionType::Radio],
            ['label' => 'En caso de consumir ansiolíticos, indicar cuál', 'type' => QuestionType::Input],
            ['label' => 'Consume antidepresivos', 'type' => QuestionType::Radio],
            ['label' => 'En caso de consumir antidepresivos, indicar cuál', 'type' => QuestionType::Input],
            ['label' => 'Medicación que toma', 'type' => QuestionType::Input],
        ];

        foreach ($questions as $i => $data) {
            $question = $evaluation->questions()->create([
                'label' => $data['label'],
                'type' => $data['type'],
                'required' => $data['type'] === QuestionType::Radio,
                'position' => $i + 1,
            ]);

            if ($data['type'] === QuestionType::Radio) {
                foreach ($yesNoDontKnow as $p => $option) {
                    $question->options()->create([...$option, 'position' => $p + 1]);
                }
            }
        }
    }
}
