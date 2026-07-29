<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\ReportQuestionsSeeder;
use Database\Seeders\StressSignalsSeeder;

it('renders the admin sections without JavaScript errors', function () {
    $this->actingAs(User::factory()->create());

    $evaluation = Evaluation::factory()->create();
    $campaign = Campaign::factory()->open()->create();
    $submission = Submission::factory()->for($campaign)->create();
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 5]);

    $pages = visit([
        '/admin/forms',
        '/admin/campaigns',
        '/admin/results',
        '/admin/reports',
        '/admin/comparativo',
        '/admin/users',
        '/admin/users/create',
    ]);

    $pages->assertNoJavaScriptErrors();
});

it('shows every section in the desktop menu', function () {
    $this->actingAs(User::factory()->create());

    visit('/admin/campaigns')
        ->assertNoJavaScriptErrors()
        ->assertSee('Formularios')
        ->assertSee('Campañas')
        ->assertSee('Resultados')
        ->assertSee('Reportes')
        ->assertSee('Comparativo');

    // Usuarios vive en el dropdown de cuenta, no en la barra: se verifica al abrirlo.
});

it('renders a form report without JavaScript errors', function () {
    $this->actingAs(User::factory()->create());
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'senales-de-estres')->firstOrFail();
    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $campaign = Campaign::factory()->for($form)->open()->create();
    $submission = Submission::factory()->for($campaign)->create();

    foreach ($evaluation->questions()->inReport()->get() as $question) {
        $submission->answers()->create([
            'question_id' => $question->id,
            'question_label' => $question->label,
            'question_type' => QuestionType::Radio,
            'option_label' => '1 vez por semana',
            'option_points' => 1,
        ]);
    }
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 12]);

    visit("/admin/forms/{$form->id}/report")
        ->assertNoJavaScriptErrors()
        ->assertSee('Síntomas psíquicos')
        ->assertDontSee('Tener preocupaciones persistentes.')
        // Clic fuera del título: toda la card abre el colapse.
        ->click('12 preguntas')
        ->assertSee('Tener preocupaciones persistentes.')
        ->click('Síntomas psíquicos')
        ->assertDontSee('Tener preocupaciones persistentes.')
        ->assertNoJavaScriptErrors();
});

it('opens the mobile menu from the hamburger button', function () {
    $this->actingAs(User::factory()->create());

    visit('/admin/users')
        ->on()->mobile()
        ->assertNoJavaScriptErrors()
        ->click('button[aria-label="Abrir menú"]')
        ->assertSee('Resultados')
        ->assertSee('Reportes')
        ->assertSee('Usuarios')
        ->assertSee('Cerrar sesión');
});
