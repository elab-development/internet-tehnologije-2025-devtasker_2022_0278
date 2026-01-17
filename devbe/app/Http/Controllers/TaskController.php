<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Http\Resources\UserResource;

class TaskController extends Controller
{
    private function ensureProductOwner(Request $request)
    {
        if ($request->user()->role !== 'product_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Product Owner može da pregleda taskove u projektu.'],
                ],
            ], 403);
        }
        return null;
    }

    private function ensureProjectMember(Request $request, Project $project)
    {
        if (!$project->users()->where('users.id', $request->user()->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate pristup ovom projektu.',
                'errors' => [
                    'authorization' => ['Niste član projekta.'],
                ],
            ], 403);
        }
        return null;
    }

    // vracanje taskova i neko filtriranje
    public function index(Request $request, Project $project)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        if ($resp = $this->ensureProjectMember($request, $project)) {
            return $resp;
        }

        //vracanje po proslednjenom projektu sve informacije
        $query = Task::query()
            ->where('project_id', $project->id)
            ->with([
                'project.users',
                'tag',
                'creator',
                'assignee',
                'comments.user',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }

        if ($request->filled('tag_id')) {
            $query->where('tag_id', (int) $request->input('tag_id'));
        }

        $tasks = $query->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
        ]);
    }

    //kreiranje novog taska programeru
    public function store(Request $request, Project $project)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        if ($resp = $this->ensureProjectMember($request, $project)) {
            return $resp;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'tag_id' => ['required', 'integer', 'exists:tags,id'],

            'status' => ['nullable', Rule::in(['created', 'started', 'in_progress', 'done'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],

            // ne sme null -> required
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
        ]);

        // mora biti developer
        $developer = User::findOrFail($validated['assigned_to']);
        if ($developer->role !== 'developer') {
            return response()->json([
                'success' => false,
                'message' => 'Neispravna dodela.',
                'errors' => [
                    'assigned_to' => ['Zadatak može biti dodeljen samo developeru.'],
                ],
            ], 422);
        }

        // mora biti član projekta (project_user pivot)
        if (! $project->users()->where('users.id', $developer->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Neispravna dodela.',
                'errors' => [
                    'assigned_to' => ['Developer nije član projekta.'],
                ],
            ], 422);
        }

        $task = Task::create([
            'project_id' => $project->id,
            'tag_id' => $validated['tag_id'],
            'created_by' => $request->user()->id,
            'assigned_to' => $developer->id,

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

   // azuriranje taska od developera
     public function update(Request $request, Task $task)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        $project = Project::findOrFail($task->project_id);

        if ($resp = $this->ensureProjectMember($request, $project)) {
            return $resp;
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'tag_id' => ['required', 'integer', 'exists:tags,id'],

            'status' => ['required', Rule::in(['created', 'started', 'in_progress', 'done'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],

            // ne sme null
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
        ]);

        // assigned_to mora biti developer i clan projekta
        $developer = User::findOrFail($validated['assigned_to']);

        if ($developer->role !== 'developer') {
            return response()->json([
                'success' => false,
                'message' => 'Neispravna dodela.',
                'errors' => [
                    'assigned_to' => ['Zadatak može biti dodeljen samo developeru.'],
                ],
            ], 422);
        }

        if (! $project->users()->where('users.id', $developer->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Neispravna dodela.',
                'errors' => [
                    'assigned_to' => ['Developer nije član projekta.'],
                ],
            ], 422);
        }

        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'tag_id' => $validated['tag_id'],

            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'] ?? null,

            'assigned_to' => $developer->id,
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

    //dev fje samo za njih

    
}
