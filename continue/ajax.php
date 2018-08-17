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
$host='localhost';					#Can probably stick with this
$database='database';				#The database your points and goals tables are in
$username='user';					#The MySQL user name (not your hosting account name)
$password='password';				#The MySQL user password

### Technical ###
$language=	'en-us';
$ratio=		'5:1';					#Currency:points ratio
$currency=	'USD';					#Currency you'll be RECEIVING payments in
$feeCalc=	'-2.9%-30';				#The fees, in percentage and amounts (from left to right)
$testing=	true;					#Used for testing; nothing will actually be spent
date_default_timezone_set('UTC');	#Use the timezone you're basing your MySQL table off (http://php.net/manual/en/timezones.php)

#The payment services you're using, and your relevant keys
$services=[
	'stripe'=>[
		'publishableKey'=>''
		,'secretKey'	=>''
	]
];

## Data ##
$email='joshuapowlison@gmail.com';	#Email for help and error messages

## Custom ##
$goals=true;						#Use goals
$notifyMe=false;					#Receive emails when goals are met or updating fails

##########################################
################## CODE ##################
##########################################

$response=[
	'call'				=>	$_POST['call']
	,'ratio'			=>	$ratio		
	,'currency'			=>	$currency
	,'feeCalc'			=>	$feeCalc
	,'testing'			=>	$testing
	,'message'			=>	null
	,'success'			=>	false
	,'idempotencyKey'	=>	uniqid()
];

#Get database
$db=new PDO(
	'mysql:host='.$host.';
	dbname='.$database.';
	charset=utf8',
	$username,
	$password,
	[PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

#We consider money passed to make the payment; WE DON'T CALCULATE PAYMENT OFF POINTS, but points off payment (in case there's a mistake; we don't EVER want to mischarge the user)

#Get form info
if($response['call']==='get'){
	#Check what payment services are supported and get the relevant files
	$response['services']=[];
	foreach($services as $service => $keys){
		switch($service){
			case 'stripe':
				$response['services'][$service]=$keys['publishableKey'];
				break;
			case 'paypal':
				break;
			case 'amazon':
				break;
			default:
				echo 'Payment service not recognized!';
		}
	}
	
	$response['success']=true;
#Payment
}else if($response['call']==='submit'){
	$purchaseSuccessful=false;

	$amount=$_POST['money'] ?? 0;
	
	#Deduct fees
	$deductions=explode('-',$response['feeCalc']);
	
	#Math help: http://amby.com/educate/math/4-2_prop.html
	
	#Go from left to right
	for($i=1;$i<count($deductions);$i++){
		#Deduct percentage
		if(strpos($deductions[$i],'%')!==false) $amount-=((floatval(str_replace('%','',$deductions[$i])))/100)*$amount;
		#Deduct amount
		else $amount-=floatval($deductions[$i]);
	}
	
	$amount=$amount;
	
	#Get moneyToPoints ratio
	$tempSplit=explode(':',$response['ratio']);
	$moneyToPoints=$tempSplit[1]/$tempSplit[0];

	#Convert money to points
	$points=0;
	
	$points=floor($amount*$moneyToPoints);
		
	#Set the money or points to returnVal but no less than 0
	$points=($points<0) ? 0 : $points;
	
	#If the local values line up with these ones, make the purchase!
	#DO NOT ASSUME LOCAL CALCULATIONS OR VALUES (other than price) PASSED ARE CORRECT EVER!!!!
		
	#Choose a payment service based on what the user passed, and work with it in the require file
	switch($_POST['service']){
		case 'stripe':
		case 'paypal':
		case 'amazon':
			require 'payment-providers/'.$_POST['service'].'-payment.php';
			break;
		default:
			echo 'Payment service not recognized!';
	}
	
	if($purchaseSuccessful){
		#Send purchase info
		$data=$db->prepare(
			'INSERT INTO
				points
				(points,user,comment)
				VALUES (?,?,?)'
		);
		
		if($_POST['points']!=$points){
			echo 'Our points calculation was off! Maybe things have changed; try refreshing the webpage and purchasing again! You sent ',$_POST['points'],' but we calculated ',$points,'. Email ',$email,' for help.';
		}else if(floor($_POST['moneyAfterFees'])!==floor($amount)){
			echo 'Our money calculation after fees was off! You sent ',$_POST['moneyAfterFees'],' but we calculated ',$amount,'. Email ',$email,' for help.';
		}else if($points===0){
			echo 'You can\'t purchase 0 points! Try a higher number, like 1.';
		}else if($data->execute([$points,$_POST['user'],'Purchase'])){
			$response['success']=true;
			echo 'You successfully purchased ',$points,' points!';
			
			#Get the total point count
			$data=$db->prepare(
				'SELECT
					SUM(points) AS total_points
				FROM points'
			);
			
			if($data->execute()) $response['totalPoints']=$data->fetch()['total_points'];
			
			if($notifyMe) mail(
				$email
				,$_POST['user'].' purchased '.$amount.' points!'
				,'This is an automatic notification sent to you by ajax.php as part of Continue.\r\n\r\n'.$_POST['user'].' purchased '.$points.' for '.$amount.', bringint the total point count up to '.$response['totalPoints'].'!\r\n\r\nIf you don\'t want to receive these messages, disable $notifyMe in ajax.php'
				,'From: '.$email
			);
			
			if($goals){
				#Get the total point count
				$data=$db->prepare(
					'SELECT
						id
						,reward
					FROM goals
					WHERE
						date_met IS NULL
						AND points<=?'
				);
				
				if($data->execute([$response['totalPoints']])){
					while($row=$data->fetch()){
						if($notifyMe) mail(
							$email
							,'Reward '.$row['id'].' has been met with '.$response['totalPoints']
							,'This is an automatic notification sent to you by ajax.php as part of Continue.\r\n\r\nCongratulations on the accomplishment! '.$_POST['user'].' made it happen by buying '.$points.' for '.$amount.'\r\n\r\nIf you don\'t want to receive these messages, disable $notifyMe in ajax.php'
							,'From: '.$email
						);
					}
				}
				
				#Get the total point count
				$data=$db->prepare(
					'UPDATE goals
					SET
						date_met=NOW()
					WHERE
						date_met IS NULL
						AND points<=?'
				);
				
				if(!$data->execute([$response['totalPoints']])){
					if($notifyMe) mail(
						$email
						,'A goal was met, but the table can\'t be updated'
						,'This is an automatic notification sent to you by ajax.php as part of Continue.\r\n\r\nCongratulations on the accomplishment, but you do have an error updating the goals! '.$_POST['user'].' made the goal happen by buying '.$points.' for '.$amount.'\r\n\r\nIf you don\'t want to receive these messages, disable $notifyMe in ajax.php'
						,'From: '.$email
					);
				}
			}
			
		}else{
			echo 'We failed to submit your purchase! Email ',$email,' for help.';
		}
	}else{
		echo 'Payment failed!';
	}
}else{
	echo 'No call type passed!';
}

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

if($goals){
	#Get goals
	$data=$db->prepare(
		'SELECT
			points
			,reward
			,date_met AS dateMet
		FROM goals
		ORDER BY
			-date_met DESC
			,points ASC'
	);
	
	if($data->execute()) $response['goals']=$data->fetchAll();
}


$response['message']=ob_get_clean();
echo json_encode($response);

?>