<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;

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
        ->assertSee('Usuarios');
});

it('opens the mobile menu from the hamburger button', function () {
    $this->actingAs(User::factory()->create());

    visit('/admin/users')
        ->on()->mobile()
        ->assertNoJavaScriptErrors()
        ->click('button[aria-label="Abrir menú"]')
        ->assertSee('Resultados')
        ->assertSee('Cerrar sesión');
});
