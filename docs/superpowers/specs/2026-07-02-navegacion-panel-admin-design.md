# Diseño — Mejora de navegación del panel admin

**Fecha:** 2026-07-02
**Estado:** Aprobado para plan de implementación
**Stack:** Laravel 13 · Inertia 3 · React (TSX) · Wayfinder · Tailwind v4 (design system propio "Atelier Glass")

## Problema

El panel admin (`AdminShell`) tiene un único ítem de menú: **Formularios**. Las secciones Campañas, Resultados y Empleados existen pero solo se alcanzan de forma contextual (anidadas dentro de un formulario o campaña). Además, el menú no es responsive: es un top-bar horizontal fijo sin tratamiento para mobile.

## Objetivo

1. Exponer las secciones principales en el menú para acceso rápido: **Formularios, Campañas, Resultados, Usuarios**.
2. Crear **listados globales** de Campañas y Resultados (hoy solo existen versiones anidadas).
3. Agregar un **ABM de Usuarios** (sin sistema de roles).
4. Hacer el menú **responsive** (top-bar en desktop, hamburguesa en mobile).

## Decisiones tomadas

- **Campañas y Resultados**: listados **globales nuevos** (no solo atajos a lo existente).
- **Usuarios**: ABM sin roles. La auth sigue siendo binaria (todo usuario logueado es admin total). El ABM solo gestiona altas/bajas/edición de quién puede entrar.
- **Responsive**: se **mantiene** el top-bar glass en desktop; en mobile (`< md`) colapsa a un botón hamburguesa que despliega un panel glass.
- **Ítems del menú**: Formularios, Campañas, Resultados, Usuarios. **Empleados NO** va al menú (sigue siendo contextual por formulario).
- **Estructura backend**: controladores **dedicados** para los listados globales (no mezclar con los index scoped existentes).

## Fuera de alcance (YAGNI)

- Sistema de roles/permisos (spatie u otro) o campo `role`.
- Listado global de Empleados.
- Rediseño a sidebar.
- Cambios en los formularios públicos.

---

## Arquitectura

### 1. Navegación (frontend)

**Archivos:**
- `resources/js/config/nav.ts` — **nuevo**. Array de ítems del menú usando rutas Wayfinder.
- `resources/js/components/ui/nav-link.tsx` — **nuevo**. Extrae el `NavLink` privado que hoy vive dentro de `admin-shell.tsx` (líneas 11-26), reutilizable.
- `resources/js/layouts/admin-shell.tsx` — **refactor**. Mapea sobre el config; agrega estado y UI de hamburguesa.

**Config de nav** (forma de cada ítem):

```ts
type NavItem = {
    label: string;
    href: string;   // Wayfinder: p.ej. forms.index().url
    match: string;   // prefijo para estado activo, p.ej. '/admin/forms'
};
```

Ítems: Formularios (`admin.forms.index`), Campañas (`admin.campaigns.index`), Resultados (`admin.results.index`), Usuarios (`admin.users.index`).

**Comportamiento responsive de `AdminShell`:**
- **Desktop (`md` y arriba):** la píldora glass horizontal actual; mapea los ítems con `NavLink`; botón "Cerrar sesión" a la derecha.
- **Mobile (`< md`):** marca + botón hamburguesa. Al tocar, abre un panel glass debajo del top-bar con los ítems en columna + "Cerrar sesión".
- Estado con `useState` (`mobileOpen`). El panel se cierra al navegar (al hacer click en un ítem) para no quedar abierto tras la visita Inertia.
- Estado activo: `url.startsWith(item.match)` (mismo criterio que hoy), respetando tokens Atelier Glass (`bg-indigo/12 text-ink` activo vs `text-ink-50 hover:text-ink`).

**Wayfinder:** migrar los strings hardcodeados (`/admin/forms`, `/admin/logout`) a las funciones tipadas generadas en `resources/js/routes/` / `resources/js/actions/`. Correr `wayfinder:generate` tras crear las rutas nuevas.

### 2. Vistas globales (backend + frontend)

#### Campañas global

- **Ruta:** `GET /admin/campaigns` → `admin.campaigns.index`.
- **Controlador:** `App\Http\Controllers\Admin\CampaignBoardController@index` (**nuevo**, dedicado). No se toca `CampaignController` (scoped por formulario), salvo reuso de `close`/`reopen` ya existentes.
- **Datos:** todas las campañas de todos los formularios, con `with()` para evitar N+1 (formulario relacionado + conteo de submissions vía `withCount`). Paginado.
- **Página:** `resources/js/pages/admin/campaigns/board.tsx` (**nueva**). Usa `<Table>` existente. Columnas: Formulario, Campaña, Estado (abierta/cerrada), N.º de respuestas, fechas. Acciones: cerrar/reabrir (rutas `admin.campaigns.close`/`admin.campaigns.reopen` existentes), link a resultados de la campaña (`admin.campaigns.results`). Filtro por formulario.

> Nota: la página anidada existente sigue en `admin/campaigns/index.tsx` (campañas de un formulario). La nueva es `board.tsx` para no colisionar.

#### Resultados global

- **Ruta:** `GET /admin/results` → `admin.results.index`.
- **Controlador:** `App\Http\Controllers\Admin\ResultBoardController@index` (**nuevo**, dedicado). No se toca `ResultController` (scoped: `show`/`destroy` de submissions se reutilizan).
- **Datos:** todas las submissions across campañas, con `with()` (campaña + formulario + resultado). Paginado. Filtros por formulario y por campaña.
- **Página:** `resources/js/pages/admin/results/board.tsx` (**nueva**). Columnas: Formulario, Campaña, Empleado/email, Fecha, Puntaje. Cada fila linkea a la vista de submission existente (`admin.submissions.show` → `results/show.tsx`).

### 3. ABM de Usuarios

- **Rutas:** `Route::resource('users', UserController::class)` bajo el grupo `admin.` (genera `admin.users.{index,create,store,edit,update,destroy}`). Se puede excluir `show` si no se usa.
- **Controlador:** `App\Http\Controllers\Admin\UserController` (**nuevo**).
- **FormRequests:** `StoreUserRequest`, `UpdateUserRequest` (**nuevos**).
  - `name`: requerido, string.
  - `email`: requerido, email, único (en update ignora el propio id).
  - `password`: **requerido en alta**; en edición **opcional** (si viene, se valida y re-hashea; si no, no se toca). `confirmed` si se agrega campo de confirmación.
- **Modelo:** `User` existente. `password` se hashea (cast `hashed` o `Hash::make`).
- **Regla de seguridad:** `destroy` prohíbe que el usuario autenticado se elimine a sí mismo (evita quedarse sin acceso). Devuelve error/redirect con mensaje.
- **Páginas (nuevas):**
  - `resources/js/pages/admin/users/index.tsx` — tabla (Nombre, Email, Creado, acciones editar/eliminar). Borrado con `confirm-dialog.tsx` existente.
  - `resources/js/pages/admin/users/create.tsx` — formulario con `<Field>`/`useForm`.
  - `resources/js/pages/admin/users/edit.tsx` — ídem, password opcional.

---

## Flujo de datos

1. Usuario autenticado carga cualquier página admin → `AdminShell` renderiza el menú desde `nav.ts`.
2. Click en un ítem → visita Inertia a la ruta Wayfinder → controlador correspondiente devuelve `Inertia::render(...)` con props paginados.
3. En mobile, el panel hamburguesa se cierra al navegar.
4. Boards globales: controladores dedicados consultan con eager loading + paginación; las acciones (cerrar campaña, ver/borrar submission) reutilizan rutas existentes.
5. ABM Usuarios: CRUD estándar Inertia (form → store/update → redirect con flash).

## Manejo de errores

- Validación de Usuarios vía FormRequests → errores de Inertia mostrados en los `<Field>`.
- `destroy` de sí mismo → redirect con flash de error, sin borrar.
- Boards: si no hay datos, estado vacío en la tabla (mensaje "sin resultados").
- Consultas siempre con `with()`/`withCount()` para prevenir N+1.

## Testing (Pest, feature tests)

- **UserController:**
  - Alta crea usuario con password hasheado.
  - Edición sin password no cambia el password; con password lo actualiza.
  - Email único (rechaza duplicado; en update ignora el propio).
  - No permite auto-eliminación.
  - Todas las rutas requieren `auth` (invitado redirige a login).
- **Boards globales:**
  - `admin.campaigns.index` rinde e incluye campañas de más de un formulario.
  - `admin.results.index` rinde e incluye submissions de más de una campaña.
- **Smoke:** las páginas admin cargan con el nuevo shell sin errores JS.

## Archivos afectados (resumen)

**Nuevos**
- `resources/js/config/nav.ts`
- `resources/js/components/ui/nav-link.tsx`
- `resources/js/pages/admin/campaigns/board.tsx`
- `resources/js/pages/admin/results/board.tsx`
- `resources/js/pages/admin/users/{index,create,edit}.tsx`
- `app/Http/Controllers/Admin/CampaignBoardController.php`
- `app/Http/Controllers/Admin/ResultBoardController.php`
- `app/Http/Controllers/Admin/UserController.php`
- `app/Http/Requests/Admin/{StoreUserRequest,UpdateUserRequest}.php`
- Tests Pest correspondientes.

**Modificados**
- `resources/js/layouts/admin-shell.tsx` (refactor nav + responsive)
- `routes/admin.php` (rutas nuevas: campaigns.index, results.index, users resource)

**Post-cambios**
- `wayfinder:generate` (regenerar rutas tipadas)
- `npm run build` (ver cambios en la UI)
- `vendor/bin/pint --dirty --format agent`
