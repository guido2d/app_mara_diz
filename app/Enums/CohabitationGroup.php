<?php

namespace App\Enums;

enum CohabitationGroup: string
{
    case Alone = 'solo';
    case WithPartner = 'con_pareja';
    case WithPartnerAndChildren = 'con_pareja_e_hijos';
    case WithChildren = 'con_hijos';
    case WithFamily = 'con_padres_familia';
    case WithOthers = 'con_companeros_otros';

    public function label(): string
    {
        return match ($this) {
            self::Alone => 'Solo/a',
            self::WithPartner => 'Con pareja',
            self::WithPartnerAndChildren => 'Con pareja e hijos',
            self::WithChildren => 'Con hijos',
            self::WithFamily => 'Con padres/familia',
            self::WithOthers => 'Con compañeros/otros',
        };
    }
}
