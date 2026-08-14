<?php

use App\Models\Form;
use App\Models\User;

it('copies the public form link and confirms it on the button', function () {
    $this->actingAs(User::factory()->create());

    $form = Form::factory()->create(['slug' => 'clima-laboral']);

    visit("/admin/forms/{$form->id}/campaigns")
        ->assertSee('Copiar link')
        ->assertAttribute('a[target="_blank"]', 'href', '/f/clima-laboral')
        ->click('Copiar link')
        ->assertSee('Link copiado')
        ->assertNoJavaScriptErrors();
});
