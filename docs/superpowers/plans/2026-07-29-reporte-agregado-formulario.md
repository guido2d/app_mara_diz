# Reporte agregado por formulario — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`) para seguimiento.

**Goal:** Un reporte por formulario que compara campañas con gráficos de barras a nivel población, arrancando por 12 preguntas curadas de Síntomas psíquicos.

**Architecture:** Dos columnas nuevas (`questions.report_position` para elegir y ordenar qué preguntas entran, `evaluations.lower_is_better` para saber en qué dirección está la mejora), un controlador que agrega promedios con dos queries `GROUP BY`, y una página React que dibuja barras con divs y Tailwind. Ningún gráfico usa librerías externas.

**Tech Stack:** Laravel 13 · Inertia 3 · React 19 (TSX) · Tailwind v4 (design system propio "Atelier Glass") · Pest 4

**Spec:** `docs/superpowers/specs/2026-07-29-reporte-agregado-formulario-design.md`

## Global Constraints

- **No agregar dependencias npm ni composer.** Las barras se hacen con divs y Tailwind.
- **PHP 8.4**: llaves siempre en estructuras de control, property promotion en constructores, tipos de retorno explícitos, PHPDoc con array shapes.
- **Pint**: correr `vendor/bin/pint --dirty --format agent` antes de cerrar cada tarea que toque PHP.
- **Build**: correr `npm run build` al terminar las tareas de frontend (requisito del CLAUDE.md del proyecto).
- **Tests**: `php artisan test --compact --filter=<nombre>`.
- **Idioma**: todo el texto visible al usuario en español rioplatense, con acentos correctos. Comentarios de código en inglés, siguiendo la convención del repo.
- **Tokens de diseño**: usar `ink`, `ink-50`, `indigo`, `indigo-ink`, `canvas`, `glass`, `font-display`, `font-mono`. No inventar colores nuevos ni hardcodear hex.
- **URLs en React**: como strings (`/admin/forms/${id}/report`), siguiendo la convención de las páginas existentes.

---

### Task 1: Columna `report_position` en `questions`

**Files:**
- Create: `database/migrations/2026_07_29_100001_add_report_position_to_questions_table.php`
- Modify: `app/Models/Question.php`
- Test: `tests/Feature/ReportSchemaTest.php`

**Interfaces:**
- Produces: `Question::scopeInReport(Builder $query): void` — filtra las preguntas marcadas y las ordena por `report_position`, descartando cualquier orden previo.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/Feature/ReportSchemaTest.php`:

```php
<?php

use App\Models\Evaluation;
use App\Models\Question;

it('only includes questions flagged for the report, ordered by report position', function () {
    $evaluation = Evaluation::factory()->create();

    $evaluation->questions()->create(['label' => 'Fuera del reporte', 'type' => 'radio', 'required' => true, 'position' => 1]);
    $evaluation->questions()->create(['label' => 'Segunda del reporte', 'type' => 'radio', 'required' => true, 'position' => 2, 'report_position' => 2]);
    $evaluation->questions()->create(['label' => 'Primera del reporte', 'type' => 'radio', 'required' => true, 'position' => 3, 'report_position' => 1]);

    $labels = Question::query()->where('evaluation_id', $evaluation->id)->inReport()->pluck('label');

    expect($labels->all())->toBe(['Primera del reporte', 'Segunda del reporte']);
});

it('ignores the form position when ordering the report questions', function () {
    $evaluation = Evaluation::factory()->create();

    $evaluation->questions()->create(['label' => 'Va segunda', 'type' => 'radio', 'required' => true, 'position' => 1, 'report_position' => 2]);
    $evaluation->questions()->create(['label' => 'Va primera', 'type' => 'radio', 'required' => true, 'position' => 2, 'report_position' => 1]);

    expect($evaluation->questions()->inReport()->pluck('label')->all())
        ->toBe(['Va primera', 'Va segunda']);
});
```

El segundo test es el importante: `Evaluation::questions()` ya trae `->orderBy('position')`, así que si el scope usara `orderBy` en vez de `reorder`, el SQL quedaría `ORDER BY position, report_position` y el orden del reporte se ignoraría.

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=ReportSchemaTest`
Expected: FAIL — `Call to undefined method ...::inReport()`

- [ ] **Step 3: Crear la migración**

Run: `php artisan make:migration add_report_position_to_questions_table --no-interaction`

Renombrar el archivo generado a `2026_07_29_100001_add_report_position_to_questions_table.php` y escribir:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->unsignedSmallInteger('report_position')->nullable()->after('position');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('report_position');
        });
    }
};
```

- [ ] **Step 4: Agregar el scope y el fillable en `app/Models/Question.php`**

Agregar `'report_position'` al array `$fillable`:

```php
protected $fillable = ['evaluation_id', 'label', 'type', 'required', 'position', 'report_position'];
```

Agregar el import `use Illuminate\Database\Eloquent\Builder;` y el scope al final de la clase:

```php
/**
 * Questions selected for the aggregated report, in the order the report shows
 * them. Uses `reorder` because the `questions` relation already orders by
 * `position`, which is a different sequence than the report's.
 *
 * @param  Builder<Question>  $query
 */
public function scopeInReport(Builder $query): void
{
    $query->whereNotNull('report_position')->reorder('report_position');
}
```

- [ ] **Step 5: Correr la migración y los tests**

Run: `php artisan migrate && php artisan test --compact --filter=ReportSchemaTest`
Expected: PASS (2 tests)

- [ ] **Step 6: Formatear y commitear**

```bash
vendor/bin/pint --dirty --format agent
git add database/migrations app/Models/Question.php tests/Feature/ReportSchemaTest.php
git commit -m "Marcar qué preguntas entran al reporte y en qué orden"
```

---

### Task 2: Columna `lower_is_better` en `evaluations`

**Files:**
- Create: `database/migrations/2026_07_29_100002_add_lower_is_better_to_evaluations_table.php`
- Modify: `app/Models/Evaluation.php`, `database/factories/EvaluationFactory.php`
- Test: `tests/Feature/EvaluationModelTest.php`

**Interfaces:**
- Produces: `Evaluation::lowerIsBetter(): bool` — `true` cuando menos puntos significa mejor.
- Produces: `EvaluationFactory::higherIsBetter(): static` — estado para evaluaciones donde más puntos es mejor.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `tests/Feature/EvaluationModelTest.php`:

```php
it('treats fewer points as an improvement by default', function () {
    expect(Evaluation::factory()->create()->lowerIsBetter())->toBeTrue();
});

it('can mark an evaluation where more points is an improvement', function () {
    expect(Evaluation::factory()->higherIsBetter()->create()->lowerIsBetter())->toBeFalse();
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=EvaluationModelTest`
Expected: FAIL — `Call to undefined method App\Models\Evaluation::lowerIsBetter()`

- [ ] **Step 3: Crear la migración**

Run: `php artisan make:migration add_lower_is_better_to_evaluations_table --no-interaction`

Renombrar a `2026_07_29_100002_add_lower_is_better_to_evaluations_table.php` y escribir:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->boolean('lower_is_better')->default(true)->after('is_scored');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn('lower_is_better');
        });
    }
};
```

- [ ] **Step 4: Actualizar `app/Models/Evaluation.php`**

Agregar `'lower_is_better'` al `$fillable`:

```php
protected $fillable = ['name', 'slug', 'description', 'position', 'is_scored', 'allows_row_marks', 'lower_is_better'];
```

Agregar el cast dentro de `casts()`:

```php
'lower_is_better' => 'boolean',
```

Agregar el método después de `allowsRowMarks()`:

```php
/**
 * Which direction counts as an improvement. In symptom evaluations more points
 * means worse, but in "Conductas y hábitos saludables" the scale is inverted:
 * each healthy habit adds a point. The report colours its deltas with this so
 * green always means "mejoró".
 */
public function lowerIsBetter(): bool
{
    return $this->lower_is_better;
}
```

- [ ] **Step 5: Agregar el estado a `database/factories/EvaluationFactory.php`**

Agregar `'lower_is_better' => true,` al array de `definition()`, y este estado después de `unscored()`:

```php
/**
 * An evaluation where a higher score is the better outcome, such as healthy habits.
 */
public function higherIsBetter(): static
{
    return $this->state(fn () => ['lower_is_better' => false]);
}
```

- [ ] **Step 6: Correr la migración y los tests**

Run: `php artisan migrate && php artisan test --compact --filter=EvaluationModelTest`
Expected: PASS

- [ ] **Step 7: Formatear y commitear**

```bash
vendor/bin/pint --dirty --format agent
git add database app/Models/Evaluation.php tests/Feature/EvaluationModelTest.php
git commit -m "Definir en qué dirección mejora cada evaluación"
```

---

### Task 3: Seeder de las preguntas del reporte

**Files:**
- Create: `database/seeders/ReportQuestionsSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/SeedersTest.php`

**Interfaces:**
- Consumes: `questions.report_position` (Task 1), `evaluations.lower_is_better` (Task 2).
- Produces: las 12 preguntas de `senales-de-estres` marcadas con `report_position` 1..12, y `conductas-habitos-saludables` con `lower_is_better = false`.

**Nota importante:** la base ya tiene las evaluaciones creadas por los seeders originales. Este seeder **actualiza registros existentes** buscándolos por slug y `position`; no crea nada. Así se puede correr sobre la base actual sin duplicar datos, y es idempotente.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `tests/Feature/SeedersTest.php` (y agregar los imports `use App\Models\Question;` y `use Database\Seeders\HealthyHabitsSeeder;` y `use Database\Seeders\ReportQuestionsSeeder;` arriba):

```php
it('flags the twelve psychic symptom questions for the report in the requested order', function () {
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'senales-de-estres')->firstOrFail();
    $positions = $evaluation->questions()->inReport()->pluck('position');

    expect($positions->all())->toBe([1, 3, 4, 6, 12, 16, 19, 18, 20, 21, 22, 23])
        ->and(Question::whereNotNull('report_position')->count())->toBe(12);
});

it('marks healthy habits as an evaluation where more points is better', function () {
    $this->seed(HealthyHabitsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Evaluation::where('slug', 'conductas-habitos-saludables')->firstOrFail()->lowerIsBetter())->toBeFalse()
        ->and(Evaluation::where('slug', 'senales-de-estres')->first()?->lowerIsBetter())->toBeNull();
});

it('can be seeded twice without changing the result', function () {
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Question::whereNotNull('report_position')->count())->toBe(12);
});
```

El segundo test verifica de paso que el seeder no explota cuando la evaluación de estrés no está sembrada: `first()?->lowerIsBetter()` devuelve `null` porque no existe la fila.

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `php artisan test --compact --filter=SeedersTest`
Expected: FAIL — `Class "Database\Seeders\ReportQuestionsSeeder" not found`

- [ ] **Step 3: Crear el seeder**

Run: `php artisan make:seeder ReportQuestionsSeeder --no-interaction`

Escribir `database/seeders/ReportQuestionsSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Evaluation;
use Illuminate\Database\Seeder;

/**
 * Selects which questions appear in the aggregated report and in which order.
 *
 * Updates existing rows instead of creating them, so it can run over a database
 * already seeded by the evaluation seeders. Running it twice is a no-op.
 */
class ReportQuestionsSeeder extends Seeder
{
    /**
     * Question `position` values per evaluation slug, listed in the order the
     * report must show them. The report order is not the form order: in the
     * psychic symptoms evaluation, question 19 comes before 18.
     *
     * @var array<string, list<int>>
     */
    private const REPORT_QUESTIONS = [
        'senales-de-estres' => [1, 3, 4, 6, 12, 16, 19, 18, 20, 21, 22, 23],
    ];

    /**
     * Evaluations where a higher score is the better outcome.
     *
     * @var list<string>
     */
    private const HIGHER_IS_BETTER = ['conductas-habitos-saludables'];

    public function run(): void
    {
        Evaluation::query()->whereIn('slug', self::HIGHER_IS_BETTER)->update(['lower_is_better' => false]);

        foreach (self::REPORT_QUESTIONS as $slug => $positions) {
            $evaluation = Evaluation::query()->where('slug', $slug)->first();

            if ($evaluation === null) {
                continue;
            }

            $evaluation->questions()->update(['report_position' => null]);

            foreach ($positions as $index => $position) {
                $evaluation->questions()
                    ->where('position', $position)
                    ->update(['report_position' => $index + 1]);
            }
        }
    }
}
```

El `update(['report_position' => null])` inicial es lo que hace al seeder idempotente: si la lista cambia, las preguntas que salieron del reporte quedan limpias en vez de acumularse.

- [ ] **Step 4: Registrar el seeder en `database/seeders/DatabaseSeeder.php`**

Agregar `ReportQuestionsSeeder::class,` como **último** elemento del array de `$this->call([...])`. Tiene que correr después de los seeders de evaluaciones porque actualiza las filas que ellos crean.

- [ ] **Step 5: Correr los tests**

Run: `php artisan test --compact --filter=SeedersTest`
Expected: PASS

- [ ] **Step 6: Aplicar el seeder a la base de desarrollo**

Run: `php artisan db:seed --class=ReportQuestionsSeeder --no-interaction`

Verificar que marcó 12 preguntas:

Run: `php artisan tinker --execute 'echo App\Models\Question::whereNotNull("report_position")->count();'`
Expected: `12`

- [ ] **Step 7: Formatear y commitear**

```bash
vendor/bin/pint --dirty --format agent
git add database/seeders tests/Feature/SeedersTest.php
git commit -m "Sembrar las 12 preguntas del reporte de síntomas psíquicos"
```

---

### Task 4: Controlador del reporte

**Files:**
- Create: `app/Http/Controllers/Admin/FormReportController.php`
- Modify: `routes/admin.php`
- Test: `tests/Feature/Admin/FormReportTest.php`

**Interfaces:**
- Consumes: `Question::scopeInReport()` (Task 1), `Evaluation::lowerIsBetter()` (Task 2).
- Produces: la ruta `admin.forms.report` (`GET /admin/forms/{form}/report`) que renderiza el componente `admin/reports/show` con estos props:

```
form: { id: int, name: string, description: string|null }
campaigns: [{ id, name, starts_at, ends_at, is_open: bool, submissions_count: int }]
participants_count: int
evaluations: [{
    id, name, lower_is_better: bool,
    totals: [{ campaign_id, average: float|null }],
    questions: [{ id, label, values: [{ campaign_id, average: float|null, answers: int }] }]
}]
```

Los arrays `totals` y `values` tienen **una entrada por campaña, siempre**, en el mismo orden que `campaigns`. Eso deja el frontend sin lógica de búsqueda ni huecos.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/Feature/Admin/FormReportTest.php`:

```php
<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

/**
 * A form with one scored evaluation, two questions (only the second one flagged
 * for the report) and two campaigns.
 *
 * @return array{Form, Evaluation, Question, Question, Campaign, Campaign}
 */
function reportFixture(): array
{
    $evaluation = Evaluation::factory()->create(['name' => 'Síntomas psíquicos']);

    $hidden = $evaluation->questions()->create([
        'label' => 'No va al reporte', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1,
    ]);
    $shown = $evaluation->questions()->create([
        'label' => 'Preocupaciones persistentes', 'type' => QuestionType::Radio, 'required' => true, 'position' => 2, 'report_position' => 1,
    ]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $first = Campaign::factory()->for($form)->create(['name' => 'Primera toma']);
    $second = Campaign::factory()->for($form)->create(['name' => 'Segunda toma']);

    return [$form, $evaluation, $hidden, $shown, $first, $second];
}

/** Record one person's answer to one question, plus the evaluation total. */
function answerInCampaign(Campaign $campaign, Question $question, int $points, ?int $total = null): Submission
{
    $submission = Submission::factory()->for($campaign)->create();

    $submission->answers()->create([
        'question_id' => $question->id,
        'question_label' => $question->label,
        'question_type' => QuestionType::Radio,
        'option_label' => "Opción {$points}",
        'option_points' => $points,
    ]);

    if ($total !== null) {
        $submission->results()->create([
            'evaluation_id' => $question->evaluation_id,
            'total_points' => $total,
        ]);
    }

    return $submission;
}

it('only reports the questions flagged for the report', function () {
    [$form, , $hidden, $shown, $first] = reportFixture();
    answerInCampaign($first, $hidden, 3);
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/show')
            ->has('evaluations.0.questions', 1)
            ->where('evaluations.0.questions.0.label', 'Preocupaciones persistentes')
        );
});

it('averages the points of everyone who answered each campaign', function () {
    [$form, , , $shown, $first, $second] = reportFixture();

    answerInCampaign($first, $shown, 3);
    answerInCampaign($first, $shown, 0);
    answerInCampaign($second, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.0.average', 1.5)
            ->where('evaluations.0.questions.0.values.0.answers', 2)
            ->where('evaluations.0.questions.0.values.1.average', 1.0)
            ->where('evaluations.0.questions.0.values.1.answers', 1)
        );
});

it('reports a campaign with no submissions as null instead of zero', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 2);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.1.average', null)
            ->where('evaluations.0.questions.0.values.1.answers', 0)
            ->where('campaigns.1.submissions_count', 0)
        );
});

it('reports a question nobody answered in a campaign as null', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    answerInCampaign($first, $shown, 2);
    Submission::factory()->for($second)->create();

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.1.average', null)
            ->where('campaigns.1.submissions_count', 1)
        );
});

it('averages the evaluation total per campaign', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 3, total: 30);
    answerInCampaign($first, $shown, 1, total: 10);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.totals.0.average', 20.0));
});

it('exposes the improvement direction of each evaluation', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.lower_is_better', true));

    $evaluation->update(['lower_is_better' => false]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertInertia(fn ($page) => $page->where('evaluations.0.lower_is_better', false));
});

it('orders campaigns by creation, not by start date', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    $first->update(['starts_at' => now()->addMonth()->toDateString()]);
    $second->update(['starts_at' => now()->subMonth()->toDateString()]);
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('campaigns.0.name', 'Primera toma')
            ->where('campaigns.1.name', 'Segunda toma')
        );
});

it('counts each participant once across campaigns', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    answerInCampaign($first, $shown, 1)->update(['work_email' => 'ana@empresa.test']);
    answerInCampaign($second, $shown, 0)->update(['work_email' => 'ana@empresa.test']);
    answerInCampaign($second, $shown, 3)->update(['work_email' => 'beto@empresa.test']);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('participants_count', 2));
});

it('returns no evaluations when the form has no questions flagged', function () {
    $evaluation = Evaluation::factory()->create();
    $evaluation->questions()->create(['label' => 'Suelta', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('evaluations', 0));
});

it('requires authentication', function () {
    $form = Form::factory()->create();

    auth()->logout();

    $this->get("/admin/forms/{$form->id}/report")->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `php artisan test --compact --filter=FormReportTest`
Expected: FAIL — 404, la ruta no existe

- [ ] **Step 3: Crear el controlador**

Run: `php artisan make:controller Admin/FormReportController --no-interaction`

Escribir `app/Http/Controllers/Admin/FormReportController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\SubmissionResult;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FormReportController extends Controller
{
    /**
     * Aggregated report of a form: for every question flagged for the report,
     * the average score of each campaign, so the evolution between takes can be
     * read at a glance.
     */
    public function show(Form $form): Response
    {
        $campaigns = $form->campaigns()->reorder('created_at')->withCount('submissions')->get();
        $campaignIds = $campaigns->pluck('id');

        $evaluations = $form->evaluations()
            ->with(['questions' => fn ($query) => $query->inReport()])
            ->get()
            ->filter(fn (Evaluation $evaluation) => $evaluation->questions->isNotEmpty())
            ->values();

        $questionIds = $evaluations->flatMap(fn (Evaluation $evaluation) => $evaluation->questions->pluck('id'));

        $averages = $this->questionAverages($campaignIds, $questionIds);
        $totals = $this->evaluationTotals($campaignIds);

        return Inertia::render('admin/reports/show', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
            ],
            'campaigns' => $campaigns->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'starts_at' => $campaign->starts_at->toDateString(),
                'ends_at' => $campaign->ends_at->toDateString(),
                'is_open' => $campaign->isOpen(),
                'submissions_count' => $campaign->submissions_count,
            ])->values(),
            'participants_count' => Submission::query()
                ->whereIn('campaign_id', $campaignIds)
                ->distinct()
                ->count('work_email'),
            'evaluations' => $evaluations->map(fn (Evaluation $evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'lower_is_better' => $evaluation->lowerIsBetter(),
                'totals' => $campaigns->map(fn (Campaign $campaign) => [
                    'campaign_id' => $campaign->id,
                    'average' => $totals->get("{$campaign->id}-{$evaluation->id}"),
                ])->values(),
                'questions' => $evaluation->questions->map(fn (Question $question) => [
                    'id' => $question->id,
                    'label' => $question->label,
                    'values' => $campaigns->map(function (Campaign $campaign) use ($averages, $question) {
                        $row = $averages->get("{$campaign->id}-{$question->id}");

                        return [
                            'campaign_id' => $campaign->id,
                            'average' => $row === null ? null : round((float) $row->average, 2),
                            'answers' => $row === null ? 0 : (int) $row->answers,
                        ];
                    })->values(),
                ])->values(),
            ])->values(),
        ]);
    }

    /**
     * Average points and answer count per campaign and question, keyed by
     * "campaignId-questionId". One grouped query instead of one per cell.
     *
     * @param  Collection<int, int>  $campaignIds
     * @param  Collection<int, int>  $questionIds
     * @return Collection<string, object>
     */
    private function questionAverages(Collection $campaignIds, Collection $questionIds): Collection
    {
        if ($campaignIds->isEmpty() || $questionIds->isEmpty()) {
            return collect();
        }

        return SubmissionAnswer::query()
            ->join('submissions', 'submissions.id', '=', 'submission_answers.submission_id')
            ->whereIn('submissions.campaign_id', $campaignIds)
            ->whereIn('submission_answers.question_id', $questionIds)
            ->whereNotNull('submission_answers.option_points')
            ->groupBy('submissions.campaign_id', 'submission_answers.question_id')
            ->select([
                'submissions.campaign_id',
                'submission_answers.question_id',
                DB::raw('AVG(submission_answers.option_points) as average'),
                DB::raw('COUNT(*) as answers'),
            ])
            ->get()
            ->keyBy(fn (object $row) => "{$row->campaign_id}-{$row->question_id}");
    }

    /**
     * Average evaluation score per campaign, keyed by "campaignId-evaluationId".
     *
     * @param  Collection<int, int>  $campaignIds
     * @return Collection<string, float>
     */
    private function evaluationTotals(Collection $campaignIds): Collection
    {
        if ($campaignIds->isEmpty()) {
            return collect();
        }

        return SubmissionResult::query()
            ->join('submissions', 'submissions.id', '=', 'submission_results.submission_id')
            ->whereIn('submissions.campaign_id', $campaignIds)
            ->groupBy('submissions.campaign_id', 'submission_results.evaluation_id')
            ->select([
                'submissions.campaign_id',
                'submission_results.evaluation_id',
                DB::raw('AVG(submission_results.total_points) as average'),
            ])
            ->get()
            ->mapWithKeys(fn (object $row) => [
                "{$row->campaign_id}-{$row->evaluation_id}" => round((float) $row->average, 2),
            ]);
    }
}
```

- [ ] **Step 4: Registrar la ruta**

En `routes/admin.php`, agregar el import `use App\Http\Controllers\Admin\FormReportController;` y esta línea dentro del grupo `auth`, junto a las otras rutas de `forms/{form}`:

```php
Route::get('forms/{form}/report', [FormReportController::class, 'show'])->name('forms.report');
```

- [ ] **Step 5: Correr los tests**

Run: `php artisan test --compact --filter=FormReportTest`
Expected: PASS (10 tests)

- [ ] **Step 6: Formatear y commitear**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/FormReportController.php routes/admin.php tests/Feature/Admin/FormReportTest.php
git commit -m "Calcular el reporte agregado de un formulario"
```

---

### Task 5: Índices de Reportes y Comparativo

**Files:**
- Create: `app/Http/Controllers/Admin/FormPickerController.php`
- Modify: `routes/admin.php`
- Test: `tests/Feature/Admin/FormPickerTest.php`

**Interfaces:**
- Produces: rutas `admin.reports.index` (`GET /admin/reports`) y `admin.comparativo.index` (`GET /admin/comparativo`), ambas renderizando `admin/forms/picker` con:

```
title: string
description: string
action: string        // base de URL, p.ej. "/admin/forms" — el destino es `${action}/${id}/${suffix}`
suffix: string        // "report" o "employees"
forms: [{ id, name, campaigns_count: int, submissions_count: int }]
```

Un solo controlador con dos métodos evita duplicar la misma consulta en dos clases.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/Feature/Admin/FormPickerTest.php`:

```php
<?php

use App\Models\Campaign;
use App\Models\Form;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists the forms with their campaign and submission counts on the reports index', function () {
    $form = Form::factory()->create(['name' => 'Evaluación Empresa X']);
    $campaign = Campaign::factory()->for($form)->create();
    Submission::factory()->for($campaign)->count(3)->create();

    $this->get('/admin/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/picker')
            ->where('suffix', 'report')
            ->where('forms.0.name', 'Evaluación Empresa X')
            ->where('forms.0.campaigns_count', 1)
            ->where('forms.0.submissions_count', 3)
        );
});

it('serves the comparison index without depending on a hardcoded form id', function () {
    Form::factory()->create();

    $this->get('/admin/comparativo')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/picker')
            ->where('suffix', 'employees')
        );
});

it('renders both indexes with no forms at all', function () {
    $this->get('/admin/reports')->assertOk()->assertInertia(fn ($page) => $page->has('forms', 0));
    $this->get('/admin/comparativo')->assertOk()->assertInertia(fn ($page) => $page->has('forms', 0));
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/reports')->assertRedirect('/admin/login');
    $this->get('/admin/comparativo')->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `php artisan test --compact --filter=FormPickerTest`
Expected: FAIL — 404

- [ ] **Step 3: Crear el controlador**

Run: `php artisan make:controller Admin/FormPickerController --no-interaction`

Escribir `app/Http/Controllers/Admin/FormPickerController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Form pickers for the sections that live inside a form: Reportes and
 * Comparativo. Both list the same thing, so they share one page and differ only
 * in where each row links to.
 */
class FormPickerController extends Controller
{
    public function reports(): Response
    {
        return $this->picker(
            title: 'Reportes',
            description: 'Elegí un formulario para ver la evolución de sus campañas.',
            suffix: 'report',
        );
    }

    public function comparisons(): Response
    {
        return $this->picker(
            title: 'Comparativo',
            description: 'Elegí un formulario para comparar las respuestas de cada empleado.',
            suffix: 'employees',
        );
    }

    private function picker(string $title, string $description, string $suffix): Response
    {
        return Inertia::render('admin/forms/picker', [
            'title' => $title,
            'description' => $description,
            'action' => '/admin/forms',
            'suffix' => $suffix,
            'forms' => $this->forms(),
        ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, campaigns_count: int, submissions_count: int}>
     */
    private function forms(): Collection
    {
        return Form::query()
            ->withCount('campaigns')
            ->withCount(['campaigns as submissions_count' => fn ($query) => $query
                ->join('submissions', 'submissions.campaign_id', '=', 'campaigns.id')])
            ->latest()
            ->get()
            ->map(fn (Form $form) => [
                'id' => $form->id,
                'name' => $form->name,
                'campaigns_count' => $form->campaigns_count,
                'submissions_count' => $form->submissions_count,
            ]);
    }
}
```

- [ ] **Step 4: Registrar las rutas**

En `routes/admin.php`, agregar el import `use App\Http\Controllers\Admin\FormPickerController;` y estas líneas junto a `campaigns.index` y `results.index`:

```php
Route::get('reports', [FormPickerController::class, 'reports'])->name('reports.index');
Route::get('comparativo', [FormPickerController::class, 'comparisons'])->name('comparativo.index');
```

- [ ] **Step 5: Correr los tests**

Run: `php artisan test --compact --filter=FormPickerTest`
Expected: PASS (4 tests)

Si `submissions_count` no da 3, el `withCount` con join está contando mal. En ese caso, reemplazar ese `withCount` por una subconsulta explícita:

```php
->withCount(['campaigns as submissions_count' => fn ($query) => $query
    ->selectRaw('coalesce(sum((select count(*) from submissions where submissions.campaign_id = campaigns.id)), 0)')])
```

- [ ] **Step 6: Formatear y commitear**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/FormPickerController.php routes/admin.php tests/Feature/Admin/FormPickerTest.php
git commit -m "Índices de Reportes y Comparativo sin IDs fijos"
```

---

### Task 6: Componente de barras

**Files:**
- Create: `resources/js/components/ui/bar-chart.tsx`

**Interfaces:**
- Produces:

```ts
export interface BarSeries {
    campaign_id: number;
    campaign_name: string;
    value: number | null;
    answers: number;
}

export function GroupedBars(props: {
    series: BarSeries[];
    max: number;
    lowerIsBetter: boolean;
    showScale?: boolean;
}): JSX.Element

export function campaignTint(index: number, total: number): string
```

`campaignTint` devuelve un color CSS listo para usar en `backgroundColor`.

- [ ] **Step 1: Escribir el componente**

Crear `resources/js/components/ui/bar-chart.tsx`:

```tsx
export interface BarSeries {
    campaign_id: number;
    campaign_name: string;
    /** Promedio de la campaña, o null si no hay respuestas para medir. */
    value: number | null;
    answers: number;
}

/**
 * Tono de indigo de una campaña: la más antigua clara, la más reciente plena.
 * La progresión temporal se lee sin consultar la leyenda.
 */
export function campaignTint(index: number, total: number): string {
    const ratio = total <= 1 ? 1 : index / (total - 1);
    const percent = Math.round(35 + ratio * 65);

    return `color-mix(in srgb, var(--color-indigo) ${percent}%, transparent)`;
}

/** Diferencia contra la campaña anterior, en puntos absolutos. */
function deltaOf(series: BarSeries[], index: number): number | null {
    if (index === 0) {
        return null;
    }
    const current = series[index].value;
    const previous = series[index - 1].value;

    if (current === null || previous === null) {
        return null;
    }

    return current - previous;
}

function DeltaBadge({ delta, lowerIsBetter }: { delta: number; lowerIsBetter: boolean }) {
    if (Math.abs(delta) < 0.05) {
        return <span className="font-mono text-[11px] text-ink-50">sin cambio</span>;
    }

    const rose = delta < 0;
    const improved = rose === lowerIsBetter;

    return (
        <span
            className={`font-mono text-[11px] font-medium ${improved ? 'text-emerald-600' : 'text-rose-600'}`}
        >
            {rose ? '▼' : '▲'} {Math.abs(delta).toFixed(1)}
        </span>
    );
}

/**
 * Barras horizontales de una pregunta: una por campaña, todas sobre la misma
 * escala fija. La escala común es deliberada — si cada gráfico se autoescalara,
 * un promedio de 0.4 se vería tan grave como uno de 2.8.
 */
export function GroupedBars({
    series,
    max,
    lowerIsBetter,
    showScale = false,
}: {
    series: BarSeries[];
    max: number;
    lowerIsBetter: boolean;
    showScale?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {series.map((item, index) => {
                const delta = deltaOf(series, index);
                const width = item.value === null ? 0 : Math.min(100, (item.value / max) * 100);

                return (
                    <div key={item.campaign_id} className="flex items-center gap-3">
                        <div className="h-5 flex-1 overflow-hidden rounded-md bg-ink/6">
                            {item.value !== null && (
                                <div
                                    className="h-full rounded-md transition-[width] duration-500"
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: campaignTint(index, series.length),
                                    }}
                                    role="img"
                                    aria-label={`${item.campaign_name}: ${item.value.toFixed(1)} puntos promedio sobre ${max}`}
                                />
                            )}
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold text-ink">
                            {item.value === null ? (
                                <span className="font-normal text-ink-50">—</span>
                            ) : (
                                item.value.toFixed(1)
                            )}
                        </span>
                        <span className="w-20 shrink-0">
                            {item.value === null ? (
                                <span className="font-mono text-[11px] text-ink-50">
                                    {item.answers === 0 ? 'sin datos' : ''}
                                </span>
                            ) : (
                                delta !== null && (
                                    <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} />
                                )
                            )}
                        </span>
                    </div>
                );
            })}

            {showScale && (
                <div className="mt-1 flex items-center gap-3">
                    <div className="flex flex-1 justify-between font-mono text-[10px] text-ink-50">
                        {Array.from({ length: max + 1 }, (_, tick) => (
                            <span key={tick}>{tick}</span>
                        ))}
                    </div>
                    <span className="w-10 shrink-0" />
                    <span className="w-20 shrink-0" />
                </div>
            )}
        </div>
    );
}

/** Puntitos de color que identifican cada campaña arriba de los gráficos. */
export function CampaignLegend({ campaigns }: { campaigns: { id: number; name: string }[] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {campaigns.map((campaign, index) => (
                <span key={campaign.id} className="flex items-center gap-2 text-xs text-ink-50">
                    <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: campaignTint(index, campaigns.length) }}
                    />
                    {campaign.name}
                </span>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run types:check`
Expected: sin errores

- [ ] **Step 3: Commitear**

```bash
git add resources/js/components/ui/bar-chart.tsx
git commit -m "Componente de barras agrupadas para el reporte"
```

---

### Task 7: Página del reporte

**Files:**
- Create: `resources/js/pages/admin/reports/show.tsx`

**Interfaces:**
- Consumes: los props de Task 4, y `GroupedBars` / `CampaignLegend` de Task 6.

- [ ] **Step 1: Escribir la página**

Crear `resources/js/pages/admin/reports/show.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonClass } from '@/components/ui/button';
import { CampaignLegend, GroupedBars, type BarSeries } from '@/components/ui/bar-chart';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

const MAX_POINTS = 3;

interface CampaignInfo {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
}

interface CampaignValue {
    campaign_id: number;
    average: number | null;
    answers: number;
}

interface QuestionRow {
    id: number;
    label: string;
    values: CampaignValue[];
}

interface EvaluationBlock {
    id: number;
    name: string;
    lower_is_better: boolean;
    totals: { campaign_id: number; average: number | null }[];
    questions: QuestionRow[];
}

interface Props {
    form: { id: number; name: string; description: string | null };
    campaigns: CampaignInfo[];
    participants_count: number;
    evaluations: EvaluationBlock[];
}

function toSeries(values: CampaignValue[], campaigns: CampaignInfo[]): BarSeries[] {
    return values.map((value, index) => ({
        campaign_id: value.campaign_id,
        campaign_name: campaigns[index]?.name ?? '',
        value: value.average,
        answers: value.answers,
    }));
}

/** Variación porcentual del puntaje total entre la primera y la última campaña medidas. */
function totalChange(totals: EvaluationBlock['totals']): { percent: number; from: number } | null {
    const measured = totals.filter((total) => total.average !== null);

    if (measured.length < 2) {
        return null;
    }

    const first = measured[0].average as number;
    const last = measured[measured.length - 1].average as number;

    if (first === 0) {
        return null;
    }

    return { percent: ((last - first) / first) * 100, from: first };
}

function GeneralInfo({ form, campaigns, participants }: { form: Props['form']; campaigns: CampaignInfo[]; participants: number }) {
    return (
        <GlassCard className="mb-5">
            <h2 className="text-sm font-semibold text-ink">Información general</h2>
            {form.description && <p className="mt-1 text-sm text-ink-50">{form.description}</p>}

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                    <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Campañas</dt>
                    <dd className="mt-0.5 font-mono text-lg font-semibold text-ink">{campaigns.length}</dd>
                </div>
                <div>
                    <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Participantes</dt>
                    <dd className="mt-0.5 font-mono text-lg font-semibold text-ink">{participants}</dd>
                </div>
                <div>
                    <dt className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Respuestas</dt>
                    <dd className="mt-0.5 font-mono text-lg font-semibold text-ink">
                        {campaigns.reduce((sum, campaign) => sum + campaign.submissions_count, 0)}
                    </dd>
                </div>
            </dl>

            {campaigns.length > 0 && (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[rgba(26,24,48,0.10)]">
                                <th className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Campaña</th>
                                <th className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Período</th>
                                <th className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Respuestas</th>
                                <th className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((campaign) => (
                                <tr key={campaign.id} className="border-b border-[rgba(26,24,48,0.06)] last:border-0">
                                    <td className="px-3 py-2.5 font-medium text-ink">{campaign.name}</td>
                                    <td className="px-3 py-2.5 text-ink-50">
                                        {campaign.starts_at} → {campaign.ends_at}
                                    </td>
                                    <td className="px-3 py-2.5 font-mono font-semibold text-ink">
                                        {campaign.submissions_count}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <StatusPill active={campaign.is_open}>
                                            {campaign.is_open ? 'Abierta' : 'Cerrada'}
                                        </StatusPill>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </GlassCard>
    );
}

function EvaluationReport({ evaluation, campaigns }: { evaluation: EvaluationBlock; campaigns: CampaignInfo[] }) {
    const change = totalChange(evaluation.totals);
    const improved = change !== null && (change.percent < 0) === evaluation.lower_is_better;

    return (
        <GlassCard className="mb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink">{evaluation.name}</h2>
                <p className="font-mono text-[11px] text-ink-50">
                    {evaluation.lower_is_better ? 'menos puntos es mejor' : 'más puntos es mejor'}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
                {evaluation.totals.map((total, index) => (
                    <div key={total.campaign_id}>
                        <p className="font-mono text-[11px] tracking-[0.06em] text-ink-50 uppercase">
                            {campaigns[index]?.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-semibold text-ink">
                            {total.average === null ? <span className="text-ink-50">—</span> : total.average.toFixed(1)}
                        </p>
                    </div>
                ))}
                {change !== null && (
                    <p className={`font-mono text-sm font-semibold ${improved ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {change.percent > 0 ? '▲' : '▼'} {Math.abs(change.percent).toFixed(1)}%
                        <span className="ml-1 font-sans text-[11px] font-normal text-ink-50">
                            puntaje total
                        </span>
                    </p>
                )}
            </div>

            <div className="mt-5 border-t border-[rgba(26,24,48,0.08)] pt-4">
                <CampaignLegend campaigns={campaigns} />
            </div>

            <ol className="mt-5 flex flex-col gap-6">
                {evaluation.questions.map((question, index) => (
                    <li key={question.id}>
                        <p className="mb-2 text-sm text-ink">
                            <span className="mr-2 font-mono text-xs text-ink-50">{index + 1}.</span>
                            {question.label}
                        </p>
                        <GroupedBars
                            series={toSeries(question.values, campaigns)}
                            max={MAX_POINTS}
                            lowerIsBetter={evaluation.lower_is_better}
                            showScale={index === evaluation.questions.length - 1}
                        />
                    </li>
                ))}
            </ol>
        </GlassCard>
    );
}

export default function ReportShow({ form, campaigns, participants_count, evaluations }: Props) {
    return (
        <AdminShell title={`Reporte — ${form.name}`}>
            <Breadcrumbs
                items={[
                    { label: 'Reportes', href: '/admin/reports' },
                    { label: form.name },
                ]}
            />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                        Reporte
                    </h1>
                    <p className="mt-1 text-sm text-ink-50">{form.name}</p>
                </div>
                <Link href="/admin/reports" className={buttonClass('ghost')}>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-4 w-4"
                    >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                    </svg>
                    Volver
                </Link>
            </div>

            <GeneralInfo form={form} campaigns={campaigns} participants={participants_count} />

            {evaluations.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay preguntas marcadas para el reporte en las evaluaciones de
                        este formulario.
                    </p>
                </div>
            ) : (
                evaluations.map((evaluation) => (
                    <EvaluationReport key={evaluation.id} evaluation={evaluation} campaigns={campaigns} />
                ))
            )}
        </AdminShell>
    );
}
```

- [ ] **Step 2: Verificar tipos y build**

Run: `npm run types:check && npm run build`
Expected: sin errores

- [ ] **Step 3: Verificar la página en el navegador**

Run: `php artisan tinker --execute 'echo App\Models\Form::first()->id;'`

Abrir `http://app-mara-diz.test/admin/forms/<id>/report` y confirmar que se ven las 12 preguntas de Síntomas psíquicos con sus barras.

- [ ] **Step 4: Commitear**

```bash
git add resources/js/pages/admin/reports/show.tsx
git commit -m "Página del reporte con gráficos de barras por campaña"
```

---

### Task 8: Split button y navegación

**Files:**
- Create: `resources/js/components/ui/split-button.tsx`, `resources/js/pages/admin/forms/picker.tsx`
- Modify: `resources/js/pages/admin/forms/index.tsx`, `resources/js/config/nav.ts`

**Interfaces:**
- Consumes: props de `admin/forms/picker` definidos en Task 5.
- Produces:

```ts
export interface SplitAction { label: string; href: string }
export function SplitButton(props: { primary: SplitAction; actions: SplitAction[] }): JSX.Element
```

- [ ] **Step 1: Crear el split button**

Crear `resources/js/components/ui/split-button.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SplitAction {
    label: string;
    href: string;
}

/**
 * Acción principal pegada a un caret que despliega las secundarias. Reemplaza a
 * la fila de links sueltos cuando un registro acumula demasiadas acciones.
 */
export function SplitButton({ primary, actions }: { primary: SplitAction; actions: SplitAction[] }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-flex">
            <div className="glass inline-flex items-stretch overflow-hidden rounded-2xl">
                <Link
                    href={primary.href}
                    className="px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/70"
                >
                    {primary.label}
                </Link>
                <span className="w-px self-stretch bg-[rgba(26,24,48,0.12)]" />
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label="Más acciones"
                    className="cursor-pointer px-2.5 text-ink-50 transition-colors duration-200 hover:bg-white/70 hover:text-ink"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>
            </div>

            {open && (
                <div
                    role="menu"
                    className="glass absolute top-full right-0 z-20 mt-1.5 flex w-44 flex-col rounded-2xl p-1.5"
                >
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors duration-200 hover:bg-white/70"
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Reemplazar las acciones en `resources/js/pages/admin/forms/index.tsx`**

Agregar el import `import { SplitButton } from '@/components/ui/split-button';` y reemplazar **todo** el componente `FormActions` (el que hoy devuelve cuatro `<Link>` sueltos) por:

```tsx
/** Acciones por fila: Campañas como acción principal, el resto en el desplegable. */
function FormActions({ form }: { form: FormRow }) {
    return (
        <SplitButton
            primary={{ label: 'Campañas', href: `/admin/forms/${form.id}/campaigns` }}
            actions={[
                { label: 'Reporte', href: `/admin/forms/${form.id}/report` },
                { label: 'Comparativo', href: `/admin/forms/${form.id}/employees` },
                { label: 'Editar', href: `/admin/forms/${form.id}/edit` },
            ]}
        />
    );
}
```

`FormActions` ya se usa dentro de la tabla desktop y de la `RecordCard` mobile, así que ambos lugares quedan actualizados con este único cambio. La celda de la tabla que lo envuelve usa `justify-end`, que sigue funcionando con un solo hijo.

- [ ] **Step 3: Crear la página del picker**

Crear `resources/js/pages/admin/forms/picker.tsx`:

```tsx
import { Link } from '@inertiajs/react';
import {
    CardActions,
    CardList,
    DataTable,
    RecordCard,
    Td,
    Th,
    Tr,
} from '@/components/ui/table';
import { AdminShell } from '@/layouts/admin-shell';

interface FormRow {
    id: number;
    name: string;
    campaigns_count: number;
    submissions_count: number;
}

interface Props {
    title: string;
    description: string;
    action: string;
    suffix: string;
    forms: FormRow[];
}

export default function FormPicker({ title, description, action, suffix, forms }: Props) {
    const linkFor = (form: FormRow) => `${action}/${form.id}/${suffix}`;

    return (
        <AdminShell title={title}>
            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                    {title}
                </h1>
                <p className="mt-1 text-sm text-ink-50">{description}</p>
            </div>

            {forms.length === 0 ? (
                <div className="glass rounded-[22px] p-10 text-center">
                    <p className="text-ink-50">
                        Todavía no hay formularios. Creá el primero desde la sección
                        Formularios.
                    </p>
                </div>
            ) : (
                <>
                    <DataTable>
                        <thead>
                            <tr>
                                <Th>Formulario</Th>
                                <Th>Campañas</Th>
                                <Th>Respuestas</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map((form) => (
                                <Tr key={form.id}>
                                    <Td className="font-medium">{form.name}</Td>
                                    <Td className="font-mono">{form.campaigns_count}</Td>
                                    <Td className="font-mono">{form.submissions_count}</Td>
                                    <Td>
                                        <div className="flex justify-end text-sm font-medium">
                                            <Link
                                                href={linkFor(form)}
                                                className="text-indigo hover:underline"
                                            >
                                                Ver
                                            </Link>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>

                    <CardList>
                        {forms.map((form) => (
                            <RecordCard key={form.id}>
                                <p className="font-medium [overflow-wrap:anywhere] text-ink">
                                    {form.name}
                                </p>
                                <p className="mt-0.5 text-xs text-ink-50">
                                    {form.campaigns_count}{' '}
                                    {form.campaigns_count === 1 ? 'campaña' : 'campañas'} ·{' '}
                                    {form.submissions_count}{' '}
                                    {form.submissions_count === 1 ? 'respuesta' : 'respuestas'}
                                </p>
                                <CardActions>
                                    <Link
                                        href={linkFor(form)}
                                        className="text-indigo hover:underline"
                                    >
                                        Ver
                                    </Link>
                                </CardActions>
                            </RecordCard>
                        ))}
                    </CardList>
                </>
            )}
        </AdminShell>
    );
}
```

- [ ] **Step 4: Actualizar `resources/js/config/nav.ts`**

Reemplazar el array `adminNavItems` completo por:

```ts
export const adminNavItems: NavItem[] = [
    { label: 'Formularios', href: '/admin/forms', match: '/admin/forms' },
    { label: 'Campañas', href: '/admin/campaigns', match: '/admin/campaigns' },
    { label: 'Resultados', href: '/admin/results', match: '/admin/results' },
    { label: 'Reportes', href: '/admin/reports', match: '/admin/reports' },
    { label: 'Comparativo', href: '/admin/comparativo', match: '/admin/comparativo' },
];
```

El ítem Comparativo apuntaba a `/admin/forms/1/employees`, que tira 404 si se borra el formulario 1.

- [ ] **Step 5: Verificar tipos y build**

Run: `npm run types:check && npm run lint:check && npm run build`
Expected: sin errores

- [ ] **Step 6: Commitear**

```bash
git add resources/js
git commit -m "Split button en formularios y menús de Reportes y Comparativo"
```

---

### Task 9: Smoke test y verificación final

**Files:**
- Modify: `tests/Browser/AdminNavigationSmokeTest.php`

- [ ] **Step 1: Agregar el reporte al smoke test**

En `tests/Browser/AdminNavigationSmokeTest.php`, agregar `'/admin/reports',` y `'/admin/comparativo',` al array de `$pages` del primer test, y actualizar el segundo test (`shows every section in the desktop menu`) agregando:

```php
->assertSee('Reportes')
->assertSee('Comparativo')
```

Agregar además este test al final del archivo:

```php
it('renders a form report without JavaScript errors', function () {
    $this->actingAs(User::factory()->create());
    $this->seed(\Database\Seeders\StressSignalsSeeder::class);
    $this->seed(\Database\Seeders\ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'senales-de-estres')->firstOrFail();
    $form = \App\Models\Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $campaign = Campaign::factory()->for($form)->open()->create();
    $submission = Submission::factory()->for($campaign)->create();

    foreach ($evaluation->questions()->inReport()->get() as $question) {
        $submission->answers()->create([
            'question_id' => $question->id,
            'question_label' => $question->label,
            'question_type' => \App\Enums\QuestionType::Radio,
            'option_label' => '1 vez por semana',
            'option_points' => 1,
        ]);
    }
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 12]);

    visit("/admin/forms/{$form->id}/report")
        ->assertNoJavaScriptErrors()
        ->assertSee('Síntomas psíquicos')
        ->assertSee('Tener preocupaciones persistentes.');
});
```

- [ ] **Step 2: Correr el smoke test**

Run: `php artisan test --compact --filter=AdminNavigationSmokeTest`
Expected: PASS

Si el navegador no está disponible en este entorno, el test se saltea; en ese caso verificar la página manualmente en `http://app-mara-diz.test/admin/reports`.

- [ ] **Step 3: Correr la suite completa**

Run: `php artisan test --compact`
Expected: PASS, sin regresiones. Prestar atención a `FormCrudTest`, que puede afirmar sobre los links de acción que Task 8 reemplazó por el split button. Si falla ahí, ajustar la aserción al nuevo markup — no revertir el split button.

- [ ] **Step 4: Verificación final**

```bash
vendor/bin/pint --dirty --format agent
npm run build
php artisan test --compact
```

- [ ] **Step 5: Commitear**

```bash
git add tests/Browser/AdminNavigationSmokeTest.php
git commit -m "Smoke test del reporte y los nuevos menús"
```

---

## Verificación de cobertura del spec

| Requisito del spec | Tarea |
|---|---|
| Columna `report_position` | 1 |
| Columna `lower_is_better` | 2 |
| Seeder de las 12 preguntas | 3 |
| Query agregada de promedios por pregunta | 4 |
| Query agregada de totales por evaluación | 4 |
| Orden de campañas por `created_at` | 4 |
| Casos borde (sin respuestas, no aplicaba, sin campañas, sin preguntas) | 4, 7 |
| Índices de Reportes y Comparativo | 5 |
| Barras con escala fija 0–3 y tonos de indigo | 6 |
| Delta en puntos absolutos con color por `lower_is_better` | 6 |
| Información general con N por campaña | 7 |
| Estado vacío del reporte | 7 |
| Split button con Campañas como principal | 8 |
| Menú Reportes y Comparativo sin ID fijo | 8 |
| Tests 1–10 del spec | 4, 5 |
