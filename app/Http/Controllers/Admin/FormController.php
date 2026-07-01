<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Models\Evaluation;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    public function index(): Response
    {
        $forms = Form::withCount('evaluations')->latest()->get()->map(fn (Form $form) => [
            'id' => $form->id,
            'name' => $form->name,
            'slug' => $form->slug,
            'evaluations_count' => $form->evaluations_count,
            'is_active' => $form->openCampaign() !== null,
        ]);

        return Inertia::render('admin/forms/index', ['forms' => $forms]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/forms/create', ['evaluations' => $this->evaluationOptions()]);
    }

    public function store(StoreFormRequest $request): RedirectResponse
    {
        $form = Form::create([
            'name' => $request->string('name'),
            'slug' => $this->uniqueSlug($request->string('name')),
            'description' => $request->input('description'),
        ]);
        $this->syncEvaluations($form, $request->input('evaluation_ids', []));

        return redirect()->route('admin.forms.index');
    }

    public function edit(Form $form): Response
    {
        return Inertia::render('admin/forms/edit', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
                'evaluation_ids' => $form->evaluations()->pluck('evaluations.id'),
            ],
            'evaluations' => $this->evaluationOptions(),
        ]);
    }

    public function update(UpdateFormRequest $request, Form $form): RedirectResponse
    {
        $form->update([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
        ]);
        $this->syncEvaluations($form, $request->input('evaluation_ids', []));

        return redirect()->route('admin.forms.index');
    }

    public function destroy(Form $form): RedirectResponse
    {
        $form->delete();

        return redirect()->route('admin.forms.index');
    }

    /**
     * @param  array<int, int>  $evaluationIds
     */
    private function syncEvaluations(Form $form, array $evaluationIds): void
    {
        $sync = [];
        foreach (array_values($evaluationIds) as $position => $id) {
            $sync[$id] = ['position' => $position];
        }
        $form->evaluations()->sync($sync);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;
        while (Form::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    /**
     * @return Collection<int, array{id:int, name:string}>
     */
    private function evaluationOptions(): Collection
    {
        return Evaluation::orderBy('position')->get()->map(fn (Evaluation $e) => ['id' => $e->id, 'name' => $e->name]);
    }
}
