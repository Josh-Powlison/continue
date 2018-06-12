<?php
###PHP 7 required (and recommended, because it's MUST faster)###

#Uncomment the below to show errors
//*
error_reporting(E_ALL);
ini_set('display_errors',1);
//*/

#We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
ob_start();

#######################################
###############SETTINGS################
#######################################

#Money values are based on the base currency you use. For example, if you use US Dollars, cents would be what money value's based on (so 1=1 cent, 99=99 cents, 100=1 dollar)

#Currency:points ratio. Passed to JS; the only place where the ratio is stored
$response=[
	'call'			=>	$_POST['call']
	,'ratio'		=>	'5:1'			#Currency:points ratio
	,'currency'		=>	'USD'			#Currency you'll be RECEIVING payments in
	,'totalPoints'	=>	100				#Current number of points in DB
	,'feeCalc'		=>	'-2.9%-30'		#The fees, in percentage and amounts
	,'testing'		=>	true
	,'message'		=>	null
	,'success'		=>	false
];

#We consider money passed to make the payment; WE DON'T CALCULATE PAYMENT OFF POINTS, but points off money (in case there's a mistake; we don't EVER want to mischarge the user)

#Get form info
if($response['call']==='get'){
	$response['success']=true;
#Payment
}else if($response['call']==='submit'){
	if(!empty($_POST['cardNumber'])){
		$response['success']=true;
		echo 'I got your credit card number!';
	}
}else{
	echo 'No call type passed!';
}

$response['message']=ob_get_clean();
echo json_encode($response);

?>