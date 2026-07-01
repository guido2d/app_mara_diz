<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignReport;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function show(Campaign $campaign, CampaignReport $report): Response
    {
        return Inertia::render('admin/reports/index', [
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name],
            'report' => $report->for($campaign),
        ]);
    }
}
