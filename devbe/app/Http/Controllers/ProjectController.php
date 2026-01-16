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
}
