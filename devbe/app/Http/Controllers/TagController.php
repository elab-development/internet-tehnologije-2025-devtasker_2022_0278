<?php

namespace App\Http\Controllers;

use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TagController extends Controller
{
    //fja za proveru da li je korisnik admin
    private function checkAdmin(Request $request)
    {
        if ($request->user()->role !== 'taskadmin') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Task Admin može da upravlja tagovima.'],
                ],
            ], 403);
        }

        return null;
    }

    // Pregled liste tagova (samo admin).
    public function index(Request $request)
    {
        if ($resp = $this->checkAdmin($request)) {
            return $resp;
        }

        $tags = Tag::query()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => TagResource::collection($tags),
        ]);
    }

    //  Dodavanje novog taga (samo admin).
    public function store(Request $request)
    {
        if ($resp = $this->checkAdmin($request)) {
            return $resp;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:50', Rule::unique('tags', 'name')],
        ]);

        $tag = Tag::create(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'data' => new TagResource($tag),
        ], 201);
    }

    // Izmena taga (samo admin).
    public function update(Request $request, Tag $tag)
    {
        if ($resp = $this->checkAdmin($request)) {
            return $resp;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:50', Rule::unique('tags', 'name')->ignore($tag->id)],
        ]);

        $tag->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'data' => new TagResource($tag),
        ]);
    }

    //  Brisanje taga (samo admin).
    public function destroy(Request $request, Tag $tag)
    {
        if ($resp = $this->checkAdmin($request)) {
            return $resp;
        }

        $tag->delete();

        return response()->json([
            'success' => true,
            'data' => null,
        ]);
    }

    //treba nam za frontend da po vidi sve tagove
    public function lookup(Request $request)
    {
      
        $tags = Tag::query()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => TagResource::collection($tags),
        ]);
    }
}
