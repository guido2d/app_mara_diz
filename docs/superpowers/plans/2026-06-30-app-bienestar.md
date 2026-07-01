# App de Bienestar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app donde un empleado completa un Formulario público de bienestar (compuesto por Evaluaciones puntuadas) y un panel de administración gestiona formularios, campañas, textos de resultado y reportes.

**Architecture:** Laravel 13 + Inertia v3 + React 19. El dominio se apoya en Evaluaciones/Preguntas/Opciones sembradas por seeder (sin ABM), Formularios y Campañas administrables, y Envíos que congelan (snapshot) el perfil del empleado y el resultado por Evaluación. El puntaje vive en la Opción; el resultado cae en un Rango contiguo y exhaustivo. Ver `CONTEXT.md` (glosario), `docs/adr/0001` (campañas) y `docs/adr/0002` (snapshot).

**Tech Stack:** PHP 8.4, Laravel 13, Inertia v3, React 19, TailwindCSS v4, Wayfinder, Pest v4, Larastan v3, Pint.

## Global Constraints

- Preguntas, Opciones y Evaluaciones se cargan por **seeder**, sin pantalla de ABM.
- Los puntos viven en la **Opción**; texto/fecha/descripción no puntúan.
- Resultado **por Evaluación** = suma de puntos de Opciones elegidas → Rango que lo contiene.
- Rangos de una Evaluación: **contiguos, sin solapes ni huecos, de 0 al puntaje máximo posible**; validado al guardar.
- Un **Envío** es único por **(campaña, email laboral)**; reenvío → **bloqueado** ("ya respondiste").
- **Snapshot** en el Envío: total de puntos + `score_range_id` + copia del texto. Editar una Evaluación no toca lo histórico.
- **No se puede editar los Rangos** de una Evaluación que participa en una Campaña abierta.
- Máximo **una Campaña abierta por Formulario**. Formulario activo ⟺ tiene Campaña abierta.
- Link público estable por Formulario: `/f/{slug}`.
- Perfil del empleado (todos obligatorios): nombre, apellido, función, edad (int), sexo, estado civil, cantidad de hijos (int), grupo de convivencia, email laboral, celular. Snapshot por Envío; sin padrón maestro.
- El empleado **no** ve su resultado: pantalla de agradecimiento. Textos de resultado son internos.
- Un solo rol de administrador (sobre `User`).
- `radio` y `select` = selección única. Preguntas de opción siempre obligatorias; informativas con flag `required`.
- Correr `vendor/bin/pint --dirty --format agent` antes de cada commit con cambios PHP.
- Tests con Pest: `php artisan test --compact`.

---

## File Structure

**Enums** (`app/Enums/`): `QuestionType`, `Sex`, `MaritalStatus`, `CohabitationGroup`.

**Models** (`app/Models/`): `Evaluation`, `Question`, `QuestionOption`, `ScoreRange`, `Form`, `Campaign`, `Submission`, `SubmissionAnswer`, `SubmissionResult`.

**Migrations** (`database/migrations/`): una por tabla (evaluations, questions, question_options, score_ranges, forms, evaluation_form, campaigns, submissions, submission_answers, submission_results).

**Services** (`app/Services/`): `ScoringService` (calcula y persiste snapshots de resultado), `RangeCoverageValidator` (valida cobertura de Rangos).

**Controllers** (`app/Http/Controllers/`): `PublicFormController`; `Admin/` → `FormController`, `CampaignController`, `ScoreRangeController`, `ResultController`, `ReportController`, `Auth/AuthenticatedSessionController`.

**Requests** (`app/Http/Requests/`): `StoreSubmissionRequest`, `StoreFormRequest`/`UpdateFormRequest`, `StoreCampaignRequest`, `UpdateScoreRangesRequest`.

**Seeders** (`database/seeders/`): `WellbeingSeeder` (evaluaciones+preguntas+opciones+rangos demo), `AdminUserSeeder`.

**React pages** (`resources/js/pages/`): `public/form.tsx`, `public/thank-you.tsx`, `public/unavailable.tsx`; `admin/forms/{index,create,edit}.tsx`, `admin/campaigns/index.tsx`, `admin/ranges/edit.tsx`, `admin/results/{index,show}.tsx`, `admin/reports/index.tsx`, `auth/login.tsx`.

---

## Phase 0 — Enums y esquema base

### Task 1: Enums de dominio

**Files:**
- Create: `app/Enums/QuestionType.php`, `app/Enums/Sex.php`, `app/Enums/MaritalStatus.php`, `app/Enums/CohabitationGroup.php`
- Test: `tests/Unit/EnumsTest.php`

**Interfaces:**
- Produces: `QuestionType::{Input,Select,Radio,Date,Textarea}` (string-backed); método `isScored(): bool` (true solo Select/Radio). `Sex`, `MaritalStatus`, `CohabitationGroup` string-backed con método `label(): string`.

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact --filter=EnumsTest`
Expected: FAIL ("Class App\Enums\QuestionType not found").

- [ ] **Step 3: Write the enums**

```php
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
```

```php
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
```

```php
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
```

```php
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --compact --filter=EnumsTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Enums tests/Unit/EnumsTest.php
git commit -m "feat: add domain enums (question type, profile fields)"
```

---

### Task 2: Migraciones del catálogo (evaluations, questions, question_options, score_ranges)

**Files:**
- Create: `database/migrations/2026_06_30_000001_create_evaluations_table.php`, `..._000002_create_questions_table.php`, `..._000003_create_question_options_table.php`, `..._000004_create_score_ranges_table.php`
- Test: `tests/Feature/CatalogSchemaTest.php`

**Interfaces:**
- Produces: tabla `evaluations(id, name, slug unique, description nullable, position, timestamps)`; `questions(id, evaluation_id, label, type, required, position, timestamps)`; `question_options(id, question_id, label, points, position, timestamps)`; `score_ranges(id, evaluation_id, min_points, max_points, result_text, position, timestamps)`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use Illuminate\Support\Facades\Schema;

it('creates the catalog tables with expected columns', function () {
    expect(Schema::hasColumns('evaluations', ['id', 'name', 'slug', 'description', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('questions', ['id', 'evaluation_id', 'label', 'type', 'required', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('question_options', ['id', 'question_id', 'label', 'points', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('score_ranges', ['id', 'evaluation_id', 'min_points', 'max_points', 'result_text', 'position']))->toBeTrue();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=CatalogSchemaTest`
Expected: FAIL (tables don't exist).

- [ ] **Step 3: Write the migrations**

`..._000001_create_evaluations_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
```

`..._000002_create_questions_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('type');
            $table->boolean('required')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
```

`..._000003_create_question_options_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->integer('points')->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
    }
};
```

`..._000004_create_score_ranges_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('score_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->integer('min_points');
            $table->integer('max_points');
            $table->text('result_text');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('score_ranges');
    }
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=CatalogSchemaTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/migrations tests/Feature/CatalogSchemaTest.php
git commit -m "feat: add catalog schema (evaluations, questions, options, ranges)"
```

---

### Task 3: Migraciones de formularios y campañas (forms, evaluation_form, campaigns)

**Files:**
- Create: `..._000005_create_forms_table.php`, `..._000006_create_evaluation_form_table.php`, `..._000007_create_campaigns_table.php`
- Test: `tests/Feature/FormSchemaTest.php`

**Interfaces:**
- Produces: `forms(id, name, slug unique, description nullable, timestamps)`; `evaluation_form(id, form_id, evaluation_id, position, timestamps; unique[form_id,evaluation_id])`; `campaigns(id, form_id, name, starts_at date, ends_at date, closed_at nullable timestamp, timestamps)`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use Illuminate\Support\Facades\Schema;

it('creates the form and campaign tables', function () {
    expect(Schema::hasColumns('forms', ['id', 'name', 'slug', 'description']))->toBeTrue()
        ->and(Schema::hasColumns('evaluation_form', ['id', 'form_id', 'evaluation_id', 'position']))->toBeTrue()
        ->and(Schema::hasColumns('campaigns', ['id', 'form_id', 'name', 'starts_at', 'ends_at', 'closed_at']))->toBeTrue();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=FormSchemaTest`
Expected: FAIL.

- [ ] **Step 3: Write the migrations**

`..._000005_create_forms_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forms');
    }
};
```

`..._000006_create_evaluation_form_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_form', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['form_id', 'evaluation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_form');
    }
};
```

`..._000007_create_campaigns_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('starts_at');
            $table->date('ends_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=FormSchemaTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/migrations tests/Feature/FormSchemaTest.php
git commit -m "feat: add form and campaign schema"
```

---

### Task 4: Migraciones de envíos (submissions, submission_answers, submission_results)

**Files:**
- Create: `..._000008_create_submissions_table.php`, `..._000009_create_submission_answers_table.php`, `..._000010_create_submission_results_table.php`
- Test: `tests/Feature/SubmissionSchemaTest.php`

**Interfaces:**
- Produces: `submissions(id, campaign_id, first_name, last_name, role_function, age, sex, marital_status, children_count, cohabitation_group, work_email, phone, submitted_at, timestamps; unique[campaign_id, work_email])`; `submission_answers(id, submission_id, question_id, question_option_id nullable, value_text nullable, timestamps)`; `submission_results(id, submission_id, evaluation_id, total_points, score_range_id nullable, result_text, timestamps)`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use Illuminate\Support\Facades\Schema;

it('creates the submission tables', function () {
    expect(Schema::hasColumns('submissions', [
        'id', 'campaign_id', 'first_name', 'last_name', 'role_function', 'age',
        'sex', 'marital_status', 'children_count', 'cohabitation_group',
        'work_email', 'phone', 'submitted_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumns('submission_answers', ['id', 'submission_id', 'question_id', 'question_option_id', 'value_text']))->toBeTrue()
        ->and(Schema::hasColumns('submission_results', ['id', 'submission_id', 'evaluation_id', 'total_points', 'score_range_id', 'result_text']))->toBeTrue();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=SubmissionSchemaTest`
Expected: FAIL.

- [ ] **Step 3: Write the migrations**

`..._000008_create_submissions_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('role_function');
            $table->unsignedTinyInteger('age');
            $table->string('sex');
            $table->string('marital_status');
            $table->unsignedTinyInteger('children_count');
            $table->string('cohabitation_group');
            $table->string('work_email');
            $table->string('phone');
            $table->timestamp('submitted_at');
            $table->timestamps();
            $table->unique(['campaign_id', 'work_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
```

`..._000009_create_submission_answers_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_option_id')->nullable()->constrained()->nullOnDelete();
            $table->text('value_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_answers');
    }
};
```

`..._000010_create_submission_results_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->integer('total_points');
            $table->foreignId('score_range_id')->nullable()->constrained()->nullOnDelete();
            $table->text('result_text');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_results');
    }
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=SubmissionSchemaTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/migrations tests/Feature/SubmissionSchemaTest.php
git commit -m "feat: add submission schema (submissions, answers, results)"
```

---

## Phase 1 — Modelos, relaciones y factories

### Task 5: Modelos del catálogo con relaciones y casts

**Files:**
- Create: `app/Models/Evaluation.php`, `app/Models/Question.php`, `app/Models/QuestionOption.php`, `app/Models/ScoreRange.php`
- Create: `database/factories/EvaluationFactory.php`, `database/factories/QuestionFactory.php`, `database/factories/QuestionOptionFactory.php`, `database/factories/ScoreRangeFactory.php`
- Test: `tests/Feature/EvaluationModelTest.php`

**Interfaces:**
- Produces:
  - `Evaluation` → `questions(): HasMany`, `scoreRanges(): HasMany`, `forms(): BelongsToMany`, `maxPossiblePoints(): int` (suma del mayor `points` por pregunta puntuada).
  - `Question` → `evaluation(): BelongsTo`, `options(): HasMany`, cast `type => QuestionType`, `required => bool`.
  - `QuestionOption` → `question(): BelongsTo`.
  - `ScoreRange` → `evaluation(): BelongsTo`, `contains(int $points): bool`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\QuestionType;
use App\Models\Evaluation;

it('computes the max possible points from scored questions only', function () {
    $evaluation = Evaluation::factory()->create();

    $radio = $evaluation->questions()->create(['label' => 'A', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $radio->options()->createMany([
        ['label' => 'Nunca', 'points' => 0, 'position' => 1],
        ['label' => 'Siempre', 'points' => 3, 'position' => 2],
    ]);

    $select = $evaluation->questions()->create(['label' => 'B', 'type' => QuestionType::Select, 'required' => true, 'position' => 2]);
    $select->options()->createMany([
        ['label' => 'Bajo', 'points' => 1, 'position' => 1],
        ['label' => 'Alto', 'points' => 5, 'position' => 2],
    ]);

    // Informativa: no puntúa
    $evaluation->questions()->create(['label' => 'C', 'type' => QuestionType::Textarea, 'required' => false, 'position' => 3]);

    expect($evaluation->maxPossiblePoints())->toBe(8); // 3 + 5
});

it('checks whether a range contains a score inclusively', function () {
    $evaluation = Evaluation::factory()->create();
    $range = $evaluation->scoreRanges()->create(['min_points' => 3, 'max_points' => 6, 'result_text' => 'Medio', 'position' => 2]);

    expect($range->contains(3))->toBeTrue()
        ->and($range->contains(6))->toBeTrue()
        ->and($range->contains(7))->toBeFalse();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=EvaluationModelTest`
Expected: FAIL ("Class App\Models\Evaluation not found").

- [ ] **Step 3: Write the models and factories**

`app/Models/Evaluation.php`:

```php
<?php

namespace App\Models;

use Database\Factories\EvaluationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluation extends Model
{
    /** @use HasFactory<EvaluationFactory> */
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'position'];

    /** @return HasMany<Question, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    /** @return HasMany<ScoreRange, $this> */
    public function scoreRanges(): HasMany
    {
        return $this->hasMany(ScoreRange::class)->orderBy('position');
    }

    /** @return BelongsToMany<Form, $this> */
    public function forms(): BelongsToMany
    {
        return $this->belongsToMany(Form::class)->withPivot('position')->withTimestamps();
    }

    public function maxPossiblePoints(): int
    {
        return (int) $this->questions()
            ->with('options')
            ->get()
            ->filter(fn (Question $q) => $q->type->isScored())
            ->sum(fn (Question $q) => (int) $q->options->max('points'));
    }
}
```

`app/Models/Question.php`:

```php
<?php

namespace App\Models;

use App\Enums\QuestionType;
use Database\Factories\QuestionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory;

    protected $fillable = ['evaluation_id', 'label', 'type', 'required', 'position'];

    protected function casts(): array
    {
        return [
            'type' => QuestionType::class,
            'required' => 'boolean',
        ];
    }

    /** @return BelongsTo<Evaluation, $this> */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    /** @return HasMany<QuestionOption, $this> */
    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('position');
    }
}
```

`app/Models/QuestionOption.php`:

```php
<?php

namespace App\Models;

use Database\Factories\QuestionOptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionOption extends Model
{
    /** @use HasFactory<QuestionOptionFactory> */
    use HasFactory;

    protected $fillable = ['question_id', 'label', 'points', 'position'];

    protected function casts(): array
    {
        return ['points' => 'integer'];
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
```

`app/Models/ScoreRange.php`:

```php
<?php

namespace App\Models;

use Database\Factories\ScoreRangeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreRange extends Model
{
    /** @use HasFactory<ScoreRangeFactory> */
    use HasFactory;

    protected $fillable = ['evaluation_id', 'min_points', 'max_points', 'result_text', 'position'];

    protected function casts(): array
    {
        return [
            'min_points' => 'integer',
            'max_points' => 'integer',
        ];
    }

    /** @return BelongsTo<Evaluation, $this> */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function contains(int $points): bool
    {
        return $points >= $this->min_points && $points <= $this->max_points;
    }
}
```

`database/factories/EvaluationFactory.php`:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<\App\Models\Evaluation> */
class EvaluationFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'description' => fake()->sentence(),
            'position' => 0,
        ];
    }
}
```

`database/factories/QuestionFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Question> */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'label' => fake()->sentence().'?',
            'type' => QuestionType::Radio,
            'required' => true,
            'position' => 0,
        ];
    }
}
```

`database/factories/QuestionOptionFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\QuestionOption> */
class QuestionOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'label' => fake()->word(),
            'points' => fake()->numberBetween(0, 3),
            'position' => 0,
        ];
    }
}
```

`database/factories/ScoreRangeFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\ScoreRange> */
class ScoreRangeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'min_points' => 0,
            'max_points' => 10,
            'result_text' => fake()->sentence(),
            'position' => 0,
        ];
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=EvaluationModelTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Models database/factories tests/Feature/EvaluationModelTest.php
git commit -m "feat: add catalog models, relations and factories"
```

---

### Task 6: Modelos de formularios, campañas y envíos

**Files:**
- Create: `app/Models/Form.php`, `app/Models/Campaign.php`, `app/Models/Submission.php`, `app/Models/SubmissionAnswer.php`, `app/Models/SubmissionResult.php`
- Create: `database/factories/FormFactory.php`, `database/factories/CampaignFactory.php`, `database/factories/SubmissionFactory.php`
- Test: `tests/Feature/CampaignModelTest.php`

**Interfaces:**
- Produces:
  - `Form` → `evaluations(): BelongsToMany` (withPivot position, ordenado), `campaigns(): HasMany`, `openCampaign(): ?Campaign`.
  - `Campaign` → `form(): BelongsTo`, `submissions(): HasMany`, `isOpen(): bool` (closed_at null y `today` en [starts_at, ends_at]), scope `open()`.
  - `Submission` → `campaign(): BelongsTo`, `answers(): HasMany`, `results(): HasMany`, casts sex/marital_status/cohabitation_group a enums, `submitted_at => datetime`.
  - `SubmissionAnswer` → `submission/question/option BelongsTo`.
  - `SubmissionResult` → `submission/evaluation/scoreRange BelongsTo`.
  - Factories: `CampaignFactory` con estados `open()` y `closed()`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Campaign;
use App\Models\Form;

it('reports a campaign as open only within its window and not closed', function () {
    $open = Campaign::factory()->open()->create();
    $closedManually = Campaign::factory()->open()->create(['closed_at' => now()]);
    $past = Campaign::factory()->create([
        'starts_at' => now()->subDays(10)->toDateString(),
        'ends_at' => now()->subDays(5)->toDateString(),
        'closed_at' => null,
    ]);

    expect($open->isOpen())->toBeTrue()
        ->and($closedManually->isOpen())->toBeFalse()
        ->and($past->isOpen())->toBeFalse();
});

it('exposes the single open campaign of a form', function () {
    $form = Form::factory()->create();
    Campaign::factory()->closed()->for($form)->create();
    $open = Campaign::factory()->open()->for($form)->create();

    expect($form->openCampaign()?->is($open))->toBeTrue();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=CampaignModelTest`
Expected: FAIL.

- [ ] **Step 3: Write the models and factories**

`app/Models/Form.php`:

```php
<?php

namespace App\Models;

use Database\Factories\FormFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    /** @use HasFactory<FormFactory> */
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description'];

    /** @return BelongsToMany<Evaluation, $this> */
    public function evaluations(): BelongsToMany
    {
        return $this->belongsToMany(Evaluation::class)
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('position');
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class)->latest('starts_at');
    }

    public function openCampaign(): ?Campaign
    {
        return $this->campaigns()->open()->first();
    }
}
```

`app/Models/Campaign.php`:

```php
<?php

namespace App\Models;

use Database\Factories\CampaignFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    /** @use HasFactory<CampaignFactory> */
    use HasFactory;

    protected $fillable = ['form_id', 'name', 'starts_at', 'ends_at', 'closed_at'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Form, $this> */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /** @return HasMany<Submission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null
            && $this->starts_at->startOfDay()->lte(now())
            && $this->ends_at->endOfDay()->gte(now());
    }

    /** @param Builder<Campaign> $query */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('closed_at')
            ->whereDate('starts_at', '<=', now())
            ->whereDate('ends_at', '>=', now());
    }
}
```

`app/Models/Submission.php`:

```php
<?php

namespace App\Models;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use Database\Factories\SubmissionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    /** @use HasFactory<SubmissionFactory> */
    use HasFactory;

    protected $fillable = [
        'campaign_id', 'first_name', 'last_name', 'role_function', 'age', 'sex',
        'marital_status', 'children_count', 'cohabitation_group', 'work_email', 'phone', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'children_count' => 'integer',
            'sex' => Sex::class,
            'marital_status' => MaritalStatus::class,
            'cohabitation_group' => CohabitationGroup::class,
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /** @return HasMany<SubmissionAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(SubmissionAnswer::class);
    }

    /** @return HasMany<SubmissionResult, $this> */
    public function results(): HasMany
    {
        return $this->hasMany(SubmissionResult::class);
    }
}
```

`app/Models/SubmissionAnswer.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionAnswer extends Model
{
    protected $fillable = ['submission_id', 'question_id', 'question_option_id', 'value_text'];

    /** @return BelongsTo<Submission, $this> */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /** @return BelongsTo<QuestionOption, $this> */
    public function option(): BelongsTo
    {
        return $this->belongsTo(QuestionOption::class, 'question_option_id');
    }
}
```

`app/Models/SubmissionResult.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionResult extends Model
{
    protected $fillable = ['submission_id', 'evaluation_id', 'total_points', 'score_range_id', 'result_text'];

    protected function casts(): array
    {
        return ['total_points' => 'integer'];
    }

    /** @return BelongsTo<Submission, $this> */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /** @return BelongsTo<Evaluation, $this> */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    /** @return BelongsTo<ScoreRange, $this> */
    public function scoreRange(): BelongsTo
    {
        return $this->belongsTo(ScoreRange::class);
    }
}
```

`database/factories/FormFactory.php`:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<\App\Models\Form> */
class FormFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'description' => fake()->sentence(),
        ];
    }
}
```

`database/factories/CampaignFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Form;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Campaign> */
class CampaignFactory extends Factory
{
    public function definition(): array
    {
        return [
            'form_id' => Form::factory(),
            'name' => 'Campaña '.fake()->unique()->numberBetween(1, 9999),
            'starts_at' => now()->subDay()->toDateString(),
            'ends_at' => now()->addDays(7)->toDateString(),
            'closed_at' => null,
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDay()->toDateString(),
            'ends_at' => now()->addDays(7)->toDateString(),
            'closed_at' => null,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['closed_at' => now()]);
    }
}
```

`database/factories/SubmissionFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Submission> */
class SubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'role_function' => fake()->jobTitle(),
            'age' => fake()->numberBetween(18, 70),
            'sex' => fake()->randomElement(Sex::cases()),
            'marital_status' => fake()->randomElement(MaritalStatus::cases()),
            'children_count' => fake()->numberBetween(0, 4),
            'cohabitation_group' => fake()->randomElement(CohabitationGroup::cases()),
            'work_email' => fake()->unique()->companyEmail(),
            'phone' => fake()->numerify('+54 9 ## ####-####'),
            'submitted_at' => now(),
        ];
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=CampaignModelTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Models database/factories tests/Feature/CampaignModelTest.php
git commit -m "feat: add form, campaign and submission models with factories"
```

---

## Phase 2 — Servicios: validación de rangos y scoring

### Task 7: RangeCoverageValidator (cobertura contigua y exhaustiva)

**Files:**
- Create: `app/Services/RangeCoverageValidator.php`
- Test: `tests/Unit/RangeCoverageValidatorTest.php`

**Interfaces:**
- Consumes: `Evaluation::maxPossiblePoints()`.
- Produces: `RangeCoverageValidator::validate(int $maxPoints, array $ranges): void` donde `$ranges` es `array<int, array{min_points:int, max_points:int}>`. Lanza `InvalidArgumentException` con mensaje en español si hay hueco, solape, no arranca en 0, no termina en `$maxPoints`, o algún `min > max`. No devuelve nada si es válido.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Services\RangeCoverageValidator;

beforeEach(function () {
    $this->validator = new RangeCoverageValidator();
});

it('accepts contiguous ranges covering 0..max', function () {
    $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 3],
        ['min_points' => 4, 'max_points' => 8],
    ]);
})->throwsNoExceptions();

it('rejects ranges that do not start at zero', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 1, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'debe empezar en 0');
});

it('rejects ranges that do not end at the max', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 5],
    ]))->toThrow(InvalidArgumentException::class, 'debe terminar en 8');
});

it('rejects a gap between ranges', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 3],
        ['min_points' => 5, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'hueco');
});

it('rejects an overlap between ranges', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 4],
        ['min_points' => 4, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'solap');
});

it('rejects a range whose min exceeds its max', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 8],
        ['min_points' => 6, 'max_points' => 5],
    ]))->toThrow(InvalidArgumentException::class);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=RangeCoverageValidatorTest`
Expected: FAIL.

- [ ] **Step 3: Write the validator**

```php
<?php

namespace App\Services;

use InvalidArgumentException;

class RangeCoverageValidator
{
    /**
     * @param  array<int, array{min_points:int, max_points:int}>  $ranges
     */
    public function validate(int $maxPoints, array $ranges): void
    {
        if ($ranges === []) {
            throw new InvalidArgumentException('Debe definir al menos un rango.');
        }

        foreach ($ranges as $range) {
            if ($range['min_points'] > $range['max_points']) {
                throw new InvalidArgumentException(
                    "El rango {$range['min_points']}–{$range['max_points']} tiene el mínimo mayor que el máximo."
                );
            }
        }

        usort($ranges, fn ($a, $b) => $a['min_points'] <=> $b['min_points']);

        if ($ranges[0]['min_points'] !== 0) {
            throw new InvalidArgumentException('El primer rango debe empezar en 0.');
        }

        $last = $ranges[array_key_last($ranges)];
        if ($last['max_points'] !== $maxPoints) {
            throw new InvalidArgumentException("El último rango debe terminar en {$maxPoints} (puntaje máximo posible).");
        }

        for ($i = 1; $i < count($ranges); $i++) {
            $prevMax = $ranges[$i - 1]['max_points'];
            $currMin = $ranges[$i]['min_points'];

            if ($currMin <= $prevMax) {
                throw new InvalidArgumentException("Los rangos se solapan cerca del puntaje {$currMin}.");
            }

            if ($currMin !== $prevMax + 1) {
                throw new InvalidArgumentException("Hay un hueco entre los puntajes {$prevMax} y {$currMin}.");
            }
        }
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=RangeCoverageValidatorTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/RangeCoverageValidator.php tests/Unit/RangeCoverageValidatorTest.php
git commit -m "feat: add range coverage validator"
```

---

### Task 8: ScoringService (snapshot de resultado por Evaluación)

**Files:**
- Create: `app/Services/ScoringService.php`
- Test: `tests/Feature/ScoringServiceTest.php`

**Interfaces:**
- Consumes: `Submission` con `answers` cargadas, `Form->evaluations`, `ScoreRange::contains()`.
- Produces: `ScoringService::computeAndStore(Submission $submission): void` — por cada Evaluación del Formulario de la campaña del envío, suma los `points` de las Opciones elegidas (join answers→options filtradas a preguntas de esa evaluación), encuentra el `ScoreRange` que contiene el total y crea un `SubmissionResult` con `total_points`, `score_range_id` y copia de `result_text`. Si ningún rango contiene el total (no debería pasar por la validación de cobertura), `score_range_id` queda null y `result_text` = ''.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Services\ScoringService;

it('stores one snapshot result per evaluation with the matching range text', function () {
    $evaluation = Evaluation::factory()->create();
    $q1 = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $o1a = $q1->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);
    $o1b = $q1->options()->create(['label' => 'Siempre', 'points' => 3, 'position' => 2]);
    $q2 = $evaluation->questions()->create(['label' => 'Q2', 'type' => QuestionType::Select, 'required' => true, 'position' => 2]);
    $o2a = $q2->options()->create(['label' => 'Bajo', 'points' => 1, 'position' => 1]);
    $o2b = $q2->options()->create(['label' => 'Alto', 'points' => 5, 'position' => 2]);

    $evaluation->scoreRanges()->create(['min_points' => 0, 'max_points' => 3, 'result_text' => 'Bienestar bueno', 'position' => 1]);
    $evaluation->scoreRanges()->create(['min_points' => 4, 'max_points' => 8, 'result_text' => 'Requiere atención', 'position' => 2]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();
    $submission = Submission::factory()->for($campaign)->create();

    // Elige Siempre (3) + Alto (5) = 8 → "Requiere atención"
    $submission->answers()->create(['question_id' => $q1->id, 'question_option_id' => $o1b->id]);
    $submission->answers()->create(['question_id' => $q2->id, 'question_option_id' => $o2b->id]);

    app(ScoringService::class)->computeAndStore($submission->fresh('answers'));

    $result = $submission->results()->first();
    expect($result->total_points)->toBe(8)
        ->and($result->result_text)->toBe('Requiere atención')
        ->and($result->evaluation_id)->toBe($evaluation->id);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=ScoringServiceTest`
Expected: FAIL.

- [ ] **Step 3: Write the service**

```php
<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Submission;

class ScoringService
{
    public function computeAndStore(Submission $submission): void
    {
        $submission->loadMissing('answers.option', 'campaign.form.evaluations.questions', 'campaign.form.evaluations.scoreRanges');

        $optionPointsByQuestion = $submission->answers
            ->filter(fn ($answer) => $answer->option !== null)
            ->mapWithKeys(fn ($answer) => [$answer->question_id => (int) $answer->option->points]);

        foreach ($submission->campaign->form->evaluations as $evaluation) {
            $total = $this->totalForEvaluation($evaluation, $optionPointsByQuestion->toArray());
            $range = $evaluation->scoreRanges->first(fn ($r) => $r->contains($total));

            $submission->results()->create([
                'evaluation_id' => $evaluation->id,
                'total_points' => $total,
                'score_range_id' => $range?->id,
                'result_text' => $range?->result_text ?? '',
            ]);
        }
    }

    /**
     * @param  array<int, int>  $optionPointsByQuestion
     */
    private function totalForEvaluation(Evaluation $evaluation, array $optionPointsByQuestion): int
    {
        return (int) $evaluation->questions
            ->filter(fn ($q) => $q->type->isScored())
            ->sum(fn ($q) => $optionPointsByQuestion[$q->id] ?? 0);
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=ScoringServiceTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/ScoringService.php tests/Feature/ScoringServiceTest.php
git commit -m "feat: add scoring service with per-evaluation result snapshot"
```

---

### Task 9: Seeder de bienestar (evaluaciones + preguntas + opciones + rangos demo)

**Files:**
- Create: `database/seeders/WellbeingSeeder.php`, `database/seeders/AdminUserSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/WellbeingSeederTest.php`

**Interfaces:**
- Consumes: modelos del catálogo, `RangeCoverageValidator`.
- Produces: al correr `WellbeingSeeder`, existe ≥1 Evaluación con preguntas de varios tipos, opciones con puntajes, y Rangos que cubren 0..max sin huecos. `AdminUserSeeder` crea `admin@bienestar.test` / `password`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Evaluation;
use App\Models\User;
use App\Services\RangeCoverageValidator;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\WellbeingSeeder;

it('seeds at least one evaluation with valid range coverage', function () {
    $this->seed(WellbeingSeeder::class);

    $evaluation = Evaluation::with(['questions.options', 'scoreRanges'])->first();
    expect($evaluation)->not->toBeNull()
        ->and($evaluation->questions)->not->toBeEmpty()
        ->and($evaluation->scoreRanges)->not->toBeEmpty();

    $ranges = $evaluation->scoreRanges->map(fn ($r) => ['min_points' => $r->min_points, 'max_points' => $r->max_points])->all();
    (new RangeCoverageValidator())->validate($evaluation->maxPossiblePoints(), $ranges);
})->throwsNoExceptions();

it('seeds an admin user', function () {
    $this->seed(AdminUserSeeder::class);
    expect(User::where('email', 'admin@bienestar.test')->exists())->toBeTrue();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=WellbeingSeederTest`
Expected: FAIL.

- [ ] **Step 3: Write the seeders**

`database/seeders/WellbeingSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use Illuminate\Database\Seeder;

class WellbeingSeeder extends Seeder
{
    public function run(): void
    {
        $estres = Evaluation::create([
            'name' => 'Nivel de estrés',
            'slug' => 'nivel-de-estres',
            'description' => 'Mide la percepción de estrés en las últimas semanas.',
            'position' => 1,
        ]);

        $frequency = [
            ['label' => 'Nunca', 'points' => 0],
            ['label' => 'A veces', 'points' => 1],
            ['label' => 'Seguido', 'points' => 2],
            ['label' => 'Siempre', 'points' => 3],
        ];

        foreach ([
            '¿Con qué frecuencia te sentiste sobrepasado/a en el trabajo?',
            '¿Con qué frecuencia dormiste mal por preocupaciones laborales?',
            '¿Con qué frecuencia te costó desconectar al terminar el día?',
        ] as $i => $label) {
            $question = $estres->questions()->create([
                'label' => $label,
                'type' => QuestionType::Radio,
                'required' => true,
                'position' => $i + 1,
            ]);
            foreach ($frequency as $p => $option) {
                $question->options()->create([...$option, 'position' => $p + 1]);
            }
        }

        // Pregunta informativa (no puntúa)
        $estres->questions()->create([
            'label' => 'Contanos brevemente qué es lo que más te genera estrés (opcional).',
            'type' => QuestionType::Textarea,
            'required' => false,
            'position' => 4,
        ]);

        // Max posible = 3 preguntas * 3 = 9
        $estres->scoreRanges()->createMany([
            ['min_points' => 0, 'max_points' => 3, 'result_text' => 'Nivel de estrés bajo.', 'position' => 1],
            ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Nivel de estrés moderado.', 'position' => 2],
            ['min_points' => 7, 'max_points' => 9, 'result_text' => 'Nivel de estrés alto.', 'position' => 3],
        ]);
    }
}
```

`database/seeders/AdminUserSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@bienestar.test'],
            ['name' => 'Administrador', 'password' => Hash::make('password')],
        );
    }
}
```

Modify `database/seeders/DatabaseSeeder.php` — reemplazar el cuerpo de `run()`:

```php
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            WellbeingSeeder::class,
        ]);
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=WellbeingSeederTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add database/seeders tests/Feature/WellbeingSeederTest.php
git commit -m "feat: add wellbeing and admin seeders"
```

---

## Phase 3 — Formulario público

### Task 10: Mostrar el formulario público (resolver campaña abierta)

**Files:**
- Create: `app/Http/Controllers/PublicFormController.php`
- Modify: `routes/web.php`
- Create: `resources/js/pages/public/form.tsx`, `resources/js/pages/public/unavailable.tsx`
- Test: `tests/Feature/PublicFormShowTest.php`

**Interfaces:**
- Consumes: `Form` (route model binding por slug), `Form::openCampaign()`, `Form::evaluations`.
- Produces: `GET /f/{form:slug}` → `PublicFormController@show`. Si hay campaña abierta, renderiza `public/form` con `{ form, campaign, evaluations: [{id, name, description, questions: [{id, label, type, required, options:[{id,label}]}]}] }`. Si no, renderiza `public/unavailable`. Rutas nombradas: `public-form.show`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;

it('shows the form when a campaign is open', function () {
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $q->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    Campaign::factory()->open()->for($form)->create();

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/form')
            ->has('evaluations.0.questions.0.options.0'));
});

it('shows unavailable when there is no open campaign', function () {
    $form = Form::factory()->create();
    Campaign::factory()->closed()->for($form)->create();

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/unavailable'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=PublicFormShowTest`
Expected: FAIL.

- [ ] **Step 3: Write the controller and routes**

`app/Http/Controllers/PublicFormController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Inertia\Inertia;
use Inertia\Response;

class PublicFormController extends Controller
{
    public function show(Form $form): Response
    {
        $campaign = $form->openCampaign();

        if ($campaign === null) {
            return Inertia::render('public/unavailable', [
                'form' => ['name' => $form->name],
            ]);
        }

        $form->load('evaluations.questions.options');

        return Inertia::render('public/form', [
            'form' => ['name' => $form->name, 'slug' => $form->slug],
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name],
            'evaluations' => $form->evaluations->map(fn ($evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'description' => $evaluation->description,
                'questions' => $evaluation->questions->map(fn ($q) => [
                    'id' => $q->id,
                    'label' => $q->label,
                    'type' => $q->type->value,
                    'required' => $q->required,
                    'options' => $q->options->map(fn ($o) => ['id' => $o->id, 'label' => $o->label])->values(),
                ])->values(),
            ])->values(),
        ]);
    }
}
```

Modify `routes/web.php` — append:

```php
use App\Http\Controllers\PublicFormController;

Route::get('/f/{form:slug}', [PublicFormController::class, 'show'])->name('public-form.show');
```

`resources/js/pages/public/unavailable.tsx`:

```tsx
interface Props {
    form: { name: string };
}

export default function Unavailable({ form }: Props) {
    return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">{form.name}</h1>
            <p className="text-gray-600">
                Este formulario no está disponible en este momento. Volvé a intentarlo cuando la campaña esté abierta.
            </p>
        </div>
    );
}
```

`resources/js/pages/public/form.tsx` (base; el submit se completa en la Task 11):

```tsx
import { Form } from '@inertiajs/react';

interface Option {
    id: number;
    label: string;
}
interface Question {
    id: number;
    label: string;
    type: 'input' | 'select' | 'radio' | 'date' | 'textarea';
    required: boolean;
    options: Option[];
}
interface Evaluation {
    id: number;
    name: string;
    description: string | null;
    questions: Question[];
}
interface Props {
    form: { name: string; slug: string };
    campaign: { id: number; name: string };
    evaluations: Evaluation[];
}

function QuestionField({ question }: { question: Question }) {
    const name = `answers[${question.id}]`;
    const common = 'w-full rounded border border-gray-300 p-2';

    if (question.type === 'radio') {
        return (
            <fieldset className="flex flex-col gap-1">
                {question.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2">
                        <input type="radio" name={name} value={o.id} required={question.required} />
                        {o.label}
                    </label>
                ))}
            </fieldset>
        );
    }
    if (question.type === 'select') {
        return (
            <select name={name} required={question.required} className={common} defaultValue="">
                <option value="" disabled>
                    Elegí una opción
                </option>
                {question.options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    }
    if (question.type === 'textarea') {
        return <textarea name={name} required={question.required} className={common} rows={3} />;
    }
    return <input type={question.type === 'date' ? 'date' : 'text'} name={name} required={question.required} className={common} />;
}

export default function PublicForm({ form, campaign, evaluations }: Props) {
    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold">{form.name}</h1>
            <p className="mb-6 text-sm text-gray-500">{campaign.name}</p>

            <Form action={`/f/${form.slug}`} method="post" className="flex flex-col gap-8">
                {({ errors, processing }) => (
                    <>
                        <section className="flex flex-col gap-3 rounded border border-gray-200 p-4">
                            <h2 className="font-medium">Tus datos</h2>
                            <input name="first_name" placeholder="Nombre" required className="rounded border border-gray-300 p-2" />
                            <input name="last_name" placeholder="Apellido" required className="rounded border border-gray-300 p-2" />
                            <input name="role_function" placeholder="Función que desempeñás" required className="rounded border border-gray-300 p-2" />
                            <input name="age" type="number" min={16} max={99} placeholder="Edad" required className="rounded border border-gray-300 p-2" />
                            <select name="sex" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>Sexo</option>
                                <option value="femenino">Femenino</option>
                                <option value="masculino">Masculino</option>
                                <option value="otro">Otro / Prefiere no decir</option>
                            </select>
                            <select name="marital_status" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>Estado civil</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="en_pareja">En pareja</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                            </select>
                            <input name="children_count" type="number" min={0} max={20} placeholder="Cantidad de hijos" required className="rounded border border-gray-300 p-2" />
                            <select name="cohabitation_group" required defaultValue="" className="rounded border border-gray-300 p-2">
                                <option value="" disabled>Grupo de convivencia</option>
                                <option value="solo">Solo/a</option>
                                <option value="con_pareja">Con pareja</option>
                                <option value="con_pareja_e_hijos">Con pareja e hijos</option>
                                <option value="con_hijos">Con hijos</option>
                                <option value="con_padres_familia">Con padres/familia</option>
                                <option value="con_companeros_otros">Con compañeros/otros</option>
                            </select>
                            <input name="work_email" type="email" placeholder="Email laboral" required className="rounded border border-gray-300 p-2" />
                            <input name="phone" placeholder="Celular" required className="rounded border border-gray-300 p-2" />
                            {errors.work_email && <p className="text-sm text-red-600">{errors.work_email}</p>}
                        </section>

                        {evaluations.map((evaluation) => (
                            <section key={evaluation.id} className="flex flex-col gap-4 rounded border border-gray-200 p-4">
                                <h2 className="font-medium">{evaluation.name}</h2>
                                {evaluation.questions.map((question) => (
                                    <div key={question.id} className="flex flex-col gap-1">
                                        <label className="text-sm">
                                            {question.label} {question.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <QuestionField question={question} />
                                    </div>
                                ))}
                            </section>
                        ))}

                        <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                            Enviar
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=PublicFormShowTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/PublicFormController.php routes/web.php resources/js/pages/public tests/Feature/PublicFormShowTest.php
git commit -m "feat: show public form resolving open campaign"
```

---

### Task 11: Procesar el Envío (validación, bloqueo de duplicado, scoring, agradecimiento)

**Files:**
- Create: `app/Http/Requests/StoreSubmissionRequest.php`
- Modify: `app/Http/Controllers/PublicFormController.php`, `routes/web.php`
- Create: `resources/js/pages/public/thank-you.tsx`
- Test: `tests/Feature/PublicFormStoreTest.php`

**Interfaces:**
- Consumes: `Form::openCampaign()`, `ScoringService::computeAndStore()`, `StoreSubmissionRequest`.
- Produces: `POST /f/{form:slug}` → `PublicFormController@store`. Valida perfil (todos obligatorios) y respuestas (opción obligatoria; informativas según `required`). Si el `work_email` ya envió esa campaña → redirect back con error `work_email` ("Ya respondiste este formulario."). Si válido: crea `Submission` + `SubmissionAnswer` (option para radio/select, `value_text` para input/date/textarea), corre scoring, redirige a `GET /f/{slug}/gracias` (`public/thank-you`). Si no hay campaña abierta → 404/redirect a unavailable.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;

function openFormWithRadio(): array
{
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $low = $q->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);
    $high = $q->options()->create(['label' => 'Siempre', 'points' => 3, 'position' => 2]);
    $evaluation->scoreRanges()->create(['min_points' => 0, 'max_points' => 1, 'result_text' => 'Bajo', 'position' => 1]);
    $evaluation->scoreRanges()->create(['min_points' => 2, 'max_points' => 3, 'result_text' => 'Alto', 'position' => 2]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();

    return [$form, $campaign, $q, $high];
}

function validProfile(array $extra = []): array
{
    return array_merge([
        'first_name' => 'Ana', 'last_name' => 'García', 'role_function' => 'Analista',
        'age' => 30, 'sex' => 'femenino', 'marital_status' => 'soltero',
        'children_count' => 0, 'cohabitation_group' => 'solo',
        'work_email' => 'ana@empresa.test', 'phone' => '+54 11 1234-5678',
    ], $extra);
}

it('stores a submission with answers and computed result, then redirects to thank-you', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->post("/f/{$form->slug}", validProfile([
        'answers' => [$q->id => $high->id],
    ]))->assertRedirect("/f/{$form->slug}/gracias");

    $submission = Submission::first();
    expect($submission->work_email)->toBe('ana@empresa.test')
        ->and($submission->answers)->toHaveCount(1)
        ->and($submission->results->first()->total_points)->toBe(3)
        ->and($submission->results->first()->result_text)->toBe('Alto');
});

it('blocks a duplicate email within the same campaign', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();
    Submission::factory()->for($campaign)->create(['work_email' => 'ana@empresa.test']);

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", validProfile(['answers' => [$q->id => $high->id]]))
        ->assertRedirect("/f/{$form->slug}")
        ->assertSessionHasErrors('work_email');

    expect(Submission::where('work_email', 'ana@empresa.test')->count())->toBe(1);
});

it('rejects a submission missing a required option answer', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", validProfile(['answers' => []]))
        ->assertSessionHasErrors("answers.{$q->id}");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=PublicFormStoreTest`
Expected: FAIL.

- [ ] **Step 3: Write the request, controller store, route, thank-you page**

`app/Http/Requests/StoreSubmissionRequest.php`:

```php
<?php

namespace App\Http\Requests;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use App\Models\Campaign;
use App\Models\Question;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'role_function' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:16', 'max:99'],
            'sex' => ['required', Rule::enum(Sex::class)],
            'marital_status' => ['required', Rule::enum(MaritalStatus::class)],
            'children_count' => ['required', 'integer', 'min:0', 'max:20'],
            'cohabitation_group' => ['required', Rule::enum(CohabitationGroup::class)],
            'work_email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'answers' => ['array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var Campaign $campaign */
            $campaign = $this->route('campaign');
            $questions = $campaign->form->evaluations->flatMap->questions;
            $answers = (array) $this->input('answers', []);

            foreach ($questions as $question) {
                $value = $answers[$question->id] ?? null;
                $mustAnswer = $question->type->isScored() || $question->required;

                if ($mustAnswer && ($value === null || $value === '')) {
                    $validator->errors()->add("answers.{$question->id}", 'Esta pregunta es obligatoria.');

                    continue;
                }

                if ($question->type->isScored() && $value !== null && $value !== '') {
                    $belongs = $question->options->contains(fn ($o) => (string) $o->id === (string) $value);
                    if (! $belongs) {
                        $validator->errors()->add("answers.{$question->id}", 'Opción inválida.');
                    }
                }
            }
        });
    }
}
```

> Nota: la ruta inyecta la `Campaign` abierta vía `store()` (ver abajo); el request la lee de `$this->route('campaign')`.

Modify `app/Http/Controllers/PublicFormController.php` — add `store` and imports:

```php
use App\Http\Requests\StoreSubmissionRequest;
use App\Models\Campaign;
use App\Models\Form;
use App\Models\Question;
use App\Services\ScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
```

```php
    public function store(Form $form, ScoringService $scoring): RedirectResponse
    {
        $campaign = $form->openCampaign();
        abort_if($campaign === null, 404);

        $form->load('evaluations.questions.options');
        $campaign->setRelation('form', $form);

        // Bind campaign so StoreSubmissionRequest can validate answers against it.
        request()->route()->setParameter('campaign', $campaign);
        $data = app(StoreSubmissionRequest::class)->validated();

        if ($campaign->submissions()->where('work_email', $data['work_email'])->exists()) {
            return back()->withErrors(['work_email' => 'Ya respondiste este formulario.'])->withInput();
        }

        $submission = DB::transaction(function () use ($campaign, $form, $data) {
            $submission = $campaign->submissions()->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'role_function' => $data['role_function'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'marital_status' => $data['marital_status'],
                'children_count' => $data['children_count'],
                'cohabitation_group' => $data['cohabitation_group'],
                'work_email' => $data['work_email'],
                'phone' => $data['phone'],
                'submitted_at' => now(),
            ]);

            $answers = (array) ($data['answers'] ?? []);
            foreach ($form->evaluations->flatMap->questions as $question) {
                $value = $answers[$question->id] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }

                $submission->answers()->create([
                    'question_id' => $question->id,
                    'question_option_id' => $question->type->isScored() ? (int) $value : null,
                    'value_text' => $question->type->isScored() ? null : (string) $value,
                ]);
            }

            return $submission;
        });

        $scoring->computeAndStore($submission);

        return redirect()->route('public-form.thank-you', $form->slug);
    }

    public function thankYou(Form $form): Response
    {
        return Inertia::render('public/thank-you', ['form' => ['name' => $form->name]]);
    }
```

Modify `routes/web.php` — append:

```php
Route::post('/f/{form:slug}', [PublicFormController::class, 'store'])->name('public-form.store');
Route::get('/f/{form:slug}/gracias', [PublicFormController::class, 'thankYou'])->name('public-form.thank-you');
```

`resources/js/pages/public/thank-you.tsx`:

```tsx
interface Props {
    form: { name: string };
}

export default function ThankYou({ form }: Props) {
    return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">¡Gracias por participar!</h1>
            <p className="text-gray-600">Recibimos tus respuestas del formulario "{form.name}".</p>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=PublicFormStoreTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Requests/StoreSubmissionRequest.php app/Http/Controllers/PublicFormController.php routes/web.php resources/js/pages/public tests/Feature/PublicFormStoreTest.php
git commit -m "feat: process public submission with dedup, scoring and thank-you"
```

---

## Phase 4 — Autenticación del panel

### Task 12: Login de administrador (sesión, un solo rol)

**Files:**
- Create: `app/Http/Controllers/Admin/Auth/AuthenticatedSessionController.php`
- Create: `resources/js/pages/auth/login.tsx`
- Create: `routes/admin.php`
- Modify: `bootstrap/app.php` (registrar `routes/admin.php`)
- Test: `tests/Feature/AdminAuthTest.php`

**Interfaces:**
- Consumes: `User` model, guard `web`.
- Produces: `GET /admin/login` (`auth/login`), `POST /admin/login` (valida credenciales, autentica, redirige a `/admin/forms`), `POST /admin/logout`. Grupo de rutas admin protegido por middleware `auth`. Rutas nombradas `admin.login`, `admin.login.store`, `admin.logout`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\User;

it('logs in an admin with valid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);

    $this->post('/admin/login', ['email' => $user->email, 'password' => 'secret123'])
        ->assertRedirect('/admin/forms');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);

    $this->from('/admin/login')
        ->post('/admin/login', ['email' => $user->email, 'password' => 'wrong'])
        ->assertRedirect('/admin/login')
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('blocks guests from the admin area', function () {
    $this->get('/admin/forms')->assertRedirect('/admin/login');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=AdminAuthTest`
Expected: FAIL.

- [ ] **Step 3: Write the controller, routes, page, and wiring**

`app/Http/Controllers/Admin/Auth/AuthenticatedSessionController.php`:

```php
<?php

namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Las credenciales no coinciden.',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended('/admin/forms');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }
}
```

`routes/admin.php`:

```php
<?php

use App\Http\Controllers\Admin\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
    Route::post('/admin/login', [AuthenticatedSessionController::class, 'store'])->name('admin.login.store');
});

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    // Admin resource routes are appended in later tasks.
});
```

Modify `bootstrap/app.php` — extend `withRouting` `then` closure to load admin routes:

```php
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')->group(base_path('routes/admin.php'));
        },
    )
```

Add `use Illuminate\Support\Facades\Route;` at the top of `bootstrap/app.php`.

`resources/js/pages/auth/login.tsx`:

```tsx
import { Form } from '@inertiajs/react';

export default function Login() {
    return (
        <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
            <h1 className="text-xl font-semibold">Panel de administración</h1>
            <Form action="/admin/login" method="post" className="flex flex-col gap-3">
                {({ errors, processing }) => (
                    <>
                        <input name="email" type="email" placeholder="Email" required className="rounded border border-gray-300 p-2" />
                        <input name="password" type="password" placeholder="Contraseña" required className="rounded border border-gray-300 p-2" />
                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                        <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                            Ingresar
                        </button>
                    </>
                )}
            </Form>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=AdminAuthTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/Auth routes/admin.php bootstrap/app.php resources/js/pages/auth tests/Feature/AdminAuthTest.php
git commit -m "feat: add admin session authentication"
```

---

## Phase 5 — ABM de Formularios y Campañas

### Task 13: ABM de Formularios (listar, crear, editar, componer evaluaciones)

**Files:**
- Create: `app/Http/Controllers/Admin/FormController.php`, `app/Http/Requests/StoreFormRequest.php`, `app/Http/Requests/UpdateFormRequest.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/forms/index.tsx`, `create.tsx`, `edit.tsx`
- Test: `tests/Feature/Admin/FormCrudTest.php`

**Interfaces:**
- Consumes: `Form`, `Evaluation` (catálogo para elegir), auth middleware.
- Produces: resource `admin.forms` (index/create/store/edit/update/destroy). `store`/`update` aceptan `name`, `description`, `evaluation_ids: int[]` (se sincronizan en la pivote con `position` = índice). Slug autogenerado del nombre (único). Index lista formularios con nombre, cantidad de evaluaciones y estado (activo si `openCampaign()`).

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Evaluation;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists forms for the admin', function () {
    Form::factory()->count(2)->create();

    $this->get('/admin/forms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/forms/index')->has('forms', 2));
});

it('creates a form composing evaluations in order', function () {
    $a = Evaluation::factory()->create();
    $b = Evaluation::factory()->create();

    $this->post('/admin/forms', [
        'name' => 'Bienestar 2026',
        'description' => 'Medición anual',
        'evaluation_ids' => [$b->id, $a->id],
    ])->assertRedirect();

    $form = Form::firstWhere('name', 'Bienestar 2026');
    expect($form->slug)->toBe('bienestar-2026')
        ->and($form->evaluations()->orderBy('position')->pluck('evaluations.id')->all())->toBe([$b->id, $a->id]);
});

it('updates a form and re-syncs its evaluations', function () {
    $form = Form::factory()->create();
    $a = Evaluation::factory()->create();
    $form->evaluations()->attach($a, ['position' => 0]);
    $b = Evaluation::factory()->create();

    $this->put("/admin/forms/{$form->id}", [
        'name' => $form->name,
        'description' => null,
        'evaluation_ids' => [$b->id],
    ])->assertRedirect();

    expect($form->evaluations()->pluck('evaluations.id')->all())->toBe([$b->id]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=FormCrudTest`
Expected: FAIL.

- [ ] **Step 3: Write requests, controller, routes, pages**

`app/Http/Requests/StoreFormRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFormRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'evaluation_ids' => ['array'],
            'evaluation_ids.*' => ['integer', 'exists:evaluations,id'],
        ];
    }
}
```

`app/Http/Requests/UpdateFormRequest.php` — idéntico contenido a `StoreFormRequest` pero con clase `UpdateFormRequest` (repetir las mismas reglas):

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFormRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'evaluation_ids' => ['array'],
            'evaluation_ids.*' => ['integer', 'exists:evaluations,id'],
        ];
    }
}
```

`app/Http/Controllers/Admin/FormController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormRequest;
use App\Http\Requests\UpdateFormRequest;
use App\Models\Evaluation;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    public function index(): Response
    {
        $forms = Form::withCount('evaluations')->latest()->get()->map(fn (Form $form) => [
            'id' => $form->id,
            'name' => $form->name,
            'slug' => $form->slug,
            'evaluations_count' => $form->evaluations_count,
            'is_active' => $form->openCampaign() !== null,
        ]);

        return Inertia::render('admin/forms/index', ['forms' => $forms]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/forms/create', ['evaluations' => $this->evaluationOptions()]);
    }

    public function store(StoreFormRequest $request): RedirectResponse
    {
        $form = Form::create([
            'name' => $request->string('name'),
            'slug' => $this->uniqueSlug($request->string('name')),
            'description' => $request->input('description'),
        ]);
        $this->syncEvaluations($form, $request->input('evaluation_ids', []));

        return redirect()->route('admin.forms.index');
    }

    public function edit(Form $form): Response
    {
        return Inertia::render('admin/forms/edit', [
            'form' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
                'evaluation_ids' => $form->evaluations()->orderBy('position')->pluck('evaluations.id'),
            ],
            'evaluations' => $this->evaluationOptions(),
        ]);
    }

    public function update(UpdateFormRequest $request, Form $form): RedirectResponse
    {
        $form->update([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
        ]);
        $this->syncEvaluations($form, $request->input('evaluation_ids', []));

        return redirect()->route('admin.forms.index');
    }

    public function destroy(Form $form): RedirectResponse
    {
        $form->delete();

        return redirect()->route('admin.forms.index');
    }

    /**
     * @param  array<int, int>  $evaluationIds
     */
    private function syncEvaluations(Form $form, array $evaluationIds): void
    {
        $sync = [];
        foreach (array_values($evaluationIds) as $position => $id) {
            $sync[$id] = ['position' => $position];
        }
        $form->evaluations()->sync($sync);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;
        while (Form::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id:int, name:string}>
     */
    private function evaluationOptions()
    {
        return Evaluation::orderBy('position')->get()->map(fn (Evaluation $e) => ['id' => $e->id, 'name' => $e->name]);
    }
}
```

Modify `routes/admin.php` — inside the `auth`/`prefix('admin')` group add:

```php
use App\Http\Controllers\Admin\FormController;

    Route::resource('forms', FormController::class)->except('show');
```

`resources/js/pages/admin/forms/index.tsx`:

```tsx
import { Link, router } from '@inertiajs/react';

interface FormRow {
    id: number;
    name: string;
    slug: string;
    evaluations_count: number;
    is_active: boolean;
}

export default function FormsIndex({ forms }: { forms: FormRow[] }) {
    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Formularios</h1>
                <Link href="/admin/forms/create" className="rounded bg-black px-3 py-2 text-sm text-white">
                    Nuevo formulario
                </Link>
            </div>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Nombre</th>
                        <th>Evaluaciones</th>
                        <th>Estado</th>
                        <th>Link público</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map((form) => (
                        <tr key={form.id} className="border-b">
                            <td className="py-2">{form.name}</td>
                            <td>{form.evaluations_count}</td>
                            <td>{form.is_active ? 'Activo' : 'Inactivo'}</td>
                            <td>
                                <code>/f/{form.slug}</code>
                            </td>
                            <td className="flex gap-2">
                                <Link href={`/admin/forms/${form.id}/edit`} className="text-blue-600">
                                    Editar
                                </Link>
                                <Link href={`/admin/forms/${form.id}/campaigns`} className="text-blue-600">
                                    Campañas
                                </Link>
                                <button onClick={() => router.delete(`/admin/forms/${form.id}`)} className="text-red-600">
                                    Borrar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

`resources/js/pages/admin/forms/create.tsx`:

```tsx
import { Form, Link } from '@inertiajs/react';

interface EvaluationOption {
    id: number;
    name: string;
}

export default function FormCreate({ evaluations }: { evaluations: EvaluationOption[] }) {
    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Nuevo formulario</h1>
            <Form action="/admin/forms" method="post" className="flex flex-col gap-3">
                {({ errors, processing }) => (
                    <>
                        <input name="name" placeholder="Nombre" required className="rounded border border-gray-300 p-2" />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        <textarea name="description" placeholder="Descripción (opcional)" className="rounded border border-gray-300 p-2" />
                        <fieldset className="flex flex-col gap-1">
                            <legend className="text-sm font-medium">Evaluaciones que lo componen</legend>
                            {evaluations.map((e) => (
                                <label key={e.id} className="flex items-center gap-2">
                                    <input type="checkbox" name="evaluation_ids[]" value={e.id} />
                                    {e.name}
                                </label>
                            ))}
                        </fieldset>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white">
                                Guardar
                            </button>
                            <Link href="/admin/forms" className="px-4 py-2">
                                Cancelar
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}
```

`resources/js/pages/admin/forms/edit.tsx`:

```tsx
import { Form, Link } from '@inertiajs/react';

interface EvaluationOption {
    id: number;
    name: string;
}
interface Props {
    form: { id: number; name: string; description: string | null; evaluation_ids: number[] };
    evaluations: EvaluationOption[];
}

export default function FormEdit({ form, evaluations }: Props) {
    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Editar formulario</h1>
            <Form action={`/admin/forms/${form.id}`} method="put" className="flex flex-col gap-3">
                {({ errors, processing }) => (
                    <>
                        <input name="name" defaultValue={form.name} required className="rounded border border-gray-300 p-2" />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        <textarea name="description" defaultValue={form.description ?? ''} className="rounded border border-gray-300 p-2" />
                        <fieldset className="flex flex-col gap-1">
                            <legend className="text-sm font-medium">Evaluaciones que lo componen</legend>
                            {evaluations.map((e) => (
                                <label key={e.id} className="flex items-center gap-2">
                                    <input type="checkbox" name="evaluation_ids[]" value={e.id} defaultChecked={form.evaluation_ids.includes(e.id)} />
                                    {e.name}
                                </label>
                            ))}
                        </fieldset>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white">
                                Guardar
                            </button>
                            <Link href="/admin/forms" className="px-4 py-2">
                                Cancelar
                            </Link>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=FormCrudTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/FormController.php app/Http/Requests/StoreFormRequest.php app/Http/Requests/UpdateFormRequest.php routes/admin.php resources/js/pages/admin/forms tests/Feature/Admin/FormCrudTest.php
git commit -m "feat: add admin form CRUD with evaluation composition"
```

---

### Task 14: ABM de Campañas (abrir con validación de única abierta, cerrar)

**Files:**
- Create: `app/Http/Controllers/Admin/CampaignController.php`, `app/Http/Requests/StoreCampaignRequest.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/campaigns/index.tsx`
- Test: `tests/Feature/Admin/CampaignManagementTest.php`

**Interfaces:**
- Consumes: `Form`, `Campaign`, `Form::openCampaign()`.
- Produces: `GET /admin/forms/{form}/campaigns` (`admin/campaigns/index`), `POST /admin/forms/{form}/campaigns` (crea campaña; rechaza si el form ya tiene una abierta o si `ends_at < starts_at`), `POST /admin/campaigns/{campaign}/close` (setea `closed_at = now`). Rutas `admin.forms.campaigns.index`, `admin.forms.campaigns.store`, `admin.campaigns.close`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Campaign;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('opens a new campaign for a form', function () {
    $form = Form::factory()->create();

    $this->post("/admin/forms/{$form->id}/campaigns", [
        'name' => 'Q1 2026',
        'starts_at' => now()->toDateString(),
        'ends_at' => now()->addDays(10)->toDateString(),
    ])->assertRedirect();

    expect($form->campaigns()->count())->toBe(1)
        ->and($form->openCampaign())->not->toBeNull();
});

it('rejects opening a second campaign while one is open', function () {
    $form = Form::factory()->create();
    Campaign::factory()->open()->for($form)->create();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/forms/{$form->id}/campaigns", [
            'name' => 'Otra',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertSessionHasErrors('name');

    expect($form->campaigns()->count())->toBe(1);
});

it('closes an open campaign', function () {
    $campaign = Campaign::factory()->open()->create();

    $this->post("/admin/campaigns/{$campaign->id}/close")->assertRedirect();

    expect($campaign->fresh()->isOpen())->toBeFalse();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=CampaignManagementTest`
Expected: FAIL.

- [ ] **Step 3: Write the request, controller, routes, page**

`app/Http/Requests/StoreCampaignRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampaignRequest extends FormRequest
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
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
```

`app/Http/Controllers/Admin/CampaignController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCampaignRequest;
use App\Models\Campaign;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Form $form): Response
    {
        return Inertia::render('admin/campaigns/index', [
            'form' => ['id' => $form->id, 'name' => $form->name],
            'campaigns' => $form->campaigns->map(fn (Campaign $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'starts_at' => $c->starts_at->toDateString(),
                'ends_at' => $c->ends_at->toDateString(),
                'is_open' => $c->isOpen(),
                'submissions_count' => $c->submissions()->count(),
            ]),
        ]);
    }

    public function store(StoreCampaignRequest $request, Form $form): RedirectResponse
    {
        if ($form->openCampaign() !== null) {
            return back()->withErrors(['name' => 'Este formulario ya tiene una campaña abierta. Cerrala antes de abrir otra.']);
        }

        $form->campaigns()->create($request->validated());

        return redirect()->route('admin.forms.campaigns.index', $form);
    }

    public function close(Campaign $campaign): RedirectResponse
    {
        $campaign->update(['closed_at' => now()]);

        return redirect()->route('admin.forms.campaigns.index', $campaign->form_id);
    }
}
```

Modify `routes/admin.php` — inside the `auth`/`prefix('admin')` group add:

```php
use App\Http\Controllers\Admin\CampaignController;

    Route::get('forms/{form}/campaigns', [CampaignController::class, 'index'])->name('forms.campaigns.index');
    Route::post('forms/{form}/campaigns', [CampaignController::class, 'store'])->name('forms.campaigns.store');
    Route::post('campaigns/{campaign}/close', [CampaignController::class, 'close'])->name('campaigns.close');
```

`resources/js/pages/admin/campaigns/index.tsx`:

```tsx
import { Form, router } from '@inertiajs/react';

interface CampaignRow {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    is_open: boolean;
    submissions_count: number;
}
interface Props {
    form: { id: number; name: string };
    campaigns: CampaignRow[];
}

export default function CampaignsIndex({ form, campaigns }: Props) {
    const hasOpen = campaigns.some((c) => c.is_open);

    return (
        <div className="mx-auto max-w-3xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Campañas — {form.name}</h1>

            {!hasOpen && (
                <Form action={`/admin/forms/${form.id}/campaigns`} method="post" className="mb-6 flex flex-wrap items-end gap-2 rounded border p-4">
                    {({ errors, processing }) => (
                        <>
                            <input name="name" placeholder="Nombre (Q1 2026)" required className="rounded border border-gray-300 p-2" />
                            <input name="starts_at" type="date" required className="rounded border border-gray-300 p-2" />
                            <input name="ends_at" type="date" required className="rounded border border-gray-300 p-2" />
                            <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-white">
                                Abrir campaña
                            </button>
                            {errors.name && <p className="w-full text-sm text-red-600">{errors.name}</p>}
                        </>
                    )}
                </Form>
            )}

            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Nombre</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Envíos</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((c) => (
                        <tr key={c.id} className="border-b">
                            <td className="py-2">{c.name}</td>
                            <td>{c.starts_at}</td>
                            <td>{c.ends_at}</td>
                            <td>{c.submissions_count}</td>
                            <td>{c.is_open ? 'Abierta' : 'Cerrada'}</td>
                            <td>
                                {c.is_open && (
                                    <button onClick={() => router.post(`/admin/campaigns/${c.id}/close`)} className="text-red-600">
                                        Cerrar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=CampaignManagementTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/CampaignController.php app/Http/Requests/StoreCampaignRequest.php routes/admin.php resources/js/pages/admin/campaigns tests/Feature/Admin/CampaignManagementTest.php
git commit -m "feat: add campaign open/close management with single-open rule"
```

---

## Phase 6 — Configuración de Rangos/textos

### Task 15: Editor de Rangos de una Evaluación (con validación de cobertura y bloqueo por campaña abierta)

**Files:**
- Create: `app/Http/Controllers/Admin/ScoreRangeController.php`, `app/Http/Requests/UpdateScoreRangesRequest.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/ranges/edit.tsx`
- Test: `tests/Feature/Admin/ScoreRangeEditTest.php`

**Interfaces:**
- Consumes: `Evaluation::maxPossiblePoints()`, `RangeCoverageValidator`, `Evaluation::forms` → `openCampaign()`.
- Produces: `GET /admin/evaluations/{evaluation}/ranges` (`admin/ranges/edit`), `PUT /admin/evaluations/{evaluation}/ranges` (recibe `ranges: [{min_points, max_points, result_text}]`, valida cobertura vía `RangeCoverageValidator`; si alguna Campaña de algún Formulario que usa la Evaluación está abierta → error, sin guardar; si válido, reemplaza los rangos). Rutas `admin.evaluations.ranges.edit`, `admin.evaluations.ranges.update`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

function evaluationWithMax(int $max): Evaluation
{
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $q->options()->create(['label' => 'Min', 'points' => 0, 'position' => 1]);
    $q->options()->create(['label' => 'Max', 'points' => $max, 'position' => 2]);

    return $evaluation;
}

it('saves ranges that cover 0..max', function () {
    $evaluation = evaluationWithMax(6);

    $this->put("/admin/evaluations/{$evaluation->id}/ranges", [
        'ranges' => [
            ['min_points' => 0, 'max_points' => 3, 'result_text' => 'Bajo'],
            ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Alto'],
        ],
    ])->assertRedirect();

    expect($evaluation->scoreRanges()->count())->toBe(2);
});

it('rejects ranges with a gap', function () {
    $evaluation = evaluationWithMax(6);

    $this->from("/admin/evaluations/{$evaluation->id}/ranges")
        ->put("/admin/evaluations/{$evaluation->id}/ranges", [
            'ranges' => [
                ['min_points' => 0, 'max_points' => 2, 'result_text' => 'Bajo'],
                ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Alto'],
            ],
        ])
        ->assertSessionHasErrors('ranges');

    expect($evaluation->scoreRanges()->count())->toBe(0);
});

it('blocks editing ranges while a campaign using the evaluation is open', function () {
    $evaluation = evaluationWithMax(6);
    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 0]);
    Campaign::factory()->open()->for($form)->create();

    $this->from("/admin/evaluations/{$evaluation->id}/ranges")
        ->put("/admin/evaluations/{$evaluation->id}/ranges", [
            'ranges' => [['min_points' => 0, 'max_points' => 6, 'result_text' => 'Todo']],
        ])
        ->assertSessionHasErrors('ranges');

    expect($evaluation->scoreRanges()->count())->toBe(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=ScoreRangeEditTest`
Expected: FAIL.

- [ ] **Step 3: Write the request, controller, route, page**

`app/Http/Requests/UpdateScoreRangesRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScoreRangesRequest extends FormRequest
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
            'ranges' => ['required', 'array', 'min:1'],
            'ranges.*.min_points' => ['required', 'integer', 'min:0'],
            'ranges.*.max_points' => ['required', 'integer', 'min:0'],
            'ranges.*.result_text' => ['required', 'string'],
        ];
    }
}
```

`app/Http/Controllers/Admin/ScoreRangeController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateScoreRangesRequest;
use App\Models\Evaluation;
use App\Services\RangeCoverageValidator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Inertia\Inertia;
use Inertia\Response;

class ScoreRangeController extends Controller
{
    public function edit(Evaluation $evaluation): Response
    {
        return Inertia::render('admin/ranges/edit', [
            'evaluation' => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'max_points' => $evaluation->maxPossiblePoints(),
                'locked' => $this->hasOpenCampaign($evaluation),
                'ranges' => $evaluation->scoreRanges->map(fn ($r) => [
                    'min_points' => $r->min_points,
                    'max_points' => $r->max_points,
                    'result_text' => $r->result_text,
                ])->values(),
            ],
        ]);
    }

    public function update(UpdateScoreRangesRequest $request, Evaluation $evaluation, RangeCoverageValidator $validator): RedirectResponse
    {
        if ($this->hasOpenCampaign($evaluation)) {
            return back()->withErrors(['ranges' => 'No se puede editar: la evaluación participa en una campaña abierta.']);
        }

        $ranges = $request->validated()['ranges'];

        try {
            $validator->validate($evaluation->maxPossiblePoints(), array_map(
                fn ($r) => ['min_points' => (int) $r['min_points'], 'max_points' => (int) $r['max_points']],
                $ranges,
            ));
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['ranges' => $e->getMessage()]);
        }

        DB::transaction(function () use ($evaluation, $ranges) {
            $evaluation->scoreRanges()->delete();
            foreach (array_values($ranges) as $position => $r) {
                $evaluation->scoreRanges()->create([
                    'min_points' => (int) $r['min_points'],
                    'max_points' => (int) $r['max_points'],
                    'result_text' => $r['result_text'],
                    'position' => $position,
                ]);
            }
        });

        return redirect()->route('admin.evaluations.ranges.edit', $evaluation);
    }

    private function hasOpenCampaign(Evaluation $evaluation): bool
    {
        return $evaluation->forms()->get()->contains(fn ($form) => $form->openCampaign() !== null);
    }
}
```

Modify `routes/admin.php` — inside the `auth`/`prefix('admin')` group add:

```php
use App\Http\Controllers\Admin\ScoreRangeController;

    Route::get('evaluations/{evaluation}/ranges', [ScoreRangeController::class, 'edit'])->name('evaluations.ranges.edit');
    Route::put('evaluations/{evaluation}/ranges', [ScoreRangeController::class, 'update'])->name('evaluations.ranges.update');
```

`resources/js/pages/admin/ranges/edit.tsx`:

```tsx
import { useForm } from '@inertiajs/react';

interface Range {
    min_points: number;
    max_points: number;
    result_text: string;
}
interface Props {
    evaluation: { id: number; name: string; max_points: number; locked: boolean; ranges: Range[] };
}

export default function RangesEdit({ evaluation }: Props) {
    const { data, setData, put, processing, errors } = useForm<{ ranges: Range[] }>({
        ranges: evaluation.ranges.length ? evaluation.ranges : [{ min_points: 0, max_points: evaluation.max_points, result_text: '' }],
    });

    const update = (i: number, key: keyof Range, value: string) => {
        const next = [...data.ranges];
        next[i] = { ...next[i], [key]: key === 'result_text' ? value : Number(value) };
        setData('ranges', next);
    };

    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold">Rangos — {evaluation.name}</h1>
            <p className="mb-4 text-sm text-gray-500">Puntaje máximo posible: {evaluation.max_points}. Los rangos deben cubrir de 0 a {evaluation.max_points} sin huecos ni solapes.</p>

            {evaluation.locked && <p className="mb-4 rounded bg-yellow-100 p-2 text-sm">Bloqueado: hay una campaña abierta que usa esta evaluación.</p>}
            {errors.ranges && <p className="mb-4 text-sm text-red-600">{errors.ranges}</p>}

            <div className="flex flex-col gap-2">
                {data.ranges.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input type="number" value={r.min_points} onChange={(e) => update(i, 'min_points', e.target.value)} className="w-20 rounded border p-2" />
                        <span>–</span>
                        <input type="number" value={r.max_points} onChange={(e) => update(i, 'max_points', e.target.value)} className="w-20 rounded border p-2" />
                        <input value={r.result_text} onChange={(e) => update(i, 'result_text', e.target.value)} placeholder="Texto de resultado" className="flex-1 rounded border p-2" />
                        <button onClick={() => setData('ranges', data.ranges.filter((_, j) => j !== i))} className="text-red-600">
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-2">
                <button onClick={() => setData('ranges', [...data.ranges, { min_points: 0, max_points: 0, result_text: '' }])} className="rounded border px-3 py-2">
                    Agregar rango
                </button>
                <button
                    disabled={processing || evaluation.locked}
                    onClick={() => put(`/admin/evaluations/${evaluation.id}/ranges`)}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    Guardar
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=ScoreRangeEditTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/ScoreRangeController.php app/Http/Requests/UpdateScoreRangesRequest.php routes/admin.php resources/js/pages/admin/ranges tests/Feature/Admin/ScoreRangeEditTest.php
git commit -m "feat: add score range editor with coverage validation and open-campaign lock"
```

---

## Phase 7 — Resultados y reportes

### Task 16: Listado y detalle de resultados (individual identificado)

**Files:**
- Create: `app/Http/Controllers/Admin/ResultController.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/results/index.tsx`, `show.tsx`
- Test: `tests/Feature/Admin/ResultViewTest.php`

**Interfaces:**
- Consumes: `Campaign`, `Submission`, `SubmissionResult`.
- Produces: `GET /admin/campaigns/{campaign}/results` (`admin/results/index`) lista los Envíos de la campaña con nombre, email y resultados por evaluación. `GET /admin/submissions/{submission}` (`admin/results/show`) muestra el detalle: perfil completo + respuestas + resultado (texto snapshot) por Evaluación. Rutas `admin.campaigns.results`, `admin.submissions.show`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists submissions with their results for a campaign', function () {
    $campaign = Campaign::factory()->open()->create();
    $evaluation = Evaluation::factory()->create();
    $submission = Submission::factory()->for($campaign)->create(['first_name' => 'Ana', 'last_name' => 'García']);
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 5, 'score_range_id' => null, 'result_text' => 'Alto']);

    $this->get("/admin/campaigns/{$campaign->id}/results")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/results/index')->has('submissions', 1));
});

it('shows a single submission detail', function () {
    $submission = Submission::factory()->create(['first_name' => 'Ana']);

    $this->get("/admin/submissions/{$submission->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/results/show')->where('submission.first_name', 'Ana'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=ResultViewTest`
Expected: FAIL.

- [ ] **Step 3: Write the controller, routes, pages**

`app/Http/Controllers/Admin/ResultController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Submission;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function index(Campaign $campaign): Response
    {
        $campaign->load('form', 'submissions.results.evaluation');

        return Inertia::render('admin/results/index', [
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name, 'form_name' => $campaign->form->name],
            'submissions' => $campaign->submissions->map(fn (Submission $s) => [
                'id' => $s->id,
                'name' => "{$s->first_name} {$s->last_name}",
                'work_email' => $s->work_email,
                'submitted_at' => $s->submitted_at->toDateTimeString(),
                'results' => $s->results->map(fn ($r) => [
                    'evaluation' => $r->evaluation->name,
                    'total_points' => $r->total_points,
                    'result_text' => $r->result_text,
                ]),
            ]),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $submission->load('answers.question', 'answers.option', 'results.evaluation');

        return Inertia::render('admin/results/show', [
            'submission' => [
                'first_name' => $submission->first_name,
                'last_name' => $submission->last_name,
                'role_function' => $submission->role_function,
                'age' => $submission->age,
                'sex' => $submission->sex->label(),
                'marital_status' => $submission->marital_status->label(),
                'children_count' => $submission->children_count,
                'cohabitation_group' => $submission->cohabitation_group->label(),
                'work_email' => $submission->work_email,
                'phone' => $submission->phone,
                'answers' => $submission->answers->map(fn ($a) => [
                    'question' => $a->question->label,
                    'value' => $a->option?->label ?? $a->value_text,
                ]),
                'results' => $submission->results->map(fn ($r) => [
                    'evaluation' => $r->evaluation->name,
                    'total_points' => $r->total_points,
                    'result_text' => $r->result_text,
                ]),
            ],
        ]);
    }
}
```

Modify `routes/admin.php` — inside the `auth`/`prefix('admin')` group add:

```php
use App\Http\Controllers\Admin\ResultController;

    Route::get('campaigns/{campaign}/results', [ResultController::class, 'index'])->name('campaigns.results');
    Route::get('submissions/{submission}', [ResultController::class, 'show'])->name('submissions.show');
```

`resources/js/pages/admin/results/index.tsx`:

```tsx
import { Link } from '@inertiajs/react';

interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
}
interface Row {
    id: number;
    name: string;
    work_email: string;
    submitted_at: string;
    results: Result[];
}
interface Props {
    campaign: { id: number; name: string; form_name: string };
    submissions: Row[];
}

export default function ResultsIndex({ campaign, submissions }: Props) {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-1 text-2xl font-semibold">Resultados — {campaign.form_name}</h1>
            <p className="mb-4 text-sm text-gray-500">{campaign.name} · {submissions.length} envíos</p>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Empleado</th>
                        <th>Email</th>
                        <th>Resultados</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((s) => (
                        <tr key={s.id} className="border-b align-top">
                            <td className="py-2">{s.name}</td>
                            <td>{s.work_email}</td>
                            <td>
                                {s.results.map((r, i) => (
                                    <div key={i}>
                                        {r.evaluation}: <strong>{r.result_text}</strong> ({r.total_points})
                                    </div>
                                ))}
                            </td>
                            <td>
                                <Link href={`/admin/submissions/${s.id}`} className="text-blue-600">
                                    Ver detalle
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

`resources/js/pages/admin/results/show.tsx`:

```tsx
interface Answer {
    question: string;
    value: string | null;
}
interface Result {
    evaluation: string;
    total_points: number;
    result_text: string;
}
interface Submission {
    first_name: string;
    last_name: string;
    role_function: string;
    age: number;
    sex: string;
    marital_status: string;
    children_count: number;
    cohabitation_group: string;
    work_email: string;
    phone: string;
    answers: Answer[];
    results: Result[];
}

export default function ResultShow({ submission }: { submission: Submission }) {
    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">
                {submission.first_name} {submission.last_name}
            </h1>

            <section className="mb-6 grid grid-cols-2 gap-2 text-sm">
                <div>Función: {submission.role_function}</div>
                <div>Edad: {submission.age}</div>
                <div>Sexo: {submission.sex}</div>
                <div>Estado civil: {submission.marital_status}</div>
                <div>Hijos: {submission.children_count}</div>
                <div>Convivencia: {submission.cohabitation_group}</div>
                <div>Email: {submission.work_email}</div>
                <div>Celular: {submission.phone}</div>
            </section>

            <section className="mb-6">
                <h2 className="mb-2 font-medium">Resultados</h2>
                {submission.results.map((r, i) => (
                    <div key={i} className="mb-1">
                        {r.evaluation}: <strong>{r.result_text}</strong> ({r.total_points} pts)
                    </div>
                ))}
            </section>

            <section>
                <h2 className="mb-2 font-medium">Respuestas</h2>
                {submission.answers.map((a, i) => (
                    <div key={i} className="mb-1 text-sm">
                        <span className="text-gray-600">{a.question}</span>: {a.value ?? '—'}
                    </div>
                ))}
            </section>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=ResultViewTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/ResultController.php routes/admin.php resources/js/pages/admin/results tests/Feature/Admin/ResultViewTest.php
git commit -m "feat: add individual results list and detail views"
```

---

### Task 17: Reportes de uso (métricas agregadas por Campaña)

**Files:**
- Create: `app/Services/CampaignReport.php`, `app/Http/Controllers/Admin/ReportController.php`
- Modify: `routes/admin.php`
- Create: `resources/js/pages/admin/reports/index.tsx`
- Test: `tests/Feature/Admin/CampaignReportTest.php`

**Interfaces:**
- Consumes: `Campaign`, `Submission`, `SubmissionResult`.
- Produces: `CampaignReport::for(Campaign $campaign): array{submissions_total:int, by_range: array<string, array<string,int>>, by_sex: array<string,int>}` — `by_range` = por nombre de Evaluación, conteo por `result_text`; `by_sex` = conteo de Envíos por sexo (label). `GET /admin/campaigns/{campaign}/report` (`admin/reports/index`) renderiza esas métricas. Ruta `admin.campaigns.report`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\Sex;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;
use App\Services\CampaignReport;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('aggregates submissions by range and by sex', function () {
    $campaign = Campaign::factory()->open()->create();
    $evaluation = Evaluation::factory()->create(['name' => 'Estrés']);

    $ana = Submission::factory()->for($campaign)->create(['sex' => Sex::Female]);
    $ana->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 2, 'score_range_id' => null, 'result_text' => 'Bajo']);

    $beto = Submission::factory()->for($campaign)->create(['sex' => Sex::Male]);
    $beto->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 8, 'score_range_id' => null, 'result_text' => 'Alto']);

    $report = app(CampaignReport::class)->for($campaign);

    expect($report['submissions_total'])->toBe(2)
        ->and($report['by_range']['Estrés']['Bajo'])->toBe(1)
        ->and($report['by_range']['Estrés']['Alto'])->toBe(1)
        ->and($report['by_sex']['Femenino'])->toBe(1)
        ->and($report['by_sex']['Masculino'])->toBe(1);
});

it('renders the report page', function () {
    $campaign = Campaign::factory()->open()->create();

    $this->get("/admin/campaigns/{$campaign->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/reports/index'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `php artisan test --compact --filter=CampaignReportTest`
Expected: FAIL.

- [ ] **Step 3: Write the service, controller, route, page**

`app/Services/CampaignReport.php`:

```php
<?php

namespace App\Services;

use App\Models\Campaign;

class CampaignReport
{
    /**
     * @return array{submissions_total:int, by_range: array<string, array<string,int>>, by_sex: array<string,int>}
     */
    public function for(Campaign $campaign): array
    {
        $campaign->load('submissions.results.evaluation');

        $byRange = [];
        $bySex = [];

        foreach ($campaign->submissions as $submission) {
            $sexLabel = $submission->sex->label();
            $bySex[$sexLabel] = ($bySex[$sexLabel] ?? 0) + 1;

            foreach ($submission->results as $result) {
                $evaluationName = $result->evaluation->name;
                $text = $result->result_text !== '' ? $result->result_text : 'Sin rango';
                $byRange[$evaluationName][$text] = ($byRange[$evaluationName][$text] ?? 0) + 1;
            }
        }

        return [
            'submissions_total' => $campaign->submissions->count(),
            'by_range' => $byRange,
            'by_sex' => $bySex,
        ];
    }
}
```

`app/Http/Controllers/Admin/ReportController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignReport;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function show(Campaign $campaign, CampaignReport $report): Response
    {
        return Inertia::render('admin/reports/index', [
            'campaign' => ['id' => $campaign->id, 'name' => $campaign->name],
            'report' => $report->for($campaign),
        ]);
    }
}
```

Modify `routes/admin.php` — inside the `auth`/`prefix('admin')` group add:

```php
use App\Http\Controllers\Admin\ReportController;

    Route::get('campaigns/{campaign}/report', [ReportController::class, 'show'])->name('campaigns.report');
```

`resources/js/pages/admin/reports/index.tsx`:

```tsx
interface Report {
    submissions_total: number;
    by_range: Record<string, Record<string, number>>;
    by_sex: Record<string, number>;
}
interface Props {
    campaign: { id: number; name: string };
    report: Report;
}

export default function ReportsIndex({ campaign, report }: Props) {
    return (
        <div className="mx-auto max-w-3xl p-6">
            <h1 className="mb-1 text-2xl font-semibold">Reporte de uso — {campaign.name}</h1>
            <p className="mb-6 text-lg">Envíos completados: <strong>{report.submissions_total}</strong></p>

            <section className="mb-6">
                <h2 className="mb-2 font-medium">Distribución por resultado</h2>
                {Object.entries(report.by_range).map(([evaluation, counts]) => (
                    <div key={evaluation} className="mb-3">
                        <h3 className="text-sm font-semibold">{evaluation}</h3>
                        <ul className="text-sm">
                            {Object.entries(counts).map(([text, count]) => (
                                <li key={text}>
                                    {text}: {count}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <section>
                <h2 className="mb-2 font-medium">Por sexo</h2>
                <ul className="text-sm">
                    {Object.entries(report.by_sex).map(([sex, count]) => (
                        <li key={sex}>
                            {sex}: {count}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `php artisan test --compact --filter=CampaignReportTest`
Expected: PASS.

- [ ] **Step 5: Run the full suite + build**

Run: `php artisan test --compact`
Expected: PASS (todos los tests verdes).

Run: `npm run build`
Expected: build sin errores.

- [ ] **Step 6: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/CampaignReport.php app/Http/Controllers/Admin/ReportController.php routes/admin.php resources/js/pages/admin/reports tests/Feature/Admin/CampaignReportTest.php
git commit -m "feat: add campaign usage report with aggregation"
```

---

## Self-Review

**Spec coverage** (contra el entendimiento compartido y `CONTEXT.md`):
- Formulario público compuesto por Evaluaciones + perfil → Tasks 10–11. ✓
- Puntos en la Opción; texto/fecha/descripción no puntúan → Tasks 1, 5, 8. ✓
- Resultado por Evaluación + Rangos contiguos/exhaustivos validados → Tasks 7, 8, 15. ✓
- Snapshot de resultado + bloqueo de edición con campaña abierta → Tasks 8, 15 (ADR 0002). ✓
- Campañas: única abierta por Formulario, link estable, activo ⟺ campaña abierta → Tasks 6, 10, 14 (ADR 0001). ✓
- Unicidad (email, Campaña) con bloqueo → Tasks 4, 11. ✓
- Perfil fijo (10 campos, todos obligatorios), snapshot por Envío, email como nexo → Tasks 4, 6, 11. ✓
- Preguntas/Opciones/Evaluaciones por seeder sin ABM → Task 9. ✓
- ABM de Formularios y Campañas; config de Rangos/textos → Tasks 13, 14, 15. ✓
- Resultados individuales + agregados; reportes de uso por Campaña → Tasks 16, 17. ✓
- Empleado ve solo agradecimiento → Task 11. ✓
- Rol único de admin sobre `User` → Task 12. ✓

**Placeholder scan:** sin TODOs; cada step trae código completo. ✓

**Type consistency:** `computeAndStore` (Task 8) usado en Task 11; `RangeCoverageValidator::validate` (Task 7) usado en Tasks 9 y 15; `Campaign::isOpen`/`openCampaign` (Task 6) usados en Tasks 10, 14, 15; nombres de columnas consistentes entre migraciones (Tasks 2–4) y modelos (Tasks 5–6). ✓

## Notas de ejecución

- **Orden estricto:** las fases dependen en cadena (esquema → modelos → servicios → HTTP). Ejecutar en orden.
- **Route model binding de `StoreSubmissionRequest`:** la Task 11 inyecta la `Campaign` en la ruta antes de validar. Si al ejecutar preferís un enfoque más idiomático, mover la validación de respuestas a un método del controlador es aceptable siempre que los tests de la Task 11 sigan pasando.
- **Wayfinder:** las páginas usan URLs literales para no bloquear el avance; si querés tipado de rutas, correr `php artisan wayfinder:generate` e ir reemplazando por los helpers de `@/routes` y `@/actions` (activar skill `wayfinder-development`).
- **UI:** las páginas son funcionales pero mínimas. Pulido visual (layout admin, navegación, Tailwind) queda para una iteración posterior con el skill `ui-ux-pro-max`.
