<?php
include('php/class.ApePush.php');

$Ape = new ApePubSub($_POST);
/*
$Ape->from = $_POST['from'];
$Ape->fromType = $_POST['fromType'];

$Ape->to = $_POST['to'];
$Ape->toType = $_POST['toType'];

$Ape->data = $_POST['data'];
*/
$res = $Ape->send();
echo json_encode($res);
