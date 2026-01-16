<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Project;

class DeveloperTaskController extends Controller
{

//provera da je dev uloga
    private function ensureDeveloper(Request $request)
    {
        if ($request->user()->role !== 'developer') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Developer može da pristupi ovim endpointima.'],
                ],
            ], 403);
        }

        return null;
    }

    //Pregled liste zadataka dodeljenih developeru
    
    public function index(Request $request)
    {
        if ($resp = $this->ensureDeveloper($request)) {
            return $resp;
        }

        $tasks = Task::query()
            ->where('assigned_to', $request->user()->id)
            ->with([
                'project.users',
                'tag',
                'creator',
                'assignee',
                'comments.user',
            ])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
        ]);
    }

    //Ažuriranje statusa zadatka (samo svog)
   
    public function updateStatus(Request $request, Task $task)
    {
        if ($resp = $this->ensureDeveloper($request)) {
            return $resp;
        }

        if ((int)$task->assigned_to !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu da menjate ovaj task.',
                'errors' => [
                    'authorization' => ['Možete menjati samo taskove koji su vama dodeljeni.'],
                ],
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['created', 'started', 'in_progress', 'done'])],
        ]);

        $task->update([
            'status' => $validated['status'],
        ]);

        $task->load([
            'project.users',
            'tag',
            'creator',
            'assignee',
            'comments.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
        ]);
    }

    public function storePersonal(Request $request, Project $project)
    {
        if ($resp = $this->ensureDeveloper($request)) {
            return $resp;
        }

        // developer mora biti član projekta (project_user)
        if (! $project->users()->where('users.id', $request->user()->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate pristup ovom projektu.',
                'errors' => [
                    'authorization' => ['Niste član projekta.'],
                ],
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'tag_id' => ['required', 'integer', 'exists:tags,id'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['created', 'started', 'in_progress', 'done'])],
        ]);

        $task = Task::create([
            'project_id' => $project->id,
            'tag_id' => $validated['tag_id'],

            'created_by' => $request->user()->id,
            'assigned_to' => $request->user()->id, // uvek sebi

            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,

            'status' => $validated['status'] ?? 'created',
            'priority' => $validated['priority'] ?? 'medium',
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $task->load([
            'project.users',
            'tag',
            'creator',
            'assignee',
            'comments.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
        ], 201);
    }
}
