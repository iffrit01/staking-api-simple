<?php

$dir = 'mongo';



$hashlist = json_decode(file_get_contents('./'.$dir.'/mints-parsed-light-copy.json'), true);

$m1 = json_decode(file_get_contents('./'.$dir.'/nft-metadata-1709814007772.json'), true);
// var_dump($m1[0]);die;
$parsed_mints_light = [];
$not_found = [];
$no_meta = [];

foreach ($hashlist as $h => $meta) {

    $found = false;
    
    foreach ($m1 as $m) {
        if ($h == $m['mint']) {
            $found = true;
            if (!isset($m['metadata'])) {
                echo "\nnot found "; $no_meta[] = $m['mint']; 
            } else {
                $parsed_mints_light[$h] = $meta;
                $parsed_mints_light[$h]['image'] = 'https://img-cdn.magiceden.dev/rs:fill:400:0:0/plain/' . $m['metadata']['image'];
            }
        }
    }

    if (!$found) {
        $not_found[] = $h;
        // assign the old value
        // $parsed_mints_light[$h] = $meta;
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

