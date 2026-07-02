export interface NavItem {
    label: string;
    /** Destino del link. */
    href: string;
    /** Prefijo de URL con el que se marca el ítem como activo. */
    match: string;
}

export const adminNavItems: NavItem[] = [
    { label: 'Formularios', href: '/admin/forms', match: '/admin/forms' },
    { label: 'Campañas', href: '/admin/campaigns', match: '/admin/campaigns' },
    { label: 'Resultados', href: '/admin/results', match: '/admin/results' },
    { label: 'Usuarios', href: '/admin/users', match: '/admin/users' },
];
