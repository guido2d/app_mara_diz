<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\SubmissionResult;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FormReportController extends Controller
{
    /**
     * Aggregated report of a form: for every question flagged for the report,
     * the average score of each campaign, so the evolution between takes can be
     * read at a glance.
     */
    public function show(Form $form): Response
    {
        $campaigns = $form->campaigns()->reorder('created_at')->withCount('submissions')->get();
        $campaignIds = $campaigns->pluck('id');

        $evaluations = $form->evaluations()
            ->with(['questions' => fn ($query) => $query->inReport()])
            ->get()
            ->filter(fn (Evaluation $evaluation) => $evaluation->questions->isNotEmpty())
            ->values();

        $questionIds = $evaluations->flatMap(fn (Evaluation $evaluation) => $evaluation->questions->pluck('id'));

        $averages = $this->questionAverages($campaignIds, $questionIds);
        $totals = $this->evaluationTotals($campaignIds);

        return Inertia::render('admin/reports/show', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
            ],
            'campaigns' => $campaigns->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'starts_at' => $campaign->starts_at->toDateString(),
                'ends_at' => $campaign->ends_at->toDateString(),
                'is_open' => $campaign->isOpen(),
                'submissions_count' => $campaign->submissions_count,
            ])->values(),
            'participants_count' => Submission::query()
                ->whereIn('campaign_id', $campaignIds)
                ->distinct()
                ->count('work_email'),
            'evaluations' => $evaluations->map(fn (Evaluation $evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'lower_is_better' => $evaluation->lowerIsBetter(),
                'totals' => $campaigns->map(fn (Campaign $campaign) => [
                    'campaign_id' => $campaign->id,
                    'average' => $totals->get("{$campaign->id}-{$evaluation->id}"),
                ])->values(),
                'questions' => $evaluation->questions->map(fn (Question $question) => [
                    'id' => $question->id,
                    'label' => $question->label,
                    'values' => $campaigns->map(function (Campaign $campaign) use ($averages, $question) {
                        $row = $averages->get("{$campaign->id}-{$question->id}");

                        return [
                            'campaign_id' => $campaign->id,
                            'average' => $row === null ? null : round((float) $row->average, 2),
                            'answers' => $row === null ? 0 : (int) $row->answers,
                        ];
                    })->values(),
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * Average points and answer count per campaign and question, keyed by
     * "campaignId-questionId". One grouped query instead of one per cell.
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
            ])
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
