<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReportMetric;
use App\Enums\SignalTone;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\SubmissionAnswer;
use App\Models\SubmissionResult;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FormReportController extends Controller
{
    /**
     * The answer that counts as "tiene el síntoma" in evaluations reported as a
     * yes rate. Answers store the option label denormalised, so the label is the
     * only marker available: their options carry no points to tell them apart.
     */
    private const AFFIRMATIVE_LABEL = 'Sí';

    /**
     * Aggregated report of a form: for every question flagged for the report,
     * the average score of each campaign, so the evolution between takes can be
     * read at a glance.
     */
    public function show(Form $form): Response
    {
        $campaigns = $form->campaigns()->reorder('created_at')->get();
        $campaignIds = $campaigns->pluck('id');

        $evaluations = $form->evaluations()
            ->with(['questions' => fn ($query) => $query->inReport()->with('options')])
            ->get()
            ->filter(fn (Evaluation $evaluation) => $evaluation->questions->isNotEmpty())
            ->values();

        $questionIds = $evaluations->flatMap(fn (Evaluation $evaluation) => $evaluation->questions->pluck('id'));

        $averages = $this->questionAverages($campaignIds, $questionIds);
        $optionCounts = $this->optionCounts($campaignIds, $this->brokenDownQuestionIds($evaluations));
        $totals = $this->evaluationTotals($campaignIds);

        return Inertia::render('admin/reports/show', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
            ],
            'campaigns' => $campaigns->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
            ])->values(),
            'evaluations' => $evaluations->map(fn (Evaluation $evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'is_scored' => $evaluation->isScored(),
                'lower_is_better' => $evaluation->lowerIsBetter(),
                'metric' => $evaluation->reportMetric()->value,
                'totals' => $campaigns->map(fn (Campaign $campaign) => [
                    'campaign_id' => $campaign->id,
                    'average' => $totals->get("{$campaign->id}-{$evaluation->id}"),
                ])->values(),
                'questions' => $evaluation->questions->map(fn (Question $question) => [
                    'id' => $question->id,
                    'label' => $question->label,
                    'distribution' => $this->distributionOf($evaluation, $question, $campaigns, $optionCounts),
                    'values' => $campaigns->map(function (Campaign $campaign) use ($averages, $evaluation, $question) {
                        $row = $averages->get("{$campaign->id}-{$question->id}");

                        return [
                            'campaign_id' => $campaign->id,
                            'value' => $row === null ? null : $this->questionValue($evaluation, $row),
                            'answers' => $row === null ? 0 : (int) $row->answers,
                        ];
                    })->values(),
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * The number the report draws for one question and campaign, on the scale
     * the evaluation asked for: average points, the percentage of people who
     * answered positively, or the percentage who answered "Sí".
     *
     * @param  object{average: mixed, answers: mixed, positives: mixed, affirmatives: mixed}  $row
     */
    private function questionValue(Evaluation $evaluation, object $row): float
    {
        return match ($evaluation->reportMetric()) {
            ReportMetric::PositiveRate => round((int) $row->positives * 100 / (int) $row->answers, 1),
            ReportMetric::YesRate => round((int) $row->affirmatives * 100 / (int) $row->answers, 1),
            ReportMetric::Average => round((float) $row->average, 2),
        };
    }

    /**
     * The questions whose answers are broken down option by option. Only the
     * evaluations reported as an average get the breakdown: the ones reported
     * as a rate already answer "how many people" by construction, and adding a
     * Sí/No table under every question would only repeat the same number.
     *
     * @param  Collection<int, Evaluation>  $evaluations
     * @return Collection<int, int>
     */
    private function brokenDownQuestionIds(Collection $evaluations): Collection
    {
        return $evaluations
            ->filter(fn (Evaluation $evaluation) => $evaluation->reportMetric() === ReportMetric::Average)
            ->flatMap(fn (Evaluation $evaluation) => $evaluation->questions->pluck('id'));
    }

    /**
     * How many people picked each option of a question in every campaign, plus
     * how that share moved against the previous campaign. Returns null for the
     * questions that are not broken down.
     *
     * @param  Collection<int, Campaign>  $campaigns
     * @param  array<string, int>  $counts
     * @return array{options: array<int, array<string, mixed>>, answers: array<int, array<string, int>>}|null
     */
    private function distributionOf(Evaluation $evaluation, Question $question, Collection $campaigns, array $counts): ?array
    {
        if ($evaluation->reportMetric() !== ReportMetric::Average || $question->options->isEmpty()) {
            return null;
        }

        /**
         * The denominator is how many people answered this question in this
         * campaign, not how many took the campaign: somebody who skipped it must
         * not land in the most benign option by omission.
         */
        $answered = $campaigns->mapWithKeys(fn (Campaign $campaign) => [
            $campaign->id => $question->options->sum(
                fn (QuestionOption $option) => $counts["{$campaign->id}-{$option->id}"] ?? 0,
            ),
        ])->all();

        $tones = $this->tonesOf($evaluation, $question->options);

        return [
            'options' => $question->options->map(function (QuestionOption $option) use ($campaigns, $counts, $answered, $evaluation, $tones) {
                /**
                 * Whole percentages, and the difference taken between them: with
                 * decimals the report would print "29%" next to "30%" and call
                 * the gap "0 pp", because the two roundings disagree.
                 */
                $shares = $campaigns->map(fn (Campaign $campaign) => $answered[$campaign->id] === 0
                    ? null
                    : (int) round(($counts["{$campaign->id}-{$option->id}"] ?? 0) * 100 / $answered[$campaign->id]),
                )->values()->all();

                return [
                    'id' => $option->id,
                    'label' => $option->label,
                    'growth_is_good' => $this->growthIsGood($evaluation, $option),
                    'tone' => $tones[$option->points]->value,
                    'counts' => $campaigns->values()->map(fn (Campaign $campaign, int $index) => [
                        'campaign_id' => $campaign->id,
                        'count' => $counts["{$campaign->id}-{$option->id}"] ?? 0,
                        'percent' => $shares[$index],
                        'delta' => $index === 0 || $shares[$index] === null || $shares[$index - 1] === null
                            ? null
                            : $shares[$index] - $shares[$index - 1],
                    ])->values()->all(),
                ];
            })->values()->all(),
            'answers' => $campaigns->map(fn (Campaign $campaign) => [
                'campaign_id' => $campaign->id,
                'total' => $answered[$campaign->id],
            ])->values()->all(),
        ];
    }

    /**
     * The traffic light of every score of a question, keyed by points: green for
     * the most benign option, red for the worst, amber in between. The order
     * comes from the points and the direction of the evaluation, so a question
     * where more points are better greens the top of the scale, not the bottom.
     *
     * @param  Collection<int, QuestionOption>  $options
     * @return array<int, SignalTone>
     */
    private function tonesOf(Evaluation $evaluation, Collection $options): array
    {
        $ranked = $options->pluck('points')->unique()->sort()->values();

        if (! $evaluation->lowerIsBetter()) {
            $ranked = $ranked->reverse()->values();
        }

        $worst = $ranked->count() - 1;

        /**
         * A question whose options all score the same has no scale to paint —
         * every answer gets the neutral amber instead of a green that would
         * suggest they are all the best possible one.
         */
        return $ranked->mapWithKeys(fn (int $points, int $rank) => [
            $points => match (true) {
                $worst === 0 => SignalTone::Warning,
                $rank === 0 => SignalTone::Good,
                $rank === $worst => SignalTone::Bad,
                default => SignalTone::Warning,
            },
        ])->all();
    }

    /**
     * Whether more people choosing this option is an improvement. The direction
     * belongs to the option, not to the evaluation: in "Síntomas psíquicos"
     * fewer points is better, so the report greens a rise in "Cada 15 días" —
     * worth zero points — and reddens a rise in "Casi todos los días".
     */
    private function growthIsGood(Evaluation $evaluation, QuestionOption $option): bool
    {
        return $evaluation->lowerIsBetter()
            ? $option->points === 0
            : $option->points > 0;
    }

    /**
     * How many people picked each option, keyed by "campaignId-optionId". One
     * grouped query for the whole report.
     *
     * @param  Collection<int, int>  $campaignIds
     * @param  Collection<int, int>  $questionIds
     * @return array<string, int>
     */
    private function optionCounts(Collection $campaignIds, Collection $questionIds): array
    {
        if ($campaignIds->isEmpty() || $questionIds->isEmpty()) {
            return [];
        }

        return SubmissionAnswer::query()
            ->join('submissions', 'submissions.id', '=', 'submission_answers.submission_id')
            ->whereIn('submissions.campaign_id', $campaignIds)
            ->whereIn('submission_answers.question_id', $questionIds)
            ->whereNotNull('submission_answers.question_option_id')
            ->groupBy('submissions.campaign_id', 'submission_answers.question_option_id')
            ->select([
                'submissions.campaign_id',
                'submission_answers.question_option_id',
                DB::raw('COUNT(*) as answers'),
            ])
            ->toBase()
            ->get()
            ->mapWithKeys(fn (object $row) => [
                "{$row->campaign_id}-{$row->question_option_id}" => (int) $row->answers,
            ])
            ->all();
    }

    /**
     * Average points, answer count, positive answer count and affirmative answer
     * count per campaign and question, keyed by "campaignId-questionId". One
     * grouped query instead of one per cell.
     *
     * @param  Collection<int, int>  $campaignIds
     * @param  Collection<int, int>  $questionIds
     * @return Collection<string, object>
     */
    private function questionAverages(Collection $campaignIds, Collection $questionIds): Collection
    {
        if ($campaignIds->isEmpty() || $questionIds->isEmpty()) {
            return collect();
        }

        return SubmissionAnswer::query()
            ->join('submissions', 'submissions.id', '=', 'submission_answers.submission_id')
            ->whereIn('submissions.campaign_id', $campaignIds)
            ->whereIn('submission_answers.question_id', $questionIds)
            ->whereNotNull('submission_answers.option_points')
            ->groupBy('submissions.campaign_id', 'submission_answers.question_id')
            ->select([
                'submissions.campaign_id',
                'submission_answers.question_id',
                DB::raw('AVG(submission_answers.option_points) as average'),
                DB::raw('COUNT(*) as answers'),
                DB::raw('SUM(CASE WHEN submission_answers.option_points > 0 THEN 1 ELSE 0 END) as positives'),
            ])
            ->selectRaw(
                'SUM(CASE WHEN submission_answers.option_label = ? THEN 1 ELSE 0 END) as affirmatives',
                [self::AFFIRMATIVE_LABEL],
            )
            ->get()
            ->keyBy(fn (object $row) => "{$row->campaign_id}-{$row->question_id}");
    }

    /**
     * Average evaluation score per campaign, keyed by "campaignId-evaluationId".
     *
     * @param  Collection<int, int>  $campaignIds
     * @return Collection<string, float>
     */
    private function evaluationTotals(Collection $campaignIds): Collection
    {
        if ($campaignIds->isEmpty()) {
            return collect();
        }

        return SubmissionResult::query()
            ->join('submissions', 'submissions.id', '=', 'submission_results.submission_id')
            ->whereIn('submissions.campaign_id', $campaignIds)
            ->groupBy('submissions.campaign_id', 'submission_results.evaluation_id')
            ->select([
                'submissions.campaign_id',
                'submission_results.evaluation_id',
                DB::raw('AVG(submission_results.total_points) as average'),
            ])
            ->get()
            ->mapWithKeys(fn (object $row) => [
                "{$row->campaign_id}-{$row->evaluation_id}" => round((float) $row->average, 2),
            ]);
    }
}
