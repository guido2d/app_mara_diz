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
        $campaign->load('form');

        return Inertia::render('admin/reports/index', [
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name, 'form_id' => $campaign->form->id, 'form_name' => $campaign->form->name],
            'report' => $report->for($campaign),
        ]);
    }
}
