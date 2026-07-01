<?php

namespace App\Enums;

enum Sex: string
{
    case Female = 'femenino';
    case Male = 'masculino';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Female => 'Femenino',
            self::Male => 'Masculino',
            self::Other => 'Otro / Prefiere no decir',
        };
    }
}
