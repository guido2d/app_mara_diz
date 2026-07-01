<?php

use App\Enums\CohabitationGroup;
use App\Enums\QuestionType;

it('marks only select and radio as scored', function () {
    expect(QuestionType::Radio->isScored())->toBeTrue()
        ->and(QuestionType::Select->isScored())->toBeTrue()
        ->and(QuestionType::Input->isScored())->toBeFalse()
        ->and(QuestionType::Date->isScored())->toBeFalse()
        ->and(QuestionType::Textarea->isScored())->toBeFalse();
});

it('exposes human labels for profile enums', function () {
    expect(CohabitationGroup::WithPartnerAndChildren->label())->toBe('Con pareja e hijos');
});
