<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;


class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //admin
        User::updateOrCreate(
            ['email' => 'admin@devtasker.com'],
            [
                'name' => 'Admin',
                'role' => 'taskadmin',
                'password' => Hash::make('password'),
            ]
        );

        // Product owner (Andrea).
        User::updateOrCreate(
            ['email' => 'andrea@devtasker.com'],
            [
                'name' => 'Andrea',
                'role' => 'product_owner',
                'password' => Hash::make('password'),
            ]
        );

        // Developer .
        User::updateOrCreate(
            ['email' => 'jovana@devtasker.com'],
            [
                'name' => 'Jovana',
                'role' => 'developer',
                'password' => Hash::make('password'),
            ]
        );

         // Developer .
        User::updateOrCreate(
            ['email' => 'aleksandra@devtasker.com'],
            [
                'name' => 'Aleksandra',
                'role' => 'developer',
                'password' => Hash::make('password'),
            ]
        );

        // Random 5 korisnika.
        User::factory()
            ->count(5)
            ->create([
                'role' => 'developer',
            ]);
   
    }
}
