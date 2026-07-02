<?php

test('root redirects to admin forms', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect('/admin/forms');
});
