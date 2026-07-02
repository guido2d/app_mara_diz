<?php

use App\Models\Campaign;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists all campaigns across every form', function () {
    Campaign::factory()->count(2)->create(); // cada una crea su propio Form

    $this->get('/admin/campaigns')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/campaigns/board')
            ->has('campaigns', 2)
            ->has('campaigns.0', fn ($c) => $c
                ->hasAll(['id', 'name', 'form_id', 'form_name', 'starts_at', 'ends_at', 'is_open', 'submissions_count'])
            )
        );
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/campaigns')->assertRedirect('/admin/login');
});
