<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Inertia\Inertia;
use Inertia\Response;

class CampaignBoardController extends Controller
{
    public function index(): Response
    {
        $campaigns = Campaign::with('form')
            ->withCount('submissions')
            ->latest()
            ->get()
            ->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'form_id' => $campaign->form_id,
                'form_name' => $campaign->form->name,
                'starts_at' => $campaign->starts_at->toDateString(),
                'ends_at' => $campaign->ends_at->toDateString(),
                'is_open' => $campaign->isOpen(),
                'submissions_count' => $campaign->submissions_count,
            ]);

        return Inertia::render('admin/campaigns/board', ['campaigns' => $campaigns]);
    }
}
