<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMetricsController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DeveloperTaskController;
use App\Http\Controllers\DeveloperCommentController;
use App\Http\Controllers\TagController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    //po rute
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::get('/projects/{project}/metrics', [ProjectMetricsController::class, 'show']);

    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);

    //dev rute
    Route::get('/my-tasks', [DeveloperTaskController::class, 'index']);
    Route::put('/my-tasks/{task}/status', [DeveloperTaskController::class, 'updateStatus']);
    Route::post('/projects/{project}/my-tasks', [DeveloperTaskController::class, 'storePersonal']);

    Route::post('/my-tasks/{task}/comments', [DeveloperCommentController::class, 'store']);
    Route::delete('/my-comments/{comment}', [DeveloperCommentController::class, 'destroy']);

    //admin rute
    Route::get('/tags', [TagController::class, 'index']);
    Route::post('/tags', [TagController::class, 'store']);
    Route::put('/tags/{tag}', [TagController::class, 'update']);
    Route::delete('/tags/{tag}', [TagController::class, 'destroy']);




});