<?php

namespace App\Http\Controllers;

use App\Models\Form;
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
            'form' => ['name' => $form->name, 'slug' => $form->slug],
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
}
