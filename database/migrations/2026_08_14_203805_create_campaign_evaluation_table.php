<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_evaluation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['campaign_id', 'evaluation_id']);
        });

        $this->backfillFromForms();
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_evaluation');
    }

    /**
     * Campaigns used to inherit every evaluation of their form. Copy that set so
     * existing rounds keep showing and scoring exactly the same evaluations.
     */
    private function backfillFromForms(): void
    {
        $now = now();

        DB::table('campaigns')
            ->orderBy('id')
            ->chunkById(200, function ($campaigns) use ($now) {
                $rows = [];

                foreach ($campaigns as $campaign) {
                    $evaluations = DB::table('evaluation_form')
                        ->where('form_id', $campaign->form_id)
                        ->orderBy('position')
                        ->get();

                    foreach ($evaluations as $evaluation) {
                        $rows[] = [
                            'campaign_id' => $campaign->id,
                            'evaluation_id' => $evaluation->evaluation_id,
                            'position' => $evaluation->position,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if ($rows !== []) {
                    DB::table('campaign_evaluation')->insert($rows);
                }
            });
    }
};
