<?php

namespace App\Enums;

enum RowMarkColor: string
{
    case Red = 'red';
    case Green = 'green';

    public function label(): string
    {
        return match ($this) {
            self::Red => 'Rojo',
            self::Green => 'Verde',
        };
    }
}
