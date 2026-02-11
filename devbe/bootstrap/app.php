<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
   ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class); //da koristimo cors
    })
    ->withExceptions(function (Exceptions $exceptions): void {
         $exceptions->render(function (\Throwable $e, $request) {

        // Ako nije API/JSON zahtev, pusti Laravel default prikaz.
        if (! $request->expectsJson() && ! $request->is('api/*')) {
            return null;
        }

        // 422 - validacija.
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validacija nije prošla.',
                'errors' => $e->errors(),
            ], 422);
        }

        // 401 - nije ulogovan.
        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Niste autorizovani. Potrebna je prijava.',
                'errors' => [
                    'auth' => ['Niste ulogovani ili je token istekao.'],
                ],
            ], 401);
        }

        // 403 - nema prava.
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => [
                    'authorization' => ['Zabranjen pristup.'],
                ],
            ], 403);
        }

        // 404 - model nije pronađen.
        if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Traženi resurs nije pronađen.',
                'errors' => [
                    'not_found' => ['Resurs ne postoji ili je obrisan.'],
                ],
            ], 404);
        }

        // 404 - ruta nije pronađena.
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Ruta nije pronađena.',
                'errors' => [
                    'route' => ['Nepostojeći endpoint.'],
                ],
            ], 404);
        }

        // 405 - metoda nije dozvoljena.
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'HTTP metoda nije dozvoljena za ovaj endpoint.',
                'errors' => [
                    'method' => ['Proverite da li koristite GET/POST/PUT/DELETE ispravno.'],
                ],
            ], 405);
        }

        // SQL greške (ne otkrivamo detalje).
        if ($e instanceof \Illuminate\Database\QueryException) {
            return response()->json([
                'success' => false,
                'message' => 'Greška baze podataka.',
                'errors' => [
                    'database' => ['Došlo je do greške pri radu sa bazom.'],
                ],
            ], 500);
        }

        // Ostale HTTP greške.
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
            return response()->json([
                'success' => false,
                'message' => 'Greška u zahtevu.',
                'errors' => [
                    'http' => [$e->getMessage() ?: 'Došlo je do HTTP greške.'],
                ],
            ], $e->getStatusCode());
        }

        // Fallback 500.
        return response()->json([
            'success' => false,
            'message' => 'Neočekivana greška na serveru.',
            'errors' => [
                'server' => [config('app.debug') ? $e->getMessage() : 'Pokušajte ponovo kasnije.'],
            ],
        ], 500);
    });
    })->create();
