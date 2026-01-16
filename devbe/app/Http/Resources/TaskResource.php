<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Task */
class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'title' => (string) $this->title,
            'description' => $this->description,

            'status' => (string) $this->status,
            'priority' => (string) $this->priority,
            'due_date' => $this->due_date,

            'project' => new ProjectResource($this->whenLoaded('project')),
            'tag' => new TagResource($this->whenLoaded('tag')),

            'created_by' => new UserResource($this->whenLoaded('creator')),
            'assigned_to' => new UserResource($this->whenLoaded('assignee')),

            'comments' => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
