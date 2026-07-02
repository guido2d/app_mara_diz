<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submission_answers', function (Blueprint $table) {
            $table->string('question_label')->nullable()->after('question_id');
            $table->string('question_type')->nullable()->after('question_label');
            $table->string('option_label')->nullable()->after('question_option_id');
            $table->integer('option_points')->nullable()->after('option_label');
        });

        // Backfill snapshot text/points for pre-existing answers from their live question/option.
        DB::table('submission_answers')->orderBy('id')->chunkById(200, function ($answers) {
            foreach ($answers as $answer) {
                $question = DB::table('questions')->find($answer->question_id);
                $option = $answer->question_option_id
                    ? DB::table('question_options')->find($answer->question_option_id)
                    : null;

                DB::table('submission_answers')->where('id', $answer->id)->update([
                    'question_label' => $question?->label,
                    'question_type' => $question?->type,
                    'option_label' => $option?->label,
                    'option_points' => $option?->points,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('submission_answers', function (Blueprint $table) {
            $table->dropColumn(['question_label', 'question_type', 'option_label', 'option_points']);
        });
    }
};
