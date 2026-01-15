<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Project;


class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //neki random projekti
         $projects = [
            [
                'title' => 'Reporting Dashboard',
                'description' => 'Dashboard za reporting i KPI metrike.',
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(60),
            ],
            [
                'title' => 'DMS Solution',
                'description' => 'Rešenje za dokument menadžment (DMS) i integracije.',
                'start_date' => now()->subDays(10),
                'end_date' => now()->addDays(90),
            ],
            [
                'title' => 'Finance Dashboard',
                'description' => 'Finansijski dashboard (prihodi, troškovi, trendovi).',
                'start_date' => now()->subDays(5),
                'end_date' => now()->addDays(75),
            ],
            [
                'title' => 'AI Pilot Project',
                'description' => 'Pilot projekat za AI funkcionalnosti i evaluaciju.',
                'start_date' => now()->subDays(3),
                'end_date' => now()->addDays(45),
            ],
        ];

        foreach ($projects as $data) {
            Project::updateOrCreate(
                ['title' => $data['title']],
                $data
            );
        }
    }
}
