<?php

namespace Database\Seeders;

use App\Models\Evaluation;
use Illuminate\Database\Seeder;

/**
 * Selects which questions appear in the aggregated report and in which order.
 *
 * Updates existing rows instead of creating them, so it can run over a database
 * already seeded by the evaluation seeders. Running it twice is a no-op.
 */
class ReportQuestionsSeeder extends Seeder
{
    /**
     * Question `position` values per evaluation slug, listed in the order the
     * report must show them. The report order is not the form order: in the
     * psychic symptoms evaluation, question 19 comes before 18.
     *
     * @var array<string, list<int>>
     */
    private const REPORT_QUESTIONS = [
        'senales-de-estres' => [1, 3, 4, 6, 12, 16, 19, 18, 20, 21, 22, 23],
    ];

    /**
     * Evaluations where a higher score is the better outcome.
     *
     * @var list<string>
     */
    private const HIGHER_IS_BETTER = ['conductas-habitos-saludables'];

    public function run(): void
    {
        Evaluation::query()->whereIn('slug', self::HIGHER_IS_BETTER)->update(['lower_is_better' => false]);

        foreach (self::REPORT_QUESTIONS as $slug => $positions) {
            $evaluation = Evaluation::query()->where('slug', $slug)->first();

            if ($evaluation === null) {
                continue;
            }

            $evaluation->questions()->update(['report_position' => null]);

            foreach ($positions as $index => $position) {
                $evaluation->questions()
                    ->where('position', $position)
                    ->update(['report_position' => $index + 1]);
            }
        }
    }
}
