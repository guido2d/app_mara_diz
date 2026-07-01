<?php

namespace App\Enums;

enum MaritalStatus: string
{
    case Single = 'soltero';
    case Partnered = 'en_pareja';
    case Married = 'casado';
    case Divorced = 'divorciado';
    case Widowed = 'viudo';

    public function label(): string
    {
        return match ($this) {
            self::Single => 'Soltero/a',
            self::Partnered => 'En pareja',
            self::Married => 'Casado/a',
            self::Divorced => 'Divorciado/a',
            self::Widowed => 'Viudo/a',
        };
    }
}
