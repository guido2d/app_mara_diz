<?php

namespace App\Enums;

enum QuestionType: string
{
    case Input = 'input';
    case Select = 'select';
    case Radio = 'radio';
    case Date = 'date';
    case Textarea = 'textarea';

    public function isScored(): bool
    {
        return in_array($this, [self::Select, self::Radio], true);
    }
}
