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
$all_ranks = [];
for ($i = 1; $i <= $total_items; $i++) {
    $all_ranks[] = $i;
}

$rarity_ranks = [];

$hashlist = json_decode(file_get_contents('./'.$dir.'/mints.json'), true);

$rarity = json_decode(file_get_contents('./'.$dir.'/moonrank_rarity_mongomons.json'), true);
$rarity = $rarity['mints'];
// var_dump($rarity[0]['mint']);die;
$parsed_mints_light = [];
$not_found = [];
$no_meta = [];

foreach ($hashlist as $h) {

    $found = false;
    
    foreach ($rarity as $m) {
        if ($h == $m['mint']) {
            $found = true;
            $parsed_mints_light[$h] = [
                'rank' => $m['rank']
            ];
            $rarity_ranks[] = $m['rank'];
        }
    }

    if (!$found) {
        $not_found[] = $h;
        $parsed_mints_light[$h] = [
            'rank' => 10000
        ];
    }

}

if (!empty($not_found)) {
    echo "\nNot found:\n";
    echo json_encode($not_found, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n";
}

$missing_ranks = array_diff($all_ranks, $rarity_ranks);


echo "Missing ranks:\n\n";
echo json_encode($missing_ranks, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n\n";

echo count($parsed_mints_light) . '|' . count($not_found) . "\n\n";

// sort by rank
// usort($parsed_mints_light, function ($item1, $item2) {
//     return $item1['rank'] <=> $item2['rank'];
// });

$y_light = json_encode($parsed_mints_light, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);

file_put_contents('./'.$dir.'/moonrank-parsed-light.json', $y_light);


echo "\n\nDONE!\n\n";

