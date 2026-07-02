<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Inertia\Inertia;
use Inertia\Response;

class ResultBoardController extends Controller
{
    public function index(): Response
    {
        $submissions = Submission::with('campaign.form', 'results')
            ->latest('submitted_at')
            ->get()
            ->map(fn (Submission $submission) => [
                'id' => $submission->id,
                'name' => "{$submission->first_name} {$submission->last_name}",
                'work_email' => $submission->work_email,
                'form_name' => $submission->campaign->form->name,
                'campaign_name' => $submission->campaign->name,
                'submitted_at' => $submission->submitted_at->toDateTimeString(),
                'total_points' => $submission->results->sum('total_points'),
            ]);

        return Inertia::render('admin/results/board', ['submissions' => $submissions]);
    }
}
