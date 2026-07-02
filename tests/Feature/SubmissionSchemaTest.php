<?php

use Illuminate\Support\Facades\Schema;

it('creates the submission tables', function () {
    expect(Schema::hasColumns('submissions', [
        'id', 'campaign_id', 'first_name', 'last_name', 'role_function', 'age',
        'sex', 'marital_status', 'children_count', 'cohabitation_group',
        'work_email', 'phone', 'submitted_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('submission_answers', [
            'id', 'submission_id', 'question_id', 'question_label', 'question_type',
            'question_option_id', 'option_label', 'option_points', 'value_text',
        ]))->toBeTrue()
        ->and(Schema::hasColumns('submission_results', ['id', 'submission_id', 'evaluation_id', 'total_points']))->toBeTrue()
        ->and(Schema::hasColumn('submission_results', 'score_range_id'))->toBeFalse()
        ->and(Schema::hasColumn('submission_results', 'result_text'))->toBeFalse();
});
