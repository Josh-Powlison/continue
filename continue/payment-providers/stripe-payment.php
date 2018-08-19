<?

##########################################
############# STRIPE PAYMENT #############
##########################################

#Get init.php from the folder you got, or use Composer! Get packages at https://stripe.com/docs/libraries#php
require 'stripe-php-6.8.0/init.php';

#Also, you can get the logo from this webpage: https://stripe.com/about/resources
#I recommend blue on clear. Put it into this folder!

\Stripe\Stripe::setApiKey($services['stripe']['secretKey']);

#Assume failure if we don't succeed
$fail=true;

#idempotencyKey makes sure the same charge isn't being sent through twice
if(!$_POST['idempotencyKey']) {
	echo 'Missing Idempotency Key. Try submitting the form again.';
}else if($_POST['money']<50){
	echo 'Stripe payments can be no less than 50 US cents. Try increasing the amount you\'re paying to at least that!';
#Success moving forward!
}else{
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
		$fail=false;
	}catch(\Stripe\Error\Card $e) {
		#The card has been declined
		echo 'Your card was declined.';
	}catch(\Stripe\Error\RateLimit $e) {
		#Too many requests made to the API too quickly
		echo 'Error! Try again in a bit.';
	}catch(\Stripe\Error\InvalidRequest $e){
		#Invalid parameters were supplied to Stripe's API
		echo 'Error! We sent bad values to the Stripe API for some reason. Try refreshing the webpage!'.$e;
	}catch(\Stripe\Error\Authentication $e){
		#Authentication with Stripe's API failed (maybe you changed API keys recently)
		echo 'Error! We had a problem with authentication. Try refreshing the webpage!';
	}catch(\Stripe\Error\ApiConnection $e){
		#Network communication with Stripe failed
		echo 'Error! We had a problem communicating with Stripe. Make sure your internet\'s still up!';
	}catch(\Stripe\Error\Base $e){
		#Display a very generic error to the user, and maybe send yourself an email
		echo 'Error!';
	}catch(Exception $e){
		#Something else happened, completely unrelated to Stripe
		echo 'Error! Something happened outside of Stripe\'s abilities (and I assume out of our own as well). Try refreshing the webpage!';
	}
}