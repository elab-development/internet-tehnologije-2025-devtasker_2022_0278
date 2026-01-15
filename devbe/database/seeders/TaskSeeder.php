<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\Task;
use App\Models\Tag;
use App\Models\User;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $andrea = User::where('email', 'andrea@devtasker.com')->firstOrFail();

        $tags = Tag::all();
        if ($tags->isEmpty()) {
            return;
        }

        // taskovi da imamo za svaki projekat
        $taskBlueprints = [
            'Reporting Dashboard' => [
                ['title' => 'Define KPI metrics', 'description' => 'Definisati KPI-je i logiku filtriranja.', 'tag' => 'Feature',  'status' => 'created',     'priority' => 'high'],
                ['title' => 'Build charts component', 'description' => 'Napraviti reusable chart komponente.', 'tag' => 'Frontend', 'status' => 'in_progress', 'priority' => 'medium'],
                ['title' => 'Optimize queries for reporting', 'description' => 'Optimizovati upite i indeksiranje.', 'tag' => 'Backend', 'status' => 'created',   'priority' => 'high'],
                ['title' => 'Add export to CSV', 'description' => 'Dodati eksport izveštaja u CSV format.', 'tag' => 'Feature',  'status' => 'started',     'priority' => 'medium'],
                ['title' => 'Reporting smoke tests', 'description' => 'Dodati osnovne testove za ključne tokove.', 'tag' => 'Testing', 'status' => 'created',   'priority' => 'low'],
            ],
            'DMS Solution' => [
                ['title' => 'Upload document flow', 'description' => 'Implementirati upload i validacije fajlova.', 'tag' => 'Backend', 'status' => 'created',     'priority' => 'high'],
                ['title' => 'Document list UI', 'description' => 'Prikaz liste dokumenata sa pretragom.', 'tag' => 'Frontend', 'status' => 'created',        'priority' => 'medium'],
                ['title' => 'Integrate storage provider', 'description' => 'Povezati storage (lokalno ili S3-like).', 'tag' => 'DevOps', 'status' => 'in_progress','priority' => 'high'],
                ['title' => 'Permissions and roles for docs', 'description' => 'Prava pristupa dokumentima po ulozi.', 'tag' => 'Feature', 'status' => 'started',   'priority' => 'high'],
                ['title' => 'Fix upload edge cases', 'description' => 'Sanirati edge case-ove za velike fajlove.', 'tag' => 'Bug', 'status' => 'created',       'priority' => 'medium'],
            ],
            'Finance Dashboard' => [
                ['title' => 'Create finance data model', 'description' => 'Definisati strukturu podataka i agregacije.', 'tag' => 'Backend', 'status' => 'created',     'priority' => 'high'],
                ['title' => 'Transactions table UI', 'description' => 'Tabela transakcija sa sort/filter/paging.', 'tag' => 'Frontend', 'status' => 'in_progress',  'priority' => 'medium'],
                ['title' => 'Monthly trend calculation', 'description' => 'Izračunavanje trendova po mesecima.', 'tag' => 'Feature', 'status' => 'started',       'priority' => 'high'],
                ['title' => 'Add caching for totals', 'description' => 'Keširanje ukupnih suma radi performansi.', 'tag' => 'Backend', 'status' => 'created',      'priority' => 'medium'],
                ['title' => 'Finance regression tests', 'description' => 'Testovi za izračunavanja i prikaz.', 'tag' => 'Testing', 'status' => 'created',        'priority' => 'low'],
            ],
            'AI Pilot Project' => [
                ['title' => 'Define pilot scope', 'description' => 'Definisati scope, metrikе i očekivanja.', 'tag' => 'Feature', 'status' => 'created',      'priority' => 'high'],
                ['title' => 'Create prompt templates', 'description' => 'Napraviti osnovne prompt šablone.', 'tag' => 'Backend', 'status' => 'created',     'priority' => 'medium'],
                ['title' => 'AI results review UI', 'description' => 'UI za pregled i ocenjivanje rezultata.', 'tag' => 'Frontend', 'status' => 'in_progress','priority' => 'medium'],
                ['title' => 'Pilot logging and monitoring', 'description' => 'Logovi i monitoring za pilot.', 'tag' => 'DevOps', 'status' => 'started',      'priority' => 'medium'],
                ['title' => 'Fix hallucination cases', 'description' => 'Uočene greške i korekcije ponašanja.', 'tag' => 'Bug', 'status' => 'created',        'priority' => 'high'],
            ],
        ];

        foreach ($taskBlueprints as $projectTitle => $tasks) {
            $project = Project::where('title', $projectTitle)->first();
            if (!$project) {
                continue;
            }

            $devs = $project->users()->where('role', 'developer')->get();
            if ($devs->isEmpty()) {
                continue;
            }

            $i = 0;

            //dodeljujemo svakom tasku atribute
            foreach ($tasks as $t) {
                $assignee = $devs[$i % $devs->count()];
                $tag = $tags->firstWhere('name', $t['tag']) ?? $tags->random();

                $due = now()->addDays(7 + ($i * 3))->toDateString();

                Task::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'title' => $t['title'],
                    ],
                    [
                        'tag_id' => $tag->id,
                        'created_by' => $andrea->id,
                        'assigned_to' => $assignee->id,
                        'description' => $t['description'],
                        'status' => $t['status'],
                        'priority' => $t['priority'],
                        'due_date' => $due,
                    ]
                );

                $i++;
            }
        }
    }
}
