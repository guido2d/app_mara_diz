<?php

use App\Services\RangeCoverageValidator;

beforeEach(function () {
    $this->validator = new RangeCoverageValidator;
});

it('accepts contiguous ranges covering 0..max', function () {
    $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 3],
        ['min_points' => 4, 'max_points' => 8],
    ]);
})->throwsNoExceptions();

it('rejects ranges that do not start at zero', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 1, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'debe empezar en 0');
});

it('rejects ranges that do not end at the max', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 5],
    ]))->toThrow(InvalidArgumentException::class, 'debe terminar en 8');
});

it('rejects a gap between ranges', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 3],
        ['min_points' => 5, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'hueco');
});

it('rejects an overlap between ranges', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 4],
        ['min_points' => 4, 'max_points' => 8],
    ]))->toThrow(InvalidArgumentException::class, 'solap');
});

it('rejects a range whose min exceeds its max', function () {
    expect(fn () => $this->validator->validate(8, [
        ['min_points' => 0, 'max_points' => 8],
        ['min_points' => 6, 'max_points' => 5],
    ]))->toThrow(InvalidArgumentException::class);
});
