<?php

use Illuminate\Support\Facades\Schema;

it('creates the catalog tables with expected columns', function () {
    expect(Schema::hasColumns('evaluations', ['id', 'name', 'slug', 'description', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('questions', ['id', 'evaluation_id', 'label', 'type', 'required', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('question_options', ['id', 'question_id', 'label', 'points', 'position']))->toBeTrue()
        ->and(Schema::hasTable('score_ranges'))->toBeFalse();
});
