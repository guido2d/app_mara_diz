<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Form pickers for the sections that live inside a form: Reportes and
 * Comparativo. Both list the same thing, so they share one page and differ only
 * in where each row links to.
 */
class FormPickerController extends Controller
{
    public function reports(): Response
    {
        return $this->picker(
            title: 'Reportes',
            description: 'Elegí un formulario para ver la evolución de sus campañas.',
            suffix: 'report',
        );
    }

    public function comparisons(): Response
    {
        return $this->picker(
            title: 'Comparativo',
            description: 'Elegí un formulario para comparar las respuestas de cada empleado.',
            suffix: 'employees',
        );
    }

    private function picker(string $title, string $description, string $suffix): Response
    {
        return Inertia::render('admin/forms/picker', [
            'title' => $title,
            'description' => $description,
            'action' => '/admin/forms',
            'suffix' => $suffix,
            'forms' => $this->forms(),
        ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, campaigns_count: int, submissions_count: int}>
     */
    private function forms(): Collection
    {
        return Form::query()
            ->withCount('campaigns')
            ->withCount(['campaigns as submissions_count' => fn ($query) => $query
                ->join('submissions', 'submissions.campaign_id', '=', 'campaigns.id')])
            ->latest()
            ->get()
            ->map(fn (Form $form) => [
                'id' => $form->id,
                'name' => $form->name,
                'campaigns_count' => $form->campaigns_count,
                'submissions_count' => $form->submissions_count,
            ]);
    }
}
