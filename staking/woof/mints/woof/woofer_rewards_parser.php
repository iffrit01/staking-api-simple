<?php

// $wf = json_decode(file_get_contents('./woofer_rewards.json'), true);
$wf = json_decode(file_get_contents('./woofer_rewards_from_2023_02_01.json'), true);

// var_dump($wf[0]);

$f = 'woofer_rewards_parsed.json';

$parsed = [];

foreach ($wf as $w) {
    $parsed[$w['mint']] = $w['daily_reward'];
}



var_dump($parsed);

file_put_contents($f, json_encode($parsed, JSON_PRETTY_PRINT));

echo "\nDONE\n\n";
