<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;

/**
 * One answered campaign over a question with the three usual frequencies, so
 * the report draws its distribution: two people out of four picked the most
 * benign option, one picked each of the other two.
 */
function distributionFixture(): Form
{
    $evaluation = Evaluation::factory()->create(['name' => 'Síntomas psíquicos']);

    $question = $evaluation->questions()->create([
        'label' => 'Preocupaciones persistentes',
        'type' => QuestionType::Radio,
        'required' => true,
        'position' => 1,
        'report_position' => 1,
    ]);

    foreach ([['Cada 15 días', 0], ['1 vez por semana', 1], ['Casi todos los días', 3]] as $position => [$label, $points]) {
        $question->options()->create(['label' => $label, 'points' => $points, 'position' => $position + 1]);
    }

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $campaign = Campaign::factory()->for($form)->create(['name' => 'Primera toma']);

    foreach ([0, 0, 1, 3] as $points) {
        answerWithOption($campaign, $question, $points);
    }

    return $form;
}

/** One person's answer to the question, pointing at the option worth $points. */
function answerWithOption(Campaign $campaign, Question $question, int $points): void
{
    $option = $question->options()->where('points', $points)->first();

    Submission::factory()->for($campaign)->create()->answers()->create([
        'question_id' => $question->id,
        'question_label' => $question->label,
        'question_type' => QuestionType::Radio,
        'question_option_id' => $option->id,
        'option_label' => $option->label,
        'option_points' => $points,
    ]);
}

it('reads each option as a percentage of people and paints it like a traffic light', function () {
    $this->actingAs(User::factory()->create());

    $form = distributionFixture();

    $page = visit("/admin/forms/{$form->id}/report")
        ->assertNoJavaScriptErrors()
        ->click('text=Síntomas psíquicos')
        ->assertSee('50%')
        ->assertSee('(2 per.)')
        ->assertSee('25%')
        ->assertSee('(1 per.)');

    /**
     * The traffic light runs from the option worth nothing down to the worst
     * one, in the order the options are listed.
     */
    $tones = $page->script('Array.from(document.querySelectorAll("[data-tone]")).map((bar) => bar.dataset.tone)');

    expect($tones)->toBe(['good', 'warning', 'bad']);
});
