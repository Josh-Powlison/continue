<?php
###PHP 7 required (and recommended, because it's MUST faster)###

#Uncomment the below to show errors
//*
error_reporting(E_ALL);
ini_set('display_errors',1);
//*/

#We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
ob_start();

##########################################
######### FILL OUT THE FOLLOWING #########
##########################################

### MySQL Info ###
$host='localhost';			#Can probably stick with this
$database='database';		#The database your podcast's table is in
$username='user';			#The MySQL user name (not your hosting account name)
$password='password';		#The MySQL user password

### Technical ###
date_default_timezone_set('UTC');	#Use the timezone you're basing your MySQL table off (http://php.net/manual/en/timezones.php)
$language='en-us';

##########################################
################ SETTINGS ################
##########################################

#Money values are based on the base currency you use. For example, if you use US Dollars, cents would be what money value's based on (so 1=1 cent, 99=99 cents, 100=1 dollar)

#Currency:points ratio. Passed to JS; the only place where the ratio is stored
$response=[
	'call'			=>	$_POST['call']
	,'ratio'		=>	'5:1'			#Currency:points ratio
	,'currency'		=>	'USD'			#Currency you'll be RECEIVING payments in
	,'feeCalc'		=>	'-2.9%-30'		#The fees, in percentage and amounts
	,'testing'		=>	true
	,'message'		=>	null
	,'success'		=>	false
];

##########################################
################## CODE ##################
##########################################

#Can set to 1 for testing, but set back to 0 before it goes live!
error_reporting(1);

#Get database
$db=new PDO(
	'mysql:host='.$host.';
	dbname='.$database.';
	charset=utf8',
	$username,
	$password,
	[PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

#We consider money passed to make the payment; WE DON'T CALCULATE PAYMENT OFF POINTS, but points off money (in case there's a mistake; we don't EVER want to mischarge the user)

#Get form info
if($response['call']==='get'){
	#Get the total point count
	$data=$db->prepare(
		'SELECT
			SUM(points) AS total_points
		FROM points'
	);
	
	if($data->execute()) $response['totalPoints']=$data->fetch()['total_points'];
	
	#Get each user's point count
	$data=$db->prepare(
		'SELECT
			SUM(points) AS points
			,user
		FROM points
		GROUP BY user
		ORDER BY points DESC'
	);
	
	if($data->execute()) $response['users']=$data->fetchAll();
	
	#Get each individual purchase
	$data=$db->prepare(
		'SELECT
			points
			,user
			,UNIX_TIMESTAMP(date)*1000 AS timestamp
			,comment
		FROM points
		ORDER BY date DESC'
	);
	
	if($data->execute()) $response['purchases']=$data->fetchAll();
	
	$response['success']=true;
#Payment
}else if($response['call']==='submit'){
	if(!empty($_POST['cardNumber'])){
		$response['success']=true;
		echo 'I got your credit card number!';
	}
	
	#Get each individual purchase
	$data=$db->prepare(
		'INSERT INTO
			points
			(points,user,comment)
			VALUES (?,?,?)'
	);
	
	if($data->execute([$purchased,'','Purchase'])){
		
	}
}else{
	echo 'No call type passed!';
}

$response['message']=ob_get_clean();
echo json_encode($response);

?>