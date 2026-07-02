<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Submission;

class ScoringService
{
    /**
     * Store one total-points snapshot per scored evaluation of the submission's form.
     * Totals come from the option points frozen on each answer.
     */
    public function computeAndStore(Submission $submission): void
    {
        $submission->loadMissing('answers', 'campaign.form.evaluations.questions');

        $pointsByQuestion = $submission->answers
            ->mapWithKeys(fn ($answer) => [$answer->question_id => (int) ($answer->option_points ?? 0)]);

        foreach ($submission->campaign->form->evaluations as $evaluation) {
            if (! $evaluation->isScored()) {
                continue;
            }

            $submission->results()->create([
                'evaluation_id' => $evaluation->id,
                'total_points' => $this->totalForEvaluation($evaluation, $pointsByQuestion->toArray()),
            ]);
        }
    }

    /**
     * @param  array<int, int>  $pointsByQuestion
     */
    private function totalForEvaluation(Evaluation $evaluation, array $pointsByQuestion): int
    {
        return (int) $evaluation->questions
            ->filter(fn ($q) => $q->type->isScored())
            ->sum(fn ($q) => $pointsByQuestion[$q->id] ?? 0);
    }
}
