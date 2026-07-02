# Mejora de navegación del panel admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exponer Campañas, Resultados y Usuarios en el menú del panel admin, crear los listados globales de Campañas y Resultados y un ABM de usuarios, y volver el menú responsive (top-bar en desktop + hamburguesa en mobile).

**Architecture:** Backend Laravel con controladores dedicados nuevos para los boards globales (`CampaignBoardController`, `ResultBoardController`) y un `UserController` resource. Frontend Inertia/React: se extrae un `NavLink` reutilizable, se centraliza la lista de ítems en `config/nav.ts` y se refactoriza `AdminShell` para renderizar el menú desde ese array con estado de hamburguesa en mobile. Se reutilizan los componentes existentes del design system "Atelier Glass" (`DataTable`, `Field`, `Button`, `ConfirmDialog`).

**Tech Stack:** Laravel 13 · PHP 8.4 · Inertia 3 · React 19 (TSX) · Tailwind v4 · Pest 4 · Wayfinder.

## Global Constraints

- PHP: usar `declare`-nada especial, pero **type hints y return types explícitos** en todos los métodos (convención del repo).
- FormRequests viven en `App\Http\Requests` (namespace sin subcarpeta `Admin`), igual que `StoreFormRequest`/`StoreCampaignRequest`.
- Copy de UI **en español** con acentos correctos.
- Estilos: usar solo tokens/componentes Atelier Glass existentes (`bg-indigo/12`, `text-ink`, `text-ink-50`, `.glass`, `DataTable`, `buttonClass`, etc.). No introducir librerías nuevas.
- **Sin sistema de roles**: la auth sigue binaria. El único control de acceso es el middleware `auth` ya aplicado al grupo `admin`.
- Rutas nuevas dentro del grupo existente en `routes/admin.php` (`middleware('auth')->prefix('admin')->name('admin.')`).
- Los `<Link>`/hrefs usan **strings de path** (p. ej. `/admin/users`), igual que todo el código actual del proyecto. No migrar a Wayfinder en este plan (sería un refactor transversal fuera de alcance).
- Tras cambios PHP: `vendor/bin/pint --dirty --format agent`.
- Tras cambios frontend: `npm run build` (regla del proyecto para ver cambios).
- Tests con Pest: `php artisan test --compact`. Los feature tests admin usan `beforeEach(fn () => $this->actingAs(User::factory()->create()))`.
- **El proyecto NO está bajo git.** Los pasos "Commit" quedan como *checkpoints de verificación*: correr los tests/build indicados y confirmar verde antes de seguir. Si más adelante se inicializa git, se pueden commitear ahí.

---

## File Structure

**Nuevos (backend)**
- `app/Http/Controllers/Admin/CampaignBoardController.php` — listado global de campañas.
- `app/Http/Controllers/Admin/ResultBoardController.php` — listado global de submissions/resultados.
- `app/Http/Controllers/Admin/UserController.php` — CRUD de usuarios.
- `app/Http/Requests/StoreUserRequest.php` — validación de alta.
- `app/Http/Requests/UpdateUserRequest.php` — validación de edición (password opcional).

**Nuevos (frontend)**
- `resources/js/config/nav.ts` — array de ítems del menú.
- `resources/js/components/ui/nav-link.tsx` — `NavLink` reutilizable extraído del shell.
- `resources/js/pages/admin/campaigns/board.tsx` — página listado global de campañas.
- `resources/js/pages/admin/results/board.tsx` — página listado global de resultados.
- `resources/js/pages/admin/users/index.tsx` — tabla de usuarios + borrado.
- `resources/js/pages/admin/users/create.tsx` — alta.
- `resources/js/pages/admin/users/edit.tsx` — edición.

**Nuevos (tests)**
- `tests/Feature/Admin/CampaignBoardTest.php`
- `tests/Feature/Admin/ResultBoardTest.php`
- `tests/Feature/Admin/UserCrudTest.php`

**Modificados**
- `routes/admin.php` — rutas `campaigns.index`, `results.index`, resource `users`.
- `resources/js/layouts/admin-shell.tsx` — refactor: menú desde config + hamburguesa responsive.

---

## Task 1: Listado global de Campañas

**Files:**
- Create: `app/Http/Controllers/Admin/CampaignBoardController.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/campaigns/board.tsx`
- Test: `tests/Feature/Admin/CampaignBoardTest.php`

**Interfaces:**
- Produces: ruta `GET /admin/campaigns` con nombre `admin.campaigns.index`, render de `admin/campaigns/board` con prop `campaigns: Array<{id:number,name:string,form_id:number,form_name:string,starts_at:string,ends_at:string,is_open:boolean,submissions_count:number}>`.
- Consumes (existentes): rutas `admin.campaigns.close` (`POST /admin/campaigns/{id}/close`), `admin.campaigns.reopen` (`POST /admin/campaigns/{id}/reopen`), resultados `GET /admin/campaigns/{id}/results`.

- [ ] **Step 1: Escribir el test que falla**

Create `tests/Feature/Admin/CampaignBoardTest.php`:

```php
<?php

use App\Models\Campaign;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists all campaigns across every form', function () {
    Campaign::factory()->count(2)->create(); // cada una crea su propio Form

    $this->get('/admin/campaigns')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/campaigns/board')
            ->has('campaigns', 2)
            ->has('campaigns.0', fn ($c) => $c
                ->hasAll(['id', 'name', 'form_id', 'form_name', 'starts_at', 'ends_at', 'is_open', 'submissions_count'])
            )
        );
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/campaigns')->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=CampaignBoardTest`
Expected: FAIL (ruta `/admin/campaigns` no existe → 404, no matchea el componente).

- [ ] **Step 3: Crear el controlador**

Create `app/Http/Controllers/Admin/CampaignBoardController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Inertia\Inertia;
use Inertia\Response;

class CampaignBoardController extends Controller
{
    public function index(): Response
    {
        $campaigns = Campaign::with('form')
            ->withCount('submissions')
            ->latest()
            ->get()
            ->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'form_id' => $campaign->form_id,
                'form_name' => $campaign->form->name,
                'starts_at' => $campaign->starts_at->toDateString(),
                'ends_at' => $campaign->ends_at->toDateString(),
                'is_open' => $campaign->isOpen(),
                'submissions_count' => $campaign->submissions_count,
            ]);

        return Inertia::render('admin/campaigns/board', ['campaigns' => $campaigns]);
    }
}
```

- [ ] **Step 4: Registrar la ruta**

Modify `routes/admin.php` — agregar, dentro del grupo `middleware('auth')->prefix('admin')->name('admin.')`, arriba de la línea `Route::get('forms/{form}/campaigns', ...)`:

```php
    Route::get('campaigns', [CampaignBoardController::class, 'index'])->name('campaigns.index');
```

Y agregar el `use` arriba del archivo:

```php
use App\Http\Controllers\Admin\CampaignBoardController;
```

- [ ] **Step 5: Crear la página**

Create `resources/js/pages/admin/campaigns/board.tsx`:

```tsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Select } from '@/components/ui/field';
import { DataTable, StatusPill, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface CampaignRow {
    id: number;
    name: string;
    form_id: number;
    form_name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
}

/** Convierte una fecha `YYYY-MM-DD` a `DD-MM-YYYY` sin tocar zona horaria. */
function formatDate(iso: string): string {
    const [year, month, day] = iso.split('-');

    return `${day}-${month}-${year}`;
}

export default function CampaignsBoard({ campaigns }: { campaigns: CampaignRow[] }) {
    const [formFilter, setFormFilter] = useState('');
    const forms = Array.from(
        new Map(campaigns.map((c) => [c.form_id, c.form_name])).entries(),
    ).map(([id, name]) => ({ id, name }));
    const hasOpen = campaigns.some((c) => c.is_open);
    const rows = formFilter
        ? campaigns.filter((c) => String(c.form_id) === formFilter)
        : campaigns;

    return (
        <AdminShell title="Campañas">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Campañas
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Todas las campañas de todos los formularios en un solo lugar.
                    </p>
                </div>
                {forms.length > 1 && (
                    <div className="w-56">
                        <Select
                            value={formFilter}
                            onChange={(e) => setFormFilter(e.target.value)}
                            aria-label="Filtrar por formulario"
                        >
                            <option value="">Todos los formularios</option>
                            {forms.map((f) => (
                                <option key={f.id} value={String(f.id)}>
                                    {f.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            {rows.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay campañas.</p>
                </div>
            ) : (
                <DataTable>
                    <thead>
                        <tr>
                            <Th>Formulario</Th>
                            <Th>Campaña</Th>
                            <Th>Desde</Th>
                            <Th>Hasta</Th>
                            <Th>Respuestas</Th>
                            <Th>Estado</Th>
                            <Th className="text-right">Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((c) => (
                            <Tr key={c.id}>
                                <Td className="text-ink-50">{c.form_name}</Td>
                                <Td className="font-medium">{c.name}</Td>
                                <Td className="font-mono text-xs text-ink-50">
                                    {formatDate(c.starts_at)}
                                </Td>
                                <Td className="font-mono text-xs text-ink-50">
                                    {formatDate(c.ends_at)}
                                </Td>
                                <Td>{c.submissions_count}</Td>
                                <Td>
                                    <StatusPill active={c.is_open}>
                                        {c.is_open ? 'Abierta' : 'Cerrada'}
                                    </StatusPill>
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                        <Link
                                            href={`/admin/campaigns/${c.id}/results`}
                                            className="text-indigo hover:underline"
                                        >
                                            Resultados
                                        </Link>
                                        {c.is_open && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`¿Cerrar la campaña “${c.name}”?`)) {
                                                        router.post(`/admin/campaigns/${c.id}/close`);
                                                    }
                                                }}
                                                className="cursor-pointer text-danger hover:underline"
                                            >
                                                Cerrar
                                            </button>
                                        )}
                                        {!c.is_open && !hasOpen && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`¿Reabrir la campaña “${c.name}”?`)) {
                                                        router.post(`/admin/campaigns/${c.id}/reopen`);
                                                    }
                                                }}
                                                className="cursor-pointer text-indigo hover:underline"
                                            >
                                                Reabrir
                                            </button>
                                        )}
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}
        </AdminShell>
    );
}
```

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `php artisan test --compact --filter=CampaignBoardTest`
Expected: PASS (2 tests).

- [ ] **Step 7: Pint + build (checkpoint)**

Run:
```bash
vendor/bin/pint --dirty --format agent
npm run build
```
Expected: Pint sin errores; build compila el nuevo `board.tsx`.

---

## Task 2: Listado global de Resultados

**Files:**
- Create: `app/Http/Controllers/Admin/ResultBoardController.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/results/board.tsx`
- Test: `tests/Feature/Admin/ResultBoardTest.php`

**Interfaces:**
- Produces: ruta `GET /admin/results` nombre `admin.results.index`, render de `admin/results/board` con prop `submissions: Array<{id:number,name:string,work_email:string,form_name:string,campaign_name:string,submitted_at:string,total_points:number}>`.
- Consumes (existente): `GET /admin/submissions/{submission}` (nombre `admin.submissions.show`, página `admin/results/show`).

- [ ] **Step 1: Escribir el test que falla**

Create `tests/Feature/Admin/ResultBoardTest.php`:

```php
<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists submissions across every campaign', function () {
    $evaluation = Evaluation::factory()->create();

    $a = Submission::factory()->create();
    $a->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 7]);

    Submission::factory()->create(); // otra campaña/formulario

    $this->get('/admin/results')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/results/board')
            ->has('submissions', 2)
            ->has('submissions.0', fn ($s) => $s
                ->hasAll(['id', 'name', 'work_email', 'form_name', 'campaign_name', 'submitted_at', 'total_points'])
            )
        );
});

it('sums the total points of a submission', function () {
    $evaluation = Evaluation::factory()->create();
    $submission = Submission::factory()->create();
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 4]);

    $this->get('/admin/results')
        ->assertInertia(fn ($page) => $page->where('submissions.0.total_points', 4));
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/results')->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=ResultBoardTest`
Expected: FAIL (404, ruta inexistente).

- [ ] **Step 3: Crear el controlador**

Create `app/Http/Controllers/Admin/ResultBoardController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Inertia\Inertia;
use Inertia\Response;

class ResultBoardController extends Controller
{
    public function index(): Response
    {
        $submissions = Submission::with('campaign.form', 'results')
            ->latest('submitted_at')
            ->get()
            ->map(fn (Submission $submission) => [
                'id' => $submission->id,
                'name' => "{$submission->first_name} {$submission->last_name}",
                'work_email' => $submission->work_email,
                'form_name' => $submission->campaign->form->name,
                'campaign_name' => $submission->campaign->name,
                'submitted_at' => $submission->submitted_at->toDateTimeString(),
                'total_points' => $submission->results->sum('total_points'),
            ]);

        return Inertia::render('admin/results/board', ['submissions' => $submissions]);
    }
}
```

- [ ] **Step 4: Registrar la ruta**

Modify `routes/admin.php` — agregar debajo de la línea de campaigns.index de la Task 1:

```php
    Route::get('results', [ResultBoardController::class, 'index'])->name('results.index');
```

Y el `use`:

```php
use App\Http\Controllers\Admin\ResultBoardController;
```

- [ ] **Step 5: Crear la página**

Create `resources/js/pages/admin/results/board.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Select } from '@/components/ui/field';
import { DataTable, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface SubmissionRow {
    id: number;
    name: string;
    work_email: string;
    form_name: string;
    campaign_name: string;
    submitted_at: string;
    total_points: number;
}

export default function ResultsBoard({ submissions }: { submissions: SubmissionRow[] }) {
    const [formFilter, setFormFilter] = useState('');
    const forms = Array.from(new Set(submissions.map((s) => s.form_name)));
    const rows = formFilter
        ? submissions.filter((s) => s.form_name === formFilter)
        : submissions;

    return (
        <AdminShell title="Resultados">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Resultados
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Todas las respuestas recibidas, de todas las campañas.
                    </p>
                </div>
                {forms.length > 1 && (
                    <div className="w-56">
                        <Select
                            value={formFilter}
                            onChange={(e) => setFormFilter(e.target.value)}
                            aria-label="Filtrar por formulario"
                        >
                            <option value="">Todos los formularios</option>
                            {forms.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            {rows.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay respuestas.</p>
                </div>
            ) : (
                <DataTable>
                    <thead>
                        <tr>
                            <Th>Formulario</Th>
                            <Th>Campaña</Th>
                            <Th>Empleado</Th>
                            <Th>Email</Th>
                            <Th>Fecha</Th>
                            <Th>Puntaje</Th>
                            <Th className="text-right">Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((s) => (
                            <Tr key={s.id}>
                                <Td className="text-ink-50">{s.form_name}</Td>
                                <Td className="text-ink-50">{s.campaign_name}</Td>
                                <Td className="font-medium">{s.name}</Td>
                                <Td className="text-ink-50">{s.work_email}</Td>
                                <Td className="font-mono text-xs text-ink-50">
                                    {s.submitted_at}
                                </Td>
                                <Td>{s.total_points}</Td>
                                <Td>
                                    <div className="flex items-center justify-end text-sm font-medium">
                                        <Link
                                            href={`/admin/submissions/${s.id}`}
                                            className="text-indigo hover:underline"
                                        >
                                            Ver detalle
                                        </Link>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}
        </AdminShell>
    );
}
```

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `php artisan test --compact --filter=ResultBoardTest`
Expected: PASS (3 tests).

- [ ] **Step 7: Pint + build (checkpoint)**

Run:
```bash
vendor/bin/pint --dirty --format agent
npm run build
```
Expected: sin errores.

---

## Task 3: ABM de Usuarios

**Files:**
- Create: `app/Http/Requests/StoreUserRequest.php`
- Create: `app/Http/Requests/UpdateUserRequest.php`
- Create: `app/Http/Controllers/Admin/UserController.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/users/index.tsx`
- Create: `resources/js/pages/admin/users/create.tsx`
- Create: `resources/js/pages/admin/users/edit.tsx`
- Test: `tests/Feature/Admin/UserCrudTest.php`

**Interfaces:**
- Produces: `Route::resource('users', ...)->except('show')` → nombres `admin.users.{index,create,store,edit,update,destroy}` bajo prefix `admin`.
  - `index` → `admin/users/index`, prop `users: Array<{id:number,name:string,email:string,created_at:string,is_self:boolean}>`.
  - `create` → `admin/users/create` (sin props).
  - `edit` → `admin/users/edit`, prop `user: {id:number,name:string,email:string}`.
- El `password` se hashea automáticamente por el cast `'password' => 'hashed'` del modelo `User`.
- Regla: `destroy` prohíbe eliminar la cuenta propia (`auth()->id()`).

- [ ] **Step 1: Escribir el test que falla**

Create `tests/Feature/Admin/UserCrudTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->actingAs($this->admin);
});

it('lists the users', function () {
    User::factory()->count(2)->create();

    $this->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/users/index')->has('users', 3));
});

it('creates a user with a hashed password', function () {
    $this->post('/admin/users', [
        'name' => 'Nueva Persona',
        'email' => 'nueva@example.com',
        'password' => 'secret123',
    ])->assertRedirect(route('admin.users.index'));

    $user = User::firstWhere('email', 'nueva@example.com');
    expect($user)->not->toBeNull()
        ->and(Hash::check('secret123', $user->password))->toBeTrue();
});

it('rejects a duplicate email on create', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->from('/admin/users/create')
        ->post('/admin/users', [
            'name' => 'X',
            'email' => 'taken@example.com',
            'password' => 'secret123',
        ])
        ->assertRedirect('/admin/users/create')
        ->assertSessionHasErrors('email');
});

it('updates a user without touching the password when left blank', function () {
    $user = User::factory()->create(['password' => Hash::make('original123')]);

    $this->put("/admin/users/{$user->id}", [
        'name' => 'Editado',
        'email' => $user->email,
        'password' => '',
    ])->assertRedirect(route('admin.users.index'));

    $user->refresh();
    expect($user->name)->toBe('Editado')
        ->and(Hash::check('original123', $user->password))->toBeTrue();
});

it('updates the password when a new one is provided', function () {
    $user = User::factory()->create(['password' => Hash::make('original123')]);

    $this->put("/admin/users/{$user->id}", [
        'name' => $user->name,
        'email' => $user->email,
        'password' => 'brandnew123',
    ])->assertRedirect();

    expect(Hash::check('brandnew123', $user->refresh()->password))->toBeTrue();
});

it('lets a user keep their own email on update', function () {
    $this->put("/admin/users/{$this->admin->id}", [
        'name' => 'Yo Mismo',
        'email' => $this->admin->email,
        'password' => '',
    ])
        ->assertRedirect(route('admin.users.index'))
        ->assertSessionHasNoErrors();
});

it('prevents deleting your own account', function () {
    $this->from('/admin/users')
        ->delete("/admin/users/{$this->admin->id}")
        ->assertRedirect('/admin/users')
        ->assertSessionHasErrors('user');

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('deletes another user', function () {
    $other = User::factory()->create();

    $this->delete("/admin/users/{$other->id}")->assertRedirect(route('admin.users.index'));

    expect(User::find($other->id))->toBeNull();
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/users')->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=UserCrudTest`
Expected: FAIL (rutas `/admin/users*` inexistentes).

- [ ] **Step 3: Crear los FormRequests**

Create `app/Http/Requests/StoreUserRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
        ];
    }
}
```

Create `app/Http/Requests/UpdateUserRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['nullable', 'string', Password::defaults()],
        ];
    }
}
```

> Nota: el middleware global `ConvertEmptyStringsToNull` convierte `password => ''` en `null`, por eso `nullable` acepta el campo vacío en la edición.

- [ ] **Step 4: Crear el controlador**

Create `app/Http/Controllers/Admin/UserController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::latest()->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'created_at' => $user->created_at->toDateString(),
            'is_self' => $user->id === auth()->id(),
        ]);

        return Inertia::render('admin/users/index', ['users' => $users]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->only('name', 'email', 'password'));

        return redirect()->route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $attributes = $request->only('name', 'email');

        if ($request->filled('password')) {
            $attributes['password'] = $request->string('password')->value();
        }

        $user->update($attributes);

        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['user' => 'No podés eliminar tu propia cuenta.']);
        }

        $user->delete();

        return redirect()->route('admin.users.index');
    }
}
```

- [ ] **Step 5: Registrar las rutas**

Modify `routes/admin.php` — agregar dentro del grupo, debajo de la línea `results.index`:

```php
    Route::resource('users', UserController::class)->except('show');
```

Y el `use`:

```php
use App\Http\Controllers\Admin\UserController;
```

- [ ] **Step 6: Crear la página index**

Create `resources/js/pages/admin/users/index.tsx`:

```tsx
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Td, Th, Tr } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface UserRow {
    id: number;
    name: string;
    email: string;
    created_at: string;
    is_self: boolean;
}

export default function UsersIndex({ users }: { users: UserRow[] }) {
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setProcessing(true);
        router.delete(`/admin/users/${toDelete.id}`, {
            onFinish: () => {
                setProcessing(false);
                setToDelete(null);
            },
        });
    };

    return (
        <AdminShell title="Usuarios">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">
                        Gestioná quién puede acceder al panel.
                    </p>
                </div>
                <Link href="/admin/users/create" className={buttonClass('primary')}>
                    Nuevo usuario
                </Link>
            </div>

            {users.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">Todavía no hay usuarios.</p>
                </div>
            ) : (
                <DataTable>
                    <thead>
                        <tr>
                            <Th>Nombre</Th>
                            <Th>Email</Th>
                            <Th>Creado</Th>
                            <Th className="text-right">Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <Tr key={u.id}>
                                <Td className="font-medium">{u.name}</Td>
                                <Td className="text-ink-50">{u.email}</Td>
                                <Td className="font-mono text-xs text-ink-50">
                                    {u.created_at}
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                                        <Link
                                            href={`/admin/users/${u.id}/edit`}
                                            className="text-indigo hover:underline"
                                        >
                                            Editar
                                        </Link>
                                        {!u.is_self && (
                                            <button
                                                onClick={() => setToDelete(u)}
                                                className="cursor-pointer text-danger hover:underline"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </DataTable>
            )}

            <ConfirmDialog
                open={toDelete !== null}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar usuario"
                description={
                    toDelete
                        ? `Se eliminará a ${toDelete.name}. Esta acción no se puede deshacer.`
                        : undefined
                }
                processing={processing}
            />
        </AdminShell>
    );
}
```

- [ ] **Step 7: Crear la página create**

Create `resources/js/pages/admin/users/create.tsx`:

```tsx
import { Form, Link } from '@inertiajs/react';
import { Button, buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/field';
import { AdminShell } from '@/layouts/admin-shell';

export default function UserCreate() {
    return (
        <AdminShell title="Nuevo usuario">
            <div className="mx-auto max-w-xl">
                <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
                    Nuevo usuario
                </h1>
                <GlassCard>
                    <Form action="/admin/users" method="post" className="flex flex-col gap-5">
                        {({ errors, processing }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" name="name" required />
                                    <FieldError>{errors.name}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                    <FieldError>{errors.email}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input id="password" name="password" type="password" required />
                                    <FieldError>{errors.password}</FieldError>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando…' : 'Guardar'}
                                    </Button>
                                    <Link href="/admin/users" className={buttonClass('ghost')}>
                                        Cancelar
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
```

- [ ] **Step 8: Crear la página edit**

Create `resources/js/pages/admin/users/edit.tsx`:

```tsx
import { Form, Link } from '@inertiajs/react';
import { Button, buttonClass } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/field';
import { AdminShell } from '@/layouts/admin-shell';

interface Props {
    user: { id: number; name: string; email: string };
}

export default function UserEdit({ user }: Props) {
    return (
        <AdminShell title={`Editar — ${user.name}`}>
            <div className="mx-auto max-w-xl">
                <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
                    Editar usuario
                </h1>
                <GlassCard>
                    <Form
                        action={`/admin/users/${user.id}`}
                        method="put"
                        className="flex flex-col gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" name="name" defaultValue={user.name} required />
                                    <FieldError>{errors.name}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={user.email}
                                        required
                                    />
                                    <FieldError>{errors.email}</FieldError>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input id="password" name="password" type="password" />
                                    <p className="text-xs text-ink-50">
                                        Dejala en blanco para no cambiarla.
                                    </p>
                                    <FieldError>{errors.password}</FieldError>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando…' : 'Guardar'}
                                    </Button>
                                    <Link href="/admin/users" className={buttonClass('ghost')}>
                                        Cancelar
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </GlassCard>
            </div>
        </AdminShell>
    );
}
```

- [ ] **Step 9: Correr los tests para verificar que pasan**

Run: `php artisan test --compact --filter=UserCrudTest`
Expected: PASS (9 tests).

- [ ] **Step 10: Pint + build (checkpoint)**

Run:
```bash
vendor/bin/pint --dirty --format agent
npm run build
```
Expected: sin errores.

---

## Task 4: Navegación responsive (config + NavLink + AdminShell)

**Files:**
- Create: `resources/js/config/nav.ts`
- Create: `resources/js/components/ui/nav-link.tsx`
- Modify: `resources/js/layouts/admin-shell.tsx`
- Test: manual/visual + `php artisan test` (regresión: las páginas admin siguen renderizando con el nuevo shell).

**Interfaces:**
- Consumes: rutas de Tasks 1-3 (`/admin/campaigns`, `/admin/results`, `/admin/users`) y la existente `/admin/forms`.
- Produces: `adminNavItems: NavItem[]` y componente `NavLink({ href, match, onNavigate?, className?, children })`.

- [ ] **Step 1: Crear la config de navegación**

Create `resources/js/config/nav.ts`:

```ts
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
```

- [ ] **Step 2: Extraer `NavLink` a un componente reutilizable**

Create `resources/js/components/ui/nav-link.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    /** Prefijo de URL que activa el estado resaltado. */
    match: string;
    /** Callback tras el click (p. ej. cerrar el menú mobile). */
    onNavigate?: () => void;
    className?: string;
    children: ReactNode;
}

export function NavLink({ href, match, onNavigate, className, children }: NavLinkProps) {
    const { url } = usePage();
    const active = url.startsWith(match);

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                active ? 'bg-indigo/12 text-ink' : 'text-ink-50 hover:text-ink',
                className,
            )}
        >
            {children}
        </Link>
    );
}
```

- [ ] **Step 3: Refactorizar `AdminShell` (menú desde config + hamburguesa)**

Replace `resources/js/layouts/admin-shell.tsx` con:

```tsx
import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { NavLink } from '@/components/ui/nav-link';
import { adminNavItems } from '@/config/nav';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    title?: string;
    children: ReactNode;
}

/** Chrome for the authenticated admin panel: glass top bar + centred content. */
export function AdminShell({ title, children }: AdminShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const logout = () => router.post('/admin/logout');

    return (
        <>
            {title && <Head title={title} />}
            <div className="min-h-screen">
                <header className="sticky top-4 z-30 mx-4 mt-4">
                    <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-4 py-2 sm:px-5">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link
                                href="/admin/forms"
                                className="mr-2 flex items-center gap-2 px-2"
                            >
                                <span className="grid size-7 place-items-center rounded-lg bg-indigo text-[13px] font-semibold text-indigo-ink">
                                    M
                                </span>
                                <span className="font-display text-lg leading-none font-semibold text-ink">
                                    Mara Diz
                                </span>
                            </Link>
                            <div className="hidden items-center gap-1 md:flex">
                                {adminNavItems.map((item) => (
                                    <NavLink key={item.href} href={item.href} match={item.match}>
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className={cn(buttonClass('ghost'), 'hidden md:inline-flex')}
                        >
                            Cerrar sesión
                        </button>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            aria-label="Abrir menú"
                            aria-expanded={mobileOpen}
                            className="grid size-9 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-white/50 md:hidden"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-5"
                                aria-hidden="true"
                            >
                                {mobileOpen ? (
                                    <>
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M4 6h16" />
                                        <path d="M4 12h16" />
                                        <path d="M4 18h16" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </nav>

                    {mobileOpen && (
                        <div className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-[22px] p-3 md:hidden">
                            {adminNavItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    href={item.href}
                                    match={item.match}
                                    onNavigate={() => setMobileOpen(false)}
                                    className="px-4 py-2.5"
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                            <button
                                onClick={logout}
                                className={cn(
                                    buttonClass('ghost'),
                                    'justify-start px-4 py-2.5 text-left',
                                )}
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </header>
                <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
            </div>
        </>
    );
}
```

- [ ] **Step 4: Build para verificar que compila**

Run: `npm run build`
Expected: build exitoso; sin errores de TypeScript (imports `@/config/nav` y `@/components/ui/nav-link` resueltos).

- [ ] **Step 5: Regresión backend (el shell no rompe el render de páginas)**

Run: `php artisan test --compact`
Expected: toda la suite en verde (las páginas admin siguen montando `AdminShell`).

- [ ] **Step 6: Verificación visual manual (responsive)**

Abrir el panel (Herd: URL vía `get-absolute-url`) autenticado y verificar:
- Desktop (≥ `md`): la píldora glass muestra Formularios · Campañas · Resultados · Usuarios; el ítem de la sección actual queda resaltado; "Cerrar sesión" a la derecha.
- Mobile (< `md`, DevTools responsive): los ítems se ocultan y aparece la hamburguesa; al tocarla se abre el panel glass con los 4 ítems + "Cerrar sesión"; al elegir un ítem navega y el panel se cierra.

- [ ] **Step 7: Pint (checkpoint final)**

Run: `vendor/bin/pint --dirty --format agent`
Expected: sin cambios pendientes (no se tocó PHP en esta task, pero se corre por prolijidad si hubo ediciones previas sin formatear).

---

## Self-Review

**1. Spec coverage:**
- Exponer secciones en el menú → Task 4 (`nav.ts` con los 4 ítems). ✔
- Listado global de Campañas → Task 1. ✔
- Listado global de Resultados → Task 2. ✔
- ABM de Usuarios sin roles → Task 3. ✔
- Menú responsive (top-bar + hamburguesa) → Task 4. ✔
- Empleados fuera del menú → no se agrega a `nav.ts`. ✔

**2. Placeholder scan:** Sin TBD/TODO. Todos los steps incluyen código completo o comandos exactos con salida esperada.

**3. Type consistency:**
- Props `campaigns`/`submissions`/`users` coinciden entre controlador (claves del array PHP) y las interfaces TSX de cada página.
- `NavItem`/`adminNavItems` y la firma de `NavLink({href, match, onNavigate?, className?, children})` coinciden entre `nav.ts`, `nav-link.tsx` y su uso en `admin-shell.tsx`.
- Nombres de ruta: `admin.campaigns.index`, `admin.results.index`, `admin.users.*` — sin colisión con las rutas existentes (`admin.campaigns.results/close/reopen`, `admin.submissions.show`).

**Desviaciones conscientes respecto del spec (documentadas):**
- **Sin paginación**: los boards usan `->latest()->get()->map()` como el resto del código (que no pagina). El filtrado por formulario es client-side. Coherente con la escala y las convenciones actuales.
- **FormRequests en `App\Http\Requests`** (no en subcarpeta `Admin`), siguiendo la ubicación de `StoreFormRequest`/`StoreCampaignRequest` existentes.
