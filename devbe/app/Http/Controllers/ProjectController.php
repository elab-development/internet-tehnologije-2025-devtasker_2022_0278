<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{

//provera uloge korisnika
    private function ensureProductOwner(Request $request)
    {
        if ($request->user()->role !== 'product_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Product Owner može da kreira projekat.'],
                ],
            ], 403);
        }
        return null;
    }

    // kreiranje novog projekta
    public function store(Request $request)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $project = Project::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
        ]);

        // PO (ulogovani) mora biti član projekta
        $project->users()->sync([$request->user()->id]);

        return response()->json([
            'success' => true,
            'data' => new ProjectResource($project),
        ], 201);
    }


    //vracanje projekata
    public function index(Request $request)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        // PO vidi svoje projekte (one gde je član u pivot tabeli project_user)
        $projects = Project::query()
            ->whereHas('users', function ($q) use ($request) {
                $q->where('users.id', $request->user()->id);
            })
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectResource::collection($projects),
        ]);
    }

    //vracanje developera na tom projektu
    public function developers(Request $request, Project $project)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        // PO mora biti član projekta (isto pravilo kao taskovi)
        if (! $project->users()->where('users.id', $request->user()->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate pristup ovom projektu.',
                'errors' => [
                    'authorization' => ['Niste član ovog projekta.'],
                ],
            ], 403);
        }

        // samo developeri koji su članovi projekta
        $developers = $project->users()
            ->where('role', 'developer')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($developers),
        ]);
    }
}
