<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\Comment;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            'Preuzimam task, krećem danas.',
            'Ok, napravio sam plan i radim implementaciju.',
            'Završavam uskoro, javljam kad bude spremno za review.',
            'Imam jedno pitanje oko očekivanog ponašanja, javljam detalje.',
            'Dodao sam izmene i proverio/la edge case-ove.',
        ];

        $tasks = Task::query()->get();

        //na svakom tasku da imamo po jedan komentar od tog developera
        foreach ($tasks as $task) {
            if (!$task->assigned_to) {
                continue;
            }

            Comment::updateOrCreate(
                [
                    'task_id' => $task->id,
                    'user_id' => $task->assigned_to, // komentar piše developer koji radi na tasku.
                ],
                [
                    'content' => $messages[array_rand($messages)],
                ]
            );
        }
    }
}
