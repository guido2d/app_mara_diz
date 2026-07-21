<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->boolean('allows_row_marks')->default(false)->after('is_scored');
        });

        DB::table('evaluations')
            ->whereIn('slug', [
                'senales-de-estres',
                'sintomas-fisicos',
                'conductas-habitos-saludables',
                'autopercepciones-del-trabajo',
            ])
            ->update(['allows_row_marks' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn('allows_row_marks');
        });
    }
};
