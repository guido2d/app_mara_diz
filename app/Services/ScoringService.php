<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Submission;

class ScoringService
{
    public function computeAndStore(Submission $submission): void
    {
        $submission->loadMissing('answers.option', 'campaign.form.evaluations.questions', 'campaign.form.evaluations.scoreRanges');

        $optionPointsByQuestion = $submission->answers
            ->filter(fn ($answer) => $answer->option !== null)
            ->mapWithKeys(fn ($answer) => [$answer->question_id => (int) $answer->option->points]);

        foreach ($submission->campaign->form->evaluations as $evaluation) {
            $total = $this->totalForEvaluation($evaluation, $optionPointsByQuestion->toArray());
            $range = $evaluation->scoreRanges->first(fn ($r) => $r->contains($total));

            $submission->results()->create([
                'evaluation_id' => $evaluation->id,
                'total_points' => $total,
                'score_range_id' => $range?->id,
                'result_text' => $range?->result_text ?? '',
            ]);
        }
    }

    /**
     * @param  array<int, int>  $optionPointsByQuestion
     */
    private function totalForEvaluation(Evaluation $evaluation, array $optionPointsByQuestion): int
    {
        return (int) $evaluation->questions
            ->filter(fn ($q) => $q->type->isScored())
            ->sum(fn ($q) => $optionPointsByQuestion[$q->id] ?? 0);
    }
}
