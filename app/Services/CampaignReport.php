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
