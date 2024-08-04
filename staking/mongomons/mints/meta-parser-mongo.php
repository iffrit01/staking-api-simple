<?php

// $dir = 'lawless';
// $dir = 'saudi';
// $dir = 'pizzapalz';
// $dir = 'diamond';
// $dir = 'cc';
// $dir = 'classee';
// $dir = 'skullclub';
// $dir = 'cheddar';
$dir = 'mongo';

$total_items = 10000;
// $daily_yield = 2;
$seconds_per_day = 86400;
// $yield_per_second = $daily_yield/$seconds_per_day;

$rarity = json_decode(file_get_contents('./'.$dir.'/moonrank_rarity_mongomons.json'), true);
$rarity = $rarity['mints'];
// var_dump($rarity['mints'][0]);die;
$hashlist = json_decode(file_get_contents('./'.$dir.'/mints.json'), true);

$m1 = json_decode(file_get_contents('./'.$dir.'/gib-meta.json'), true);
// var_dump($m1[0]);die;

$moonrank = json_decode(file_get_contents('./'.$dir.'/moonrank-parsed-light.json'), true);


$parsed_mints_light = [];
$not_found = [];
$no_meta = [];
$overlapping_traits = [];

foreach ($hashlist as $h) {

    $found = false;
    
    foreach ($m1 as $m) {
        if ($h == $m['mint']) {
            $found = true;
            if (!isset($m['metadata'])) {
                echo "\nnot found "; $no_meta[] = $m['mint']; 
            } else {
                $rank = $moonrank[$h]['rank'];
                $daily_yield = ($total_items - $rank) * 0.0001  +  1;
                $yield_per_second = 0;
                $trait = 'rarity';
                $parsed_mints_light[$h] = [
                    'image' => $m['metadata']['image'],
                    'name' => $m['metadata']['name'],
                    'rank' => $rank,
                    // 'daily_yield' => 0,
                    // 'yield_per_second' => 0,
                    'attributes' => $m['metadata']['attributes']
                ];
                $appearing = 0;// counting overlapping traits
                // var_dump($m['metadata']['attributes']);die;
                // Pikachu earn 3
                // Sonic earn 4
                // Blind earn 5
                // Mongucci shirt 6
                // Pixel glasses 6
                // Legendary 7
                foreach ($m['metadata']['attributes'] as $a) {
                    if ($a['trait_type'] == 'Legendary'){
                        $appearing++;
                        if ($daily_yield < 7) {
                            $daily_yield = 7;
                            $trait = 'Legendary';
                        }
                    }
                    if ($a['value'] == 'Pixel Glasses'){
                        $appearing++;
                        if ($daily_yield < 6) {
                            $daily_yield = 6;
                            $trait = 'Pixel Glasses';
                        }
                    }
                    if ($a['value'] == 'Mongucci Shirt'){
                        $appearing++;
                        if ($daily_yield < 6) {
                            $daily_yield = 6;
                            $trait = 'Mongucci Shirt';
                        }
                    }
                    if ($a['value'] == 'Blind'){
                        $appearing++;
                        if ($daily_yield < 5) {
                            $daily_yield = 5;
                            $trait = 'Blind';
                        }
                    }
                    if ($a['value'] == 'Sonic'){
                        $appearing++;
                        if ($daily_yield < 4) {
                            $daily_yield = 4;
                            $trait = 'Sonic';
                        }
                    }
                    if ($a['value'] == 'Pikachu'){
                        $appearing++;
                        if ($daily_yield < 3) {
                            $daily_yield = 3;
                            $trait = 'Pikachu';
                        }
                    }
                }
                if ($appearing > 1) {
                    $overlapping_traits[] = $h;
                }
                $parsed_mints_light[$h]['yielding_trait'] = $trait;
                $parsed_mints_light[$h]['daily_yield'] = $daily_yield;
                $parsed_mints_light[$h]['yield_per_second'] = $daily_yield/$seconds_per_day;
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

if (!empty($overlapping_traits)) {
    echo "\nOverlapping Traits:\n";
    echo json_encode($overlapping_traits, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n\n";
}

echo json_encode($not_found, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n\n";

echo count($parsed_mints_light) . '|' . count($not_found) . "\n\n";



$y_light = json_encode($parsed_mints_light, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);

file_put_contents('./'.$dir.'/mints-parsed-light.json', $y_light);


echo "\n\nDONE!\n\n";

