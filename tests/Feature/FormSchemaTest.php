<?php

use Illuminate\Support\Facades\Schema;

it('creates the form and campaign tables', function () {
    expect(Schema::hasColumns('forms', ['id', 'name', 'slug', 'description']))->toBeTrue()
        ->and(Schema::hasColumns('evaluation_form', ['id', 'form_id', 'evaluation_id', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('campaigns', ['id', 'form_id', 'name', 'starts_at', 'ends_at', 'closed_at']))->toBeTrue();
});
