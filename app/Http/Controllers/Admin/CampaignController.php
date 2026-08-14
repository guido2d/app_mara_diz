<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCampaignRequest;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Form $form): Response
    {
        $campaigns = $form->campaigns()
            ->reorder('created_at')
            ->withCount('submissions')
            ->with('evaluations:id,name')
            ->get();

        return Inertia::render('admin/campaigns/index', [
            'form' => ['id' => $form->id, 'name' => $form->name, 'slug' => $form->slug],
            'evaluations' => $form->evaluations->map(fn (Evaluation $e) => ['id' => $e->id, 'name' => $e->name])->values(),
            'campaigns' => $campaigns->map(fn (Campaign $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'starts_at' => $c->starts_at->toDateString(),
                'ends_at' => $c->ends_at->toDateString(),
                'is_open' => $c->isOpen(),
                'submissions_count' => $c->submissions_count,
                'evaluations' => $c->evaluations->map(fn (Evaluation $e) => $e->name)->values(),
            ])->values(),
        ]);
    }

    public function store(StoreCampaignRequest $request, Form $form): RedirectResponse
    {
        if ($form->openCampaign() !== null) {
            return back()->withErrors(['name' => 'Este formulario ya tiene una campaña abierta. Cerrala antes de abrir otra.']);
        }

        $campaign = $form->campaigns()->create($request->safe()->except('evaluation_ids'));
        $campaign->evaluations()->attach($this->positionedEvaluations($form, $request->input('evaluation_ids', [])));

        return redirect()->route('admin.forms.campaigns.index', $form);
    }

    public function close(Campaign $campaign): RedirectResponse
    {
        $campaign->update(['closed_at' => now()]);

        return redirect()->route('admin.forms.campaigns.index', $campaign->form_id);
    }

    public function reopen(Campaign $campaign): RedirectResponse
    {
        if ($campaign->form->openCampaign() !== null) {
            return back()->withErrors(['name' => 'Este formulario ya tiene una campaña abierta. Cerrala antes de reabrir otra.']);
        }

        $attributes = ['closed_at' => null];

        if ($campaign->ends_at->endOfDay()->isPast()) {
            $attributes['ends_at'] = now()->addDays(7)->startOfDay();
        }

        $campaign->update($attributes);

        return redirect()->route('admin.forms.campaigns.index', $campaign->form_id);
    }

    /**
     * Deleting a campaign cascades to its submissions, answers and results.
     * The UI warns about that whenever the campaign already has responses.
     */
    public function destroy(Campaign $campaign): RedirectResponse
    {
        $formId = $campaign->form_id;

        $campaign->delete();

        return redirect()->route('admin.forms.campaigns.index', $formId);
    }

    /**
     * Keep the campaign's own ordering, copied from the form's evaluation order.
     *
     * @param  array<int, int|string>  $evaluationIds
     * @return array<int, array{position: int}>
     */
    private function positionedEvaluations(Form $form, array $evaluationIds): array
    {
        $selected = array_map('intval', $evaluationIds);
        $attach = [];
        $position = 0;

        foreach ($form->evaluations as $evaluation) {
            if (in_array($evaluation->id, $selected, true)) {
                $attach[$evaluation->id] = ['position' => $position];
                $position++;
            }
        }

        return $attach;
    }
}
