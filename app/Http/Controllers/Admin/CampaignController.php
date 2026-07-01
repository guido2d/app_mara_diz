<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCampaignRequest;
use App\Models\Campaign;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Form $form): Response
    {
        return Inertia::render('admin/campaigns/index', [
            'form' => ['id' => $form->id, 'name' => $form->name],
            'campaigns' => $form->campaigns->map(fn (Campaign $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'starts_at' => $c->starts_at->toDateString(),
                'ends_at' => $c->ends_at->toDateString(),
                'is_open' => $c->isOpen(),
                'submissions_count' => $c->submissions()->count(),
            ]),
        ]);
    }

    public function store(StoreCampaignRequest $request, Form $form): RedirectResponse
    {
        if ($form->openCampaign() !== null) {
            return back()->withErrors(['name' => 'Este formulario ya tiene una campaña abierta. Cerrala antes de abrir otra.']);
        }

        $form->campaigns()->create($request->validated());

        return redirect()->route('admin.forms.campaigns.index', $form);
    }

    public function close(Campaign $campaign): RedirectResponse
    {
        $campaign->update(['closed_at' => now()]);

        return redirect()->route('admin.forms.campaigns.index', $campaign->form_id);
    }
}
