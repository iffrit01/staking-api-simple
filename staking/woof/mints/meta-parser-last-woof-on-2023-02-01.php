<?php

// $dir = 'lawless';
// $dir = 'saudi';
// $dir = 'pizzapalz';
// $dir = 'diamond';
// $dir = 'cc';
// $dir = 'classee';
// $dir = 'skullclub';
// $dir = 'skullclub-gen1';
$dir = 'woof';// rewards file

$daily_yield = 2;
$seconds_per_day = 86400;
$yield_per_second = $daily_yield/$seconds_per_day;

$hashlist = json_decode(file_get_contents('./'.$dir.'/mints.json'), true);

$rewards = json_decode(file_get_contents('./'.$dir.'/woofer_rewards_parsed.json'), true);

$m1 = json_decode(file_get_contents('./'.$dir.'/gib-meta.json'), true);
// var_dump($m1[0]);die;
$parsed_mints_light = [];
$not_found = [];
$no_meta = [];

foreach ($hashlist as $h) {

    $found = false;
    
    foreach ($m1 as $m) {
        if ($h == $m['mint']) {
            $found = true;
            if (!isset($m['metadata'])) {
                echo "\nnot found "; $no_meta[] = $m['mint']; 
            } else if (!isset($rewards[$m['mint']])) {
                echo "\nno rewards " . $m['mint'];die; 
            } else {
                $parsed_mints_light[$h] = [
                    'image' => $m['metadata']['image'],
                    'name' => $m['metadata']['name'],
                    "daily_yield" => $rewards[$m['mint']],
                    "yield_per_second" => $rewards[$m['mint']]/$seconds_per_day
                ];
            }
        }
    }

    if (!$found) {
        $not_found[] = $h;
    }

}

if (!empty($no_meta)) {
    echo "\nNo meta:\n";
    echo json_encode($no_meta[0]) . "\n";
}

echo json_encode($not_found, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n\n";

echo count($parsed_mints_light) . '|' . count($not_found) . "\n\n";



$y_light = json_encode($parsed_mints_light, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);

file_put_contents('./'.$dir.'/mints-parsed-light.json', $y_light);


echo "\n\nDONE!\n\n";

