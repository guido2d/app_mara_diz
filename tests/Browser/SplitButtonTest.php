<?php

use App\Models\Form;
use App\Models\User;

/**
 * `FormActions` se renderiza dos veces (tabla desktop + tarjeta mobile), así que
 * el selector apunta al primero para no chocar con el modo estricto.
 */
const TRIGGER = 'button[aria-label="Más acciones"] >> nth=0';

it('opens the form actions menu with every action visible', function () {
    $this->actingAs(User::factory()->create());
    Form::factory()->create(['name' => 'Evaluación Empresa X']);

    visit('/admin/forms')
        ->assertNoJavaScriptErrors()
        ->assertDontSee('Editar')
        ->click(TRIGGER)
        ->assertSee('Reporte')
        ->assertSee('Comparativo')
        ->assertSee('Editar');
});
