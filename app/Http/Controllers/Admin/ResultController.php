<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function index(Campaign $campaign): Response
    {
        $campaign->load('form', 'submissions.results.evaluation');

        return Inertia::render('admin/results/index', [
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name, 'form_id' => $campaign->form->id, 'form_name' => $campaign->form->name],
            'submissions' => $campaign->submissions->map(fn (Submission $s) => [
                'id' => $s->id,
                'name' => "{$s->first_name} {$s->last_name}",
                'work_email' => $s->work_email,
                'submitted_at' => $s->submitted_at->toDateTimeString(),
                'results' => $s->results->map(fn ($r) => [
                    'evaluation' => $r->evaluation->name,
                    'total_points' => $r->total_points,
                ]),
            ]),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $submission->load('answers.question.evaluation', 'answers.option', 'results.evaluation', 'campaign.form');

        $totalsByEvaluation = $submission->results->keyBy('evaluation_id');

        $evaluations = $submission->answers
            ->groupBy(fn ($a) => $a->question->evaluation_id)
            ->map(function ($answers, $evaluationId) use ($totalsByEvaluation) {
                $evaluation = $answers->first()->question->evaluation;

                $scored = $evaluation->isScored();

                return [
                    'evaluation' => $evaluation->name,
                    'position' => $evaluation->position,
                    'scored' => $scored,
                    'total_points' => $scored ? $totalsByEvaluation->get($evaluationId)?->total_points : null,
                    'answers' => $answers->map(fn ($a) => [
                        'question' => $a->question->label,
                        'value' => $a->option?->label ?? $a->value_text,
                        'points' => $scored ? $a->option?->points : null,
                    ])->values(),
                ];
            })
            ->sortBy('position')
            ->values();

        return Inertia::render('admin/results/show', [
            'campaign' => [
                'id' => $submission->campaign->id,
                'name' => $submission->campaign->name,
                'form_id' => $submission->campaign->form->id,
                'form_name' => $submission->campaign->form->name,
            ],
            'submission' => [
                'id' => $submission->id,
                'first_name' => $submission->first_name,
                'last_name' => $submission->last_name,
                'role_function' => $submission->role_function,
                'age' => $submission->age,
                'sex' => $submission->sex->label(),
                'marital_status' => $submission->marital_status->label(),
                'children_count' => $submission->children_count,
                'cohabitation_group' => $submission->cohabitation_group->label(),
                'work_email' => $submission->work_email,
                'phone' => $submission->phone,
                'authorizes_medical_access' => $submission->authorizes_medical_access,
                'evaluations' => $evaluations,
            ],
        ]);
    }

    /**
     * Correct a mistyped work email so the submission groups with the rest of
     * the person's submissions in the comparison. The email is normalized (the
     * model mutator lowercases + trims) and must stay unique within its campaign.
     */
    public function updateEmail(Request $request, Submission $submission): RedirectResponse
    {
        $request->merge([
            'work_email' => mb_strtolower(trim((string) $request->input('work_email'))),
        ]);

        $validated = $request->validate([
            'work_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('submissions', 'work_email')
                    ->where('campaign_id', $submission->campaign_id)
                    ->ignore($submission->id),
            ],
        ]);

        $submission->update($validated);

        return back();
    }

    public function destroy(Submission $submission): RedirectResponse
    {
        $campaignId = $submission->campaign_id;

        $submission->delete();

        return redirect()->route('admin.campaigns.results', $campaignId);
    }
}
