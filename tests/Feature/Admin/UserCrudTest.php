<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->actingAs($this->admin);
});

it('lists the users', function () {
    User::factory()->count(2)->create();

    $this->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/users/index')->has('users', 3));
});

it('creates a user with a hashed password', function () {
    $this->post('/admin/users', [
        'name' => 'Nueva Persona',
        'email' => 'nueva@example.com',
        'password' => 'secret123',
    ])->assertRedirect(route('admin.users.index'));

    $user = User::firstWhere('email', 'nueva@example.com');
    expect($user)->not->toBeNull()
        ->and(Hash::check('secret123', $user->password))->toBeTrue();
});

it('rejects a duplicate email on create', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->from('/admin/users/create')
        ->post('/admin/users', [
            'name' => 'X',
            'email' => 'taken@example.com',
            'password' => 'secret123',
        ])
        ->assertRedirect('/admin/users/create')
        ->assertSessionHasErrors('email');
});

it('updates a user without touching the password when left blank', function () {
    $user = User::factory()->create(['password' => Hash::make('original123')]);

    $this->put("/admin/users/{$user->id}", [
        'name' => 'Editado',
        'email' => $user->email,
        'password' => '',
    ])->assertRedirect(route('admin.users.index'));

    $user->refresh();
    expect($user->name)->toBe('Editado')
        ->and(Hash::check('original123', $user->password))->toBeTrue();
});

it('updates the password when a new one is provided', function () {
    $user = User::factory()->create(['password' => Hash::make('original123')]);

    $this->put("/admin/users/{$user->id}", [
        'name' => $user->name,
        'email' => $user->email,
        'password' => 'brandnew123',
    ])->assertRedirect();

    expect(Hash::check('brandnew123', $user->refresh()->password))->toBeTrue();
});

it('lets a user keep their own email on update', function () {
    $this->put("/admin/users/{$this->admin->id}", [
        'name' => 'Yo Mismo',
        'email' => $this->admin->email,
        'password' => '',
    ])
        ->assertRedirect(route('admin.users.index'))
        ->assertSessionHasNoErrors();
});

it('prevents deleting your own account', function () {
    $this->from('/admin/users')
        ->delete("/admin/users/{$this->admin->id}")
        ->assertRedirect('/admin/users')
        ->assertSessionHasErrors('user');

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('deletes another user', function () {
    $other = User::factory()->create();

    $this->delete("/admin/users/{$other->id}")->assertRedirect(route('admin.users.index'));

    expect(User::find($other->id))->toBeNull();
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/users')->assertRedirect('/admin/login');
});
