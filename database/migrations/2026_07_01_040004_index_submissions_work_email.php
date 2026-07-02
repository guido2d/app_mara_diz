<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize pre-existing emails so they group the same way new (normalized) ones do.
        DB::table('submissions')->orderBy('id')->chunkById(200, function ($submissions) {
            foreach ($submissions as $submission) {
                $normalized = mb_strtolower(trim($submission->work_email));
                if ($normalized !== $submission->work_email) {
                    DB::table('submissions')->where('id', $submission->id)->update(['work_email' => $normalized]);
                }
            }
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->index('work_email');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex(['work_email']);
        });
    }
};
