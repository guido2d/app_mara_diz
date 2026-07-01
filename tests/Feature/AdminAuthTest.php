<?php

use App\Models\User;

it('logs in an admin with valid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);

    $this->post('/admin/login', ['email' => $user->email, 'password' => 'secret123'])
        ->assertRedirect('/admin/forms');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);

    $this->from('/admin/login')
        ->post('/admin/login', ['email' => $user->email, 'password' => 'wrong'])
        ->assertRedirect('/admin/login')
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('blocks guests from the admin area', function () {
    $this->get('/admin/forms')->assertRedirect('/admin/login');
});
