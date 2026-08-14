<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Submission;
use App\Services\ScoringService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Demo data for the "Prueba reportes" form.
 *
 * Each child seeder fills one campaign with the same staff roster, so the same
 * person (identified by the normalized work email) shows up in every campaign
 * and the report and the employee comparison have something to compare. The
 * wellbeing profile of each person is drawn from a fixed seed and only moves by
 * `stressShift()`, which is what makes a later campaign look better or worse
 * than the previous one instead of pure noise.
 */
abstract class PruebaReportesCampaignSeeder extends Seeder
{
    protected const FORM_NAME = 'Prueba reportes';

    protected const FORM_SLUG = 'prueba-reportes';

    protected const EMAIL_DOMAIN = 'bienestar.test';

    /**
     * Seed of the per-person wellbeing profile. Shared by every campaign so the
     * baseline of a person never changes between takes.
     */
    private const PROFILE_SEED = 20260301;

    /**
     * Evaluations attached to the form when it is created from scratch (tests,
     * fresh database). On an existing form the admin's own selection is kept.
     *
     * @var list<string>
     */
    private const FORM_EVALUATIONS = [
        'senales-de-estres',
        'sintomas-fisicos',
        'conductas-habitos-saludables',
        'autopercepciones-del-trabajo',
        'sintomas-o-enfermedades',
    ];

    /**
     * The staff roster: first name, last name, role, sex, age, marital status,
     * children, cohabitation group. The email is derived from the name.
     *
     * @var list<array{0: string, 1: string, 2: string, 3: string, 4: int, 5: string, 6: int, 7: string}>
     */
    public const EMPLOYEES = [
        ['Lucía', 'Fernández', 'Analista de RR.HH.', 'femenino', 34, 'casado', 2, 'con_pareja_e_hijos'],
        ['Martín', 'Gómez', 'Jefe de Producción', 'masculino', 47, 'casado', 3, 'con_pareja_e_hijos'],
        ['Sofía', 'Rodríguez', 'Diseñadora gráfica', 'femenino', 28, 'soltero', 0, 'solo'],
        ['Diego', 'López', 'Operario de planta', 'masculino', 39, 'en_pareja', 1, 'con_pareja_e_hijos'],
        ['Valentina', 'Martínez', 'Analista contable', 'femenino', 31, 'en_pareja', 0, 'con_pareja'],
        ['Nicolás', 'Pérez', 'Desarrollador', 'masculino', 26, 'soltero', 0, 'con_padres_familia'],
        ['Camila', 'Sánchez', 'Coordinadora de calidad', 'femenino', 41, 'divorciado', 2, 'con_hijos'],
        ['Federico', 'Romero', 'Supervisor de logística', 'masculino', 52, 'casado', 2, 'con_pareja_e_hijos'],
        ['Agustina', 'Torres', 'Asistente administrativa', 'femenino', 24, 'soltero', 0, 'con_padres_familia'],
        ['Sebastián', 'Ruiz', 'Gerente comercial', 'masculino', 45, 'casado', 1, 'con_pareja_e_hijos'],
        ['Micaela', 'Álvarez', 'Analista de compras', 'femenino', 33, 'en_pareja', 0, 'con_pareja'],
        ['Gonzalo', 'Díaz', 'Técnico de mantenimiento', 'masculino', 37, 'casado', 2, 'con_pareja_e_hijos'],
        ['Julieta', 'Moreno', 'Responsable de marketing', 'femenino', 36, 'soltero', 1, 'con_hijos'],
        ['Emiliano', 'Muñoz', 'Operario de depósito', 'masculino', 29, 'en_pareja', 0, 'con_pareja'],
        ['Florencia', 'Rojas', 'Analista de sistemas', 'femenino', 30, 'soltero', 0, 'con_companeros_otros'],
        ['Ramiro', 'Herrera', 'Jefe de administración', 'masculino', 49, 'casado', 3, 'con_pareja_e_hijos'],
        ['Carolina', 'Medina', 'Recepcionista', 'femenino', 27, 'en_pareja', 0, 'con_pareja'],
        ['Tomás', 'Castro', 'Vendedor', 'masculino', 32, 'soltero', 0, 'solo'],
        ['Antonella', 'Ortiz', 'Analista de RR.HH.', 'femenino', 38, 'casado', 2, 'con_pareja_e_hijos'],
        ['Bruno', 'Silva', 'Chofer', 'masculino', 55, 'casado', 4, 'con_pareja_e_hijos'],
        ['Rocío', 'Núñez', 'Coordinadora de capacitación', 'femenino', 42, 'divorciado', 1, 'con_hijos'],
        ['Ignacio', 'Vega', 'Analista financiero', 'masculino', 35, 'en_pareja', 0, 'con_pareja'],
        ['Milagros', 'Ramos', 'Operaria de planta', 'femenino', 23, 'soltero', 0, 'con_padres_familia'],
        ['Facundo', 'Aguirre', 'Supervisor de turno', 'masculino', 44, 'casado', 2, 'con_pareja_e_hijos'],
        ['Paula', 'Benítez', 'Analista de calidad', 'femenino', 29, 'soltero', 0, 'solo'],
        ['Leandro', 'Molina', 'Jefe de sistemas', 'masculino', 40, 'casado', 1, 'con_pareja_e_hijos'],
        ['Daniela', 'Acosta', 'Asistente de gerencia', 'femenino', 46, 'viudo', 2, 'con_hijos'],
        ['Matías', 'Sosa', 'Operario de mantenimiento', 'masculino', 31, 'en_pareja', 1, 'con_pareja_e_hijos'],
        ['Belén', 'Giménez', 'Analista de datos', 'femenino', 26, 'soltero', 0, 'con_companeros_otros'],
        ['Hernán', 'Peralta', 'Encargado de depósito', 'masculino', 50, 'casado', 3, 'con_pareja_e_hijos'],
        ['Victoria', 'Cabrera', 'Community manager', 'femenino', 25, 'soltero', 0, 'con_padres_familia'],
        ['Alejandro', 'Ledesma', 'Gerente de operaciones', 'masculino', 53, 'divorciado', 2, 'solo'],
        ['Guadalupe', 'Ríos', 'Analista de nómina', 'femenino', 37, 'casado', 1, 'con_pareja_e_hijos'],
        ['Joaquín', 'Domínguez', 'Vendedor senior', 'masculino', 43, 'casado', 2, 'con_pareja_e_hijos'],
        ['Ariana', 'Ferreyra', 'Asistente contable', 'femenino', 22, 'soltero', 0, 'con_padres_familia'],
        ['Lucas', 'Godoy', 'Operario de planta', 'masculino', 34, 'en_pareja', 1, 'con_pareja_e_hijos'],
        ['Malena', 'Ibarra', 'Coordinadora de proyectos', 'femenino', 39, 'en_pareja', 0, 'con_pareja'],
        ['Santiago', 'Correa', 'Analista de logística', 'masculino', 28, 'soltero', 0, 'con_companeros_otros'],
        ['Noelia', 'Maldonado', 'Jefa de compras', 'femenino', 48, 'casado', 3, 'con_pareja_e_hijos'],
        ['Franco', 'Suárez', 'Técnico electricista', 'masculino', 36, 'casado', 2, 'con_pareja_e_hijos'],
        ['Abril', 'Ojeda', 'Analista de marketing', 'femenino', 27, 'en_pareja', 0, 'con_pareja'],
        ['Maximiliano', 'Bustos', 'Supervisor de calidad', 'masculino', 41, 'divorciado', 1, 'solo'],
        ['Lorena', 'Villalba', 'Responsable de higiene y seguridad', 'femenino', 45, 'casado', 2, 'con_pareja_e_hijos'],
        ['Ezequiel', 'Cardozo', 'Operario de expedición', 'masculino', 30, 'soltero', 0, 'con_padres_familia'],
        ['Marina', 'Ponce', 'Analista de administración', 'femenino', 33, 'casado', 1, 'con_pareja_e_hijos'],
        ['Rodrigo', 'Escobar', 'Jefe de planta', 'masculino', 57, 'casado', 3, 'con_pareja'],
        ['Ailén', 'Quiroga', 'Asistente de RR.HH.', 'femenino', 24, 'soltero', 0, 'con_companeros_otros'],
        ['Pablo', 'Navarro', 'Director general', 'masculino', 60, 'casado', 2, 'con_pareja'],
    ];

    abstract protected function campaignName(): string;

    /**
     * Dates used only when the campaign has to be created. A campaign the admin
     * already opened from the panel keeps its own window.
     */
    abstract protected function campaignStartsAt(): CarbonImmutable;

    abstract protected function campaignEndsAt(): CarbonImmutable;

    /**
     * Seed of the answer noise. Must differ per campaign so two takes of the
     * same person are not identical answer by answer.
     */
    abstract protected function randomSeed(): int;

    /**
     * How much the whole staff moves against its baseline. Negative means the
     * campaign went better (less stress, more healthy habits).
     */
    protected function stressShift(): float
    {
        return 0.0;
    }

    /**
     * Roster indexes that did not answer this campaign, to make the response
     * count differ between takes.
     *
     * @return list<int>
     */
    protected function absentEmployees(): array
    {
        return [];
    }

    /**
     * When the campaign is already over. An open campaign blocks the admin from
     * running a new one on the same form.
     */
    protected function closedAt(): ?CarbonImmutable
    {
        return $this->campaignEndsAt()->endOfDay();
    }

    public function run(): void
    {
        $form = $this->form();
        $campaign = $this->campaign($form);

        $form->load('evaluations.questions.options');
        $campaign->setRelation('form', $form);

        $profiles = $this->stressProfiles();
        $scoring = app(ScoringService::class);

        mt_srand($this->randomSeed());

        foreach (self::EMPLOYEES as $index => $employee) {
            if (in_array($index, $this->absentEmployees(), true)) {
                continue;
            }

            $submission = $this->createSubmission($campaign, $index, $employee);
            $submission->setRelation('campaign', $campaign);

            $this->storeAnswers($submission, $form, $profiles[$index]);
            $scoring->computeAndStore($submission);
        }

        $this->command->info("Campaña «{$campaign->name}»: ".$campaign->submissions()->count().' respuestas.');
    }

    /**
     * The form the admin created from the panel. Created on the fly when it is
     * missing so the seeder also works on a fresh database.
     */
    private function form(): Form
    {
        $form = Form::firstOrCreate(
            ['slug' => self::FORM_SLUG],
            ['name' => self::FORM_NAME, 'description' => 'Formulario de prueba para validar los reportes y las comparativas entre campañas.'],
        );

        if ($form->evaluations()->doesntExist()) {
            $evaluations = Evaluation::whereIn('slug', self::FORM_EVALUATIONS)->get();

            foreach (self::FORM_EVALUATIONS as $position => $slug) {
                $evaluation = $evaluations->firstWhere('slug', $slug);

                if ($evaluation !== null) {
                    $form->evaluations()->attach($evaluation->id, ['position' => $position]);
                }
            }

            $form->unsetRelation('evaluations');
        }

        return $form;
    }

    /**
     * The campaign, emptied of previous submissions so re-running the seeder
     * regenerates the same data instead of duplicating it.
     */
    private function campaign(Form $form): Campaign
    {
        $campaign = $form->campaigns()->firstOrCreate(
            ['name' => $this->campaignName()],
            [
                'starts_at' => $this->campaignStartsAt()->toDateString(),
                'ends_at' => $this->campaignEndsAt()->toDateString(),
                'closed_at' => $this->closedAt(),
            ],
        );

        $campaign->submissions()->delete();
        $campaign->evaluations()->sync(
            $form->evaluations->mapWithKeys(fn ($evaluation, $position) => [
                $evaluation->id => ['position' => $position],
            ])->all(),
        );

        return $campaign;
    }

    /**
     * Wellbeing baseline per person, from 0 (great) to 1 (burnt out), moved by
     * the campaign shift.
     *
     * @return list<float>
     */
    private function stressProfiles(): array
    {
        mt_srand(self::PROFILE_SEED);

        $profiles = [];

        foreach (self::EMPLOYEES as $employee) {
            $profiles[] = $this->clamp(mt_rand(5, 95) / 100 + $this->stressShift());
        }

        return $profiles;
    }

    /**
     * @param  array{0: string, 1: string, 2: string, 3: string, 4: int, 5: string, 6: int, 7: string}  $employee
     */
    private function createSubmission(Campaign $campaign, int $index, array $employee): Submission
    {
        [$firstName, $lastName, $role, $sex, $age, $maritalStatus, $children, $cohabitation] = $employee;

        return $campaign->submissions()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role_function' => $role,
            'age' => $age,
            'sex' => $sex,
            'marital_status' => $maritalStatus,
            'children_count' => $children,
            'cohabitation_group' => $cohabitation,
            'work_email' => $this->emailFor($firstName, $lastName),
            'phone' => sprintf('+54 9 11 %04d-%04d', 4100 + $index, 1000 + $index * 7),
            'authorizes_medical_access' => $index % 3 !== 0,
            'submitted_at' => $this->submittedAt($campaign, $index),
        ]);
    }

    private function emailFor(string $firstName, string $lastName): string
    {
        return Str::slug($firstName).'.'.Str::slug($lastName).'@'.self::EMAIL_DOMAIN;
    }

    /**
     * Spread the submissions across the real window of the campaign, in working
     * hours. A campaign still running is filled only up to today, so no answer
     * is dated in the future.
     */
    private function submittedAt(Campaign $campaign, int $index): CarbonImmutable
    {
        $start = CarbonImmutable::parse($campaign->starts_at)->startOfDay();
        $end = CarbonImmutable::parse($campaign->ends_at)->endOfDay()->min(CarbonImmutable::now());
        $days = max(1, (int) $start->diffInDays($end));

        return $start
            ->addDays($index % $days)
            ->addHours(8 + ($index % 9))
            ->addMinutes(($index * 13) % 60)
            ->min($end);
    }

    /**
     * Answer every question of the form for this person and insert them in one
     * go. Points are frozen on the row, exactly like the public form does.
     */
    private function storeAnswers(Submission $submission, Form $form, float $stress): void
    {
        $now = now();
        $rows = [];

        foreach ($form->evaluations as $evaluation) {
            /** @var array<int, string> $picked */
            $picked = [];

            foreach ($evaluation->questions as $question) {
                $base = [
                    'submission_id' => $submission->id,
                    'question_id' => $question->id,
                    'question_label' => $question->label,
                    'question_type' => $question->type->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($question->type->isScored()) {
                    $option = $this->pickOption($evaluation, $question, $stress);

                    if ($option === null) {
                        continue;
                    }

                    $picked[$question->position] = $option->label;

                    $rows[] = $base + [
                        'question_option_id' => $option->id,
                        'option_label' => $option->label,
                        'option_points' => $option->points,
                        'value_text' => null,
                    ];

                    continue;
                }

                $text = $this->textAnswer($evaluation, $question, $stress, $picked);

                if ($text === null) {
                    continue;
                }

                $rows[] = $base + [
                    'question_option_id' => null,
                    'option_label' => null,
                    'option_points' => null,
                    'value_text' => $text,
                ];
            }
        }

        DB::table('submission_answers')->insert($rows);
    }

    /**
     * Pick an option consistent with the person's wellbeing: on a scored
     * evaluation the direction of "worse" depends on `lower_is_better`, so a
     * stressed person accumulates points on the symptom evaluations and loses
     * them on the healthy habits one.
     */
    private function pickOption(Evaluation $evaluation, Question $question, float $stress): ?QuestionOption
    {
        $options = $question->options->sortBy('points')->values();

        if ($options->isEmpty()) {
            return null;
        }

        if (! $evaluation->isScored()) {
            return $this->pickClassifyingOption($options, $stress);
        }

        $towardWorst = $evaluation->lowerIsBetter() ? $stress : 1 - $stress;
        $score = $this->clamp($towardWorst + $this->noise(0.22));
        $index = min($options->count() - 1, (int) floor($score * $options->count()));

        return $options[$index];
    }

    /**
     * Evaluations that only classify (Sí / No / No sabe) carry no points, so the
     * option is picked by label with a low chance of "Sí" that grows with stress.
     *
     * @param  Collection<int, QuestionOption>  $options
     */
    private function pickClassifyingOption($options, float $stress): QuestionOption
    {
        $roll = mt_rand(0, 1000) / 1000;
        $label = match (true) {
            $roll < $stress * 0.4 => 'Sí',
            $roll < $stress * 0.4 + 0.06 => 'No sabe',
            default => 'No',
        };

        return $options->firstWhere('label', $label) ?? $options->last();
    }

    /**
     * Free-text answers. The work self-perception scores follow the wellbeing
     * profile, and the medication fields are only filled when the related
     * yes/no question of the same evaluation was answered "Sí".
     *
     * @param  array<int, string>  $picked
     */
    private function textAnswer(Evaluation $evaluation, Question $question, float $stress, array $picked): ?string
    {
        return match ($evaluation->slug) {
            'autopercepciones-del-trabajo' => (string) match ($question->position) {
                1 => $this->scaleValue(9.5 - $stress * 7),
                2 => $this->scaleValue(1.5 + $stress * 8),
                3 => $this->scaleValue(9 - $stress * 6),
                4 => $this->scaleValue(6 - $stress * 5, 0, 8),
                default => $this->scaleValue(5),
            },
            'sintomas-o-enfermedades' => match ($question->position) {
                9 => ($picked[8] ?? null) === 'Sí' ? $this->oneOf(['Ataques de pánico', 'Fobia social', 'Ansiedad generalizada']) : null,
                15 => ($picked[14] ?? null) === 'Sí' ? $this->oneOf(['Clonazepam', 'Alprazolam', 'Lorazepam']) : null,
                17 => ($picked[16] ?? null) === 'Sí' ? $this->oneOf(['Sertralina', 'Escitalopram', 'Fluoxetina']) : null,
                18 => $stress > 0.6 ? $this->oneOf(['Ibuprofeno ocasional', 'Losartán', 'Omeprazol', 'Levotiroxina']) : 'Ninguna',
                default => null,
            },
            default => null,
        };
    }

    /**
     * A 0-10 style answer with noise, kept inside the scale.
     */
    private function scaleValue(float $center, int $min = 0, int $max = 10): int
    {
        return (int) max($min, min($max, round($center + $this->noise(1.5))));
    }

    /**
     * @param  list<string>  $values
     */
    private function oneOf(array $values): string
    {
        return $values[mt_rand(0, count($values) - 1)];
    }

    private function noise(float $spread): float
    {
        return mt_rand(-1000, 1000) / 1000 * $spread;
    }

    private function clamp(float $value, float $min = 0.0, float $max = 1.0): float
    {
        return max($min, min($max, $value));
    }
}
