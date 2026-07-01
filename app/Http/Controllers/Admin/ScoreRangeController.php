<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateScoreRangesRequest;
use App\Models\Evaluation;
use App\Services\RangeCoverageValidator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ScoreRangeController extends Controller
{
    public function edit(Evaluation $evaluation): Response
    {
        return Inertia::render('admin/ranges/edit', [
            'evaluation' => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'max_points' => $evaluation->maxPossiblePoints(),
                'locked' => $this->hasOpenCampaign($evaluation),
                'ranges' => $evaluation->scoreRanges->map(fn ($r) => [
                    'min_points' => $r->min_points,
                    'max_points' => $r->max_points,
                    'result_text' => $r->result_text,
                ])->values(),
            ],
        ]);
    }

    public function update(UpdateScoreRangesRequest $request, Evaluation $evaluation, RangeCoverageValidator $validator): RedirectResponse
    {
        if ($this->hasOpenCampaign($evaluation)) {
            return back()->withErrors(['ranges' => 'No se puede editar: la evaluación participa en una campaña abierta.']);
        }

        $ranges = $request->validated()['ranges'];

        try {
            $validator->validate($evaluation->maxPossiblePoints(), array_map(
                fn ($r) => ['min_points' => (int) $r['min_points'], 'max_points' => (int) $r['max_points']],
                $ranges,
            ));
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['ranges' => $e->getMessage()]);
        }

        DB::transaction(function () use ($evaluation, $ranges) {
            $evaluation->scoreRanges()->delete();
            foreach (array_values($ranges) as $position => $r) {
                $evaluation->scoreRanges()->create([
                    'min_points' => (int) $r['min_points'],
                    'max_points' => (int) $r['max_points'],
                    'result_text' => $r['result_text'],
                    'position' => $position,
                ]);
            }
        });

        return redirect()->route('admin.evaluations.ranges.edit', $evaluation);
    }

    private function hasOpenCampaign(Evaluation $evaluation): bool
    {
        return $evaluation->forms()->get()->contains(fn ($form) => $form->openCampaign() !== null);
    }
}
