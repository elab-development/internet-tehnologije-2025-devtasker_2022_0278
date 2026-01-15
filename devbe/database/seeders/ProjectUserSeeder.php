<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\User;

class ProjectUserSeeder extends Seeder
{
    public function run(): void
    {
        $andrea = User::where('email', 'andrea@devtasker.com')->firstOrFail();
        $jovana = User::where('email', 'jovana@devtasker.com')->firstOrFail();
        $aleksandra = User::where('email', 'aleksandra@devtasker.com')->firstOrFail();

        $otherDevs = User::where('role', 'developer')
            ->whereNotIn('id', [$jovana->id, $aleksandra->id])
            ->get();

        // Jednostavna logika
        // - Jovana je na 2 projekta: Reporting + Finance
        // - Aleksandra je na 2 projekta: DMS + AI
        // - Svaki projekat ukupno ima 3-4 developera (ovde random 3 ili 4)
        $plan = [
            'Reporting Dashboard' => $jovana,
            'DMS Solution' => $aleksandra,
            'Finance Dashboard' => $jovana,
            'AI Pilot Project' => $aleksandra,
        ];

        foreach ($plan as $projectTitle => $fixedDev) {
            $project = Project::where('title', $projectTitle)->firstOrFail();

            $devCount = random_int(3, 4); // 3-4 developera po projektu
            $neededFromPool = max(0, $devCount - 1);

            $picked = $otherDevs->shuffle()->take(min($neededFromPool, $otherDevs->count()));

            $developerIds = collect([$fixedDev->id])
                ->merge($picked->pluck('id'))
                ->unique()
                ->values();

            // Andrea je na sva 4 projekta kao PO
            $memberIds = $developerIds
                ->push($andrea->id)
                ->unique()
                ->values()
                ->all();

            // Sync da se svaki put dobije čista, ista struktura članova po projektu.
            $project->users()->sync($memberIds);
        }
    }
}
