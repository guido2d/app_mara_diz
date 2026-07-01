<?php

use Illuminate\Support\Facades\Schema;

it('creates the submission tables', function () {
    expect(Schema::hasColumns('submissions', [
        'id', 'campaign_id', 'first_name', 'last_name', 'role_function', 'age',
        'sex', 'marital_status', 'children_count', 'cohabitation_group',
        'work_email', 'phone', 'submitted_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('submission_answers', ['id', 'submission_id', 'question_id', 'question_option_id', 'value_text']))->toBeTrue()
        ->and(Schema::hasColumns('submission_results', ['id', 'submission_id', 'evaluation_id', 'total_points', 'score_range_id', 'result_text']))->toBeTrue();
});
