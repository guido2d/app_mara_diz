<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submission_results', function (Blueprint $table) {
            $table->dropConstrainedForeignId('score_range_id');
            $table->dropColumn('result_text');
        });
    }

    public function down(): void
    {
        Schema::table('submission_results', function (Blueprint $table) {
            $table->foreignId('score_range_id')->nullable()->after('total_points');
            $table->text('result_text')->default('')->after('score_range_id');
        });
    }
};
