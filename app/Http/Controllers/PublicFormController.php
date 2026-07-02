<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubmissionRequest;
use App\Models\Form;
use App\Services\ScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicFormController extends Controller
{
    public function show(Form $form): Response
    {
        $campaign = $form->openCampaign();

        if ($campaign === null) {
            return Inertia::render('public/unavailable', [
                'form' => ['name' => $form->name],
            ]);
        }

        $form->load('evaluations.questions.options');

        return Inertia::render('public/form', [
            'form' => ['name' => $form->name, 'slug' => $form->slug, 'description' => $form->description],
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name],
            'evaluations' => $form->evaluations->map(fn ($evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'description' => $evaluation->description,
                'questions' => $evaluation->questions->map(fn ($q) => [
                    'id' => $q->id,
                    'label' => $q->label,
                    'type' => $q->type->value,
                    'required' => $q->required,
                    'options' => $q->options->map(fn ($o) => ['id' => $o->id, 'label' => $o->label])->values(),
                ])->values(),
            ])->values(),
        ]);
    }

    public function store(Form $form, ScoringService $scoring): RedirectResponse
    {
        $campaign = $form->openCampaign();
        abort_if($campaign === null, 404);

        $form->load('evaluations.questions.options');
        $campaign->setRelation('form', $form);

        // Bind campaign so StoreSubmissionRequest can validate answers against it.
        request()->route()->setParameter('campaign', $campaign);
        $data = app(StoreSubmissionRequest::class)->validated();

        if ($campaign->submissions()->where('work_email', $data['work_email'])->exists()) {
            return back()->withErrors(['work_email' => 'Ya respondiste este formulario.'])->withInput();
        }

        $submission = DB::transaction(function () use ($campaign, $form, $data) {
            $submission = $campaign->submissions()->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'role_function' => $data['role_function'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'marital_status' => $data['marital_status'],
                'children_count' => $data['children_count'],
                'cohabitation_group' => $data['cohabitation_group'],
                'work_email' => $data['work_email'],
                'phone' => $data['phone'],
                'authorizes_medical_access' => $data['authorizes_medical_access'],
                'submitted_at' => now(),
            ]);

            $answers = (array) ($data['answers'] ?? []);
            foreach ($form->evaluations->flatMap->questions as $question) {
                $value = $answers[$question->id] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }

                $option = $question->type->isScored()
                    ? $question->options->firstWhere('id', (int) $value)
                    : null;

                $submission->answers()->create([
                    'question_id' => $question->id,
                    'question_label' => $question->label,
                    'question_type' => $question->type,
                    'question_option_id' => $option?->id,
                    'option_label' => $option?->label,
                    'option_points' => $option?->points,
                    'value_text' => $question->type->isScored() ? null : (string) $value,
                ]);
            }

            return $submission;
        });

        $scoring->computeAndStore($submission);

        return redirect()->route('public-form.thank-you', $form->slug);
    }

    public function thankYou(Form $form): Response
    {
        return Inertia::render('public/thank-you', ['form' => ['name' => $form->name]]);
    }
}
