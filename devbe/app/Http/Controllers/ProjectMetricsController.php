<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectMetricsController extends Controller
{
    private function ensureProductOwner(Request $request)
    {
        if ($request->user()->role !== 'product_owner') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Samo Product Owner može da vidi metrike projekta.'],
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

    // fja za vracanje detaljnih metrika
    public function show(Request $request, Project $project)
    {
        if ($resp = $this->ensureProductOwner($request)) {
            return $resp;
        }

        if ($resp = $this->ensureProjectMember($request, $project)) {
            return $resp;
        }

        $today = now()->toDateString();
        $next7 = now()->addDays(7)->toDateString();

        // Cards (brojke) 
        $total = Task::where('project_id', $project->id)->count();
        $done = Task::where('project_id', $project->id)->where('status', 'done')->count();
        $open = Task::where('project_id', $project->id)->where('status', '!=', 'done')->count();

        $overdue = Task::where('project_id', $project->id)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->count();

        $dueSoon = Task::where('project_id', $project->id)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$today, $next7])
            ->count();

        //  Pie: status breakdown 
        $statusCounts = Task::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->where('project_id', $project->id)
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statusOrder = ['created', 'started', 'in_progress', 'done'];
        $statusPie = [];
        foreach ($statusOrder as $status) {
            $statusPie[] = [
                'key' => $status,
                'value' => (int) ($statusCounts[$status] ?? 0),
            ];
        }

        // Bar: priority breakdown 
        $priorityCounts = Task::query()
            ->select('priority', DB::raw('COUNT(*) as total'))
            ->where('project_id', $project->id)
            ->groupBy('priority')
            ->pluck('total', 'priority')
            ->toArray();

        $priorityOrder = ['low', 'medium', 'high'];
        $priorityBar = [];
        foreach ($priorityOrder as $p) {
            $priorityBar[] = [
                'key' => $p,
                'value' => (int) ($priorityCounts[$p] ?? 0),
            ];
        }

        // (koliko OPEN taskova po developeru
        $loadRaw = Task::query()
            ->select('assigned_to', DB::raw('COUNT(*) as total'))
            ->where('project_id', $project->id)
            ->where('status', '!=', 'done')
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderByDesc('total')
            ->get();

        $developerIds = $loadRaw->pluck('assigned_to')->unique()->values();
        $developers = User::whereIn('id', $developerIds)->get()->keyBy('id');

        $developerLoadBar = $loadRaw->map(function ($row) use ($developers) {
            $dev = $developers->get($row->assigned_to);
            return [
                'developer' => $dev ? new UserResource($dev) : null,
                'open_tasks' => (int) $row->total,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'project_id' => $project->id,

                // Cards
                'cards' => [
                    'total_tasks' => $total,
                    'open_tasks' => $open,
                    'done_tasks' => $done,
                    'overdue' => $overdue,
                    'due_soon_7d' => $dueSoon,
                ],

                // Charts
                'charts' => [
                    'status_pie' => $statusPie,       // pie chart
                    'priority_bar' => $priorityBar,   // bar chart
                    'developer_load' => $developerLoadBar, // bar/list chart
                ],
            ],
        ]);
    }
}
