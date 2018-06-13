<?

##########################################
############# STRIPE PAYMENT #############
##########################################

#Get init.php from the folder you got, or use Composer! Get packages at https://stripe.com/docs/libraries#php
require 'stripe-php-6.8.0/init.php';

\Stripe\Stripe::setApiKey($services['stripe']['secretKey']);

#idempotencyKey makes sure the same charge isn't being sent through twice
if(!$_POST['idempotencyKey']) {
	echo 'Missing Idempotency Key. Try submitting the form again.';
}

#Create the charge on Stripe's servers - this will charge the user's card
try{
	$charge=\Stripe\Charge::create(array(
		'amount'			=> $_POST['money']
		,'currency'			=> $response['currency']
		,'source'			=> $_POST['stripeToken']
		,'receipt_email'	=> $_POST['email']
		,'description'		=> 'Points purchase'
		,'metadata' => array(
			'name'			=> $_POST['user'],
			'points'		=> $points
		)
	),array(
		'idempotency_key' => $_POST['idempotencyKey'],
	));
	$purchaseSuccessful=true;
}catch(\Stripe\Error\Card $e) {
	#The card has been declined
	echo 'Your card was declined.';
}catch(\Stripe\Error\RateLimit $e) {
	#Too many requests made to the API too quickly
	echo 'Error! Try again in a bit.';
}catch(\Stripe\Error\InvalidRequest $e){
	#Invalid parameters were supplied to Stripe's API
	echo 'Error!';
}catch(\Stripe\Error\Authentication $e){
	#Authentication with Stripe's API failed (maybe you changed API keys recently)
	echo 'Error!';
}catch(\Stripe\Error\ApiConnection $e){
	#Network communication with Stripe failed
	echo 'Error!';
}catch(\Stripe\Error\Base $e){
	#Display a very generic error to the user, and maybe send yourself an email
	echo 'Error!';
}catch(Exception $e){
	#Something else happened, completely unrelated to Stripe
	echo 'Error!';
}