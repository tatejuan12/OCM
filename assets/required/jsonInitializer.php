<?php
$everythingJson = file_get_contents('json/everything.json');
echo '<script>const everythingJson=' . $everythingJson . ' </script>';

$exploreJson = file_get_contents('json/exploreEndPoint.json');
echo '<script>const exploreJson=' . $exploreJson . ' </script>';
