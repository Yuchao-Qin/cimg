<?php
$upload_dir = "./imgs/";
$imgData = base64_decode($_POST["data"]);
$fileName = $_POST["fileName"];
$f = fopen($upload_dir.$fileName, "w");
fwrite($f, $imgData);
// header("HTTP/1.1 401 Unauthorized");
fclose($f);
?>