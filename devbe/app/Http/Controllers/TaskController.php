<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

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
}
