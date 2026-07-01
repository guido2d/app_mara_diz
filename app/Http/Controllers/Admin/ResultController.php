<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Submission;
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
                    'result_text' => $r->result_text,
                ]),
            ]),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $submission->load('answers.question', 'answers.option', 'results.evaluation');

        return Inertia::render('admin/results/show', [
            'submission' => [
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
                'answers' => $submission->answers->map(fn ($a) => [
                    'question' => $a->question->label,
                    'value' => $a->option?->label ?? $a->value_text,
                ]),
                'results' => $submission->results->map(fn ($r) => [
                    'evaluation' => $r->evaluation->name,
                    'total_points' => $r->total_points,
                    'result_text' => $r->result_text,
                ]),
            ],
        ]);
    }
}
