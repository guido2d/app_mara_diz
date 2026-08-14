<?php

use App\Models\Evaluation;
use App\Models\User;

it('precarga la descripción y tilda todas las evaluaciones', function () {
    $this->actingAs(User::factory()->create());
    Evaluation::factory()->count(3)->create();

    $page = visit('/admin/forms/create')
        ->assertNoJavaScriptErrors()
        ->assertSee('Nuevo formulario');

    foreach (Evaluation::pluck('id') as $id) {
        $page->assertChecked("input[name='evaluation_ids[]'][value='{$id}']");
    }

    $page->assertValue(
        '#description',
        "A continuación encontrará cinco evaluaciones que le ayudarán a identificar algunos síntomas que pueden ser consecuencia del estrés sostenido. Sea franco/a en sus respuestas. Este registro será revisado exclusivamente por mí guardando **absoluta confidencialidad**. La empresa solo recibirá un informe general con la cantidad de síntomas promedio por persona sin ningún tipo de individualización.  **Solo si usted lo autoriza al final de la hoja este registro podrá ser leído por el Servicio de Salud**.\n\nPasado un tiempo de terminado el programa le volveré a enviar las 4 primeras tablas para evaluar los cambios que se hayan producido y acordaremos un encuentro virtual para hacerle sugerencias con el objetivo de seguir introduciendo cambios saludables en su vida."
    );
});
