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
