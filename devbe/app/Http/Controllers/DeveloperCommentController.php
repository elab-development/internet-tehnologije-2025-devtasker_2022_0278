<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class DeveloperCommentController extends Controller
{

//provera uloge
    private function ensureDeveloper(Request $request)
    {
        if ($request->user()->role !== 'developer') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Developer može da upravlja komentarima na svojim taskovima.'],
                ],
            ], 403);
        }

        return null;
    }

    // Dodavanje komentara na zadatak (samo na svoje taskove)
    
    public function store(Request $request, Task $task)
    {
        if ($resp = $this->ensureDeveloper($request)) {
            return $resp;
        }

        if ((int) $task->assigned_to !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Možete komentarisati samo taskove koji su vama dodeljeni.'],
                ],
            ], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'min:1', 'max:1000'],
        ]);

        $comment = Comment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => new CommentResource($comment),
        ], 201);
    }

    // SK15: Brisanje komentara (samo svoj komentar na svom tasku)
  
    public function destroy(Request $request, Comment $comment)
    {
        if ($resp = $this->ensureDeveloper($request)) {
            return $resp;
        }

        // komentar mora biti njegov
        if ((int) $comment->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Možete obrisati samo svoje komentare.'],
                ],
            ], 403);
        }

        // i mora biti na tasku koji je njemu dodeljen
        $task = Task::findOrFail($comment->task_id);

        if ((int) $task->assigned_to !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Ne možete brisati komentare na taskovima koji nisu vama dodeljeni.'],
                ],
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'data' => null,
        ]);
    }
}
