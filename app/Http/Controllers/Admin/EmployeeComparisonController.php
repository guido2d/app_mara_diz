<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeComparisonController extends Controller
{
    /**
     * List the employees (by normalized email) who answered any campaign of the form.
     */
    public function index(Form $form): Response
    {
        $campaignIds = $form->campaigns()->pluck('id');

        $employees = Submission::query()
            ->whereIn('campaign_id', $campaignIds)
            ->orderByDesc('submitted_at')
            ->get(['work_email', 'first_name', 'last_name', 'campaign_id', 'submitted_at'])
            ->groupBy('work_email')
            ->map(fn (Collection $group) => [
                'email' => $group->first()->work_email,
                'name' => "{$group->first()->first_name} {$group->first()->last_name}",
                'campaigns_answered' => $group->pluck('campaign_id')->unique()->count(),
                'last_submitted_at' => $group->first()->submitted_at->toDateString(),
            ])
            ->sortBy('email')
            ->values();

        return Inertia::render('admin/employees/index', [
            'form' => ['id' => $form->id, 'name' => $form->name],
            'employees' => $employees,
        ]);
    }

    /**
     * Compare one employee's individual answers campaign by campaign.
     */
    public function show(Form $form, Request $request): Response
    {
        $email = mb_strtolower(trim((string) $request->query('email')));
        abort_if($email === '', 404);

        $campaigns = $form->campaigns()->reorder('starts_at')->get();

        $submissions = Submission::query()
            ->whereIn('campaign_id', $campaigns->pluck('id'))
            ->where('work_email', $email)
            ->with(['answers', 'results'])
            ->get()
            ->keyBy('campaign_id');

        abort_if($submissions->isEmpty(), 404);

        $latest = $submissions->sortByDesc('submitted_at')->first();

        $form->load('evaluations.questions');

        $evaluations = $form->evaluations->map(function ($evaluation) use ($campaigns, $submissions) {
            $scored = $evaluation->isScored();

            $questions = $evaluation->questions->map(fn ($question) => [
                'id' => $question->id,
                'label' => $question->label,
                'cells' => $campaigns->map(function ($campaign) use ($submissions, $question) {
                    $submission = $submissions->get($campaign->id);

                    if ($submission === null) {
                        return ['campaign_id' => $campaign->id, 'answered' => false, 'display' => null];
                    }

                    $answer = $submission->answers->firstWhere('question_id', $question->id);
                    $display = match (true) {
                        $answer === null => '—',
                        $answer->option_label !== null => "{$answer->option_label} ({$answer->option_points})",
                        default => (string) $answer->value_text,
                    };

                    return ['campaign_id' => $campaign->id, 'answered' => true, 'display' => $display];
                })->values(),
            ])->values();

            return [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'scored' => $scored,
                'questions' => $questions,
                'totals' => $scored
                    ? $campaigns->map(fn ($campaign) => [
                        'campaign_id' => $campaign->id,
                        'total' => $submissions->get($campaign->id)?->results->firstWhere('evaluation_id', $evaluation->id)?->total_points,
                    ])->values()
                    : [],
            ];
        })->values();

        $generalTotals = $campaigns->map(function ($campaign) use ($submissions) {
            $submission = $submissions->get($campaign->id);

            return [
                'campaign_id' => $campaign->id,
                'total' => $submission === null ? null : (int) $submission->results->sum('total_points'),
            ];
        })->values();

        return Inertia::render('admin/employees/show', [
            'form' => ['id' => $form->id, 'name' => $form->name],
            'employee' => [
                'email' => $email,
                'name' => "{$latest->first_name} {$latest->last_name}",
                'profile' => [
                    'role_function' => $latest->role_function,
                    'age' => $latest->age,
                    'sex' => $latest->sex->label(),
                    'marital_status' => $latest->marital_status->label(),
                    'children_count' => $latest->children_count,
                    'cohabitation_group' => $latest->cohabitation_group->label(),
                    'phone' => $latest->phone,
                ],
            ],
            'campaigns' => $campaigns->map(fn ($campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'starts_at' => $campaign->starts_at->toDateString(),
                'answered' => $submissions->has($campaign->id),
            ])->values(),
            'evaluations' => $evaluations,
            'general_totals' => $generalTotals,
        ]);
    }
}
