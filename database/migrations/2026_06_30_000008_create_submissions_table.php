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
