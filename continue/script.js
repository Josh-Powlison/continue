'use strict';
function Continue(input={form:null}){

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const C=this;

if(!input.form) throw 'Error: No form element passed to Continue.';

C.form=input.form;
C.points=0;
C.money=0;

///////////////////////////////////////
///////////PUBLIC FUNCTIONS////////////
///////////////////////////////////////

//Convert between money and points
C.convert=function(to){
	var returnVal=0;
	
	//Convert either from money to points, or from points to money
	if(to==='money'){
		returnVal=Math.ceil(C.fees(C.points*pointsToMoney,true));
	}else{
		returnVal=Math.floor(C.fees(C.money)*moneyToPoints);
	}
	
	//Set the money or points to returnVal but no less than 0
	C[to]=returnVal<0 ? 0 : returnVal;
	
	C.update('money');
	C.update('points');
}

C.update=function(to){
	var elements=(to==='money') ? moneyEls : pointsEls;
	
	//Go through each relevant element
	for(var i=0;i<elements.length;i++){
		var value=C[to];
		
		//If it's outputting to money and display isn't raw, get the local display for it!
		if(to==='money'){
			if(elements[i].tagName==='INPUT'){
				value=C[to]/100;
			}else{
				value=new Intl.NumberFormat('en-US',{style:'currency',currency:C.currency}).format(C[to]/100);
			}
		}
		
		//Output to the tag, whether it's a value or innerHTML
		if(elements[i].tagName==='INPUT') elements[i].value=value;
		else elements[i].innerHTML=value;
	}
}

//Calculate new value after fees
C.fees=function(amount,add){
	
	var deductions=C.feeCalc.split('-');
	
	//Math help: http://amby.com/educate/math/4-2_prop.html
	
	//If adding the fee calculations
	if(add){
		//Go from right to left
		for(var i=deductions.length-1;i>0;i--){
			//Add percentage
			if(/%/.test(deductions[i])) amount=(
				amount*100
				)/(
				100-(parseFloat(deductions[i].replace('%','')))
			);
			//Add amount
			else amount+=parseFloat(deductions[i]);
		}

	//If removing the fee values
	}else{
		//Go from left to right
		for(var i=1;i<deductions.length;i++){
			//Deduct percentage
			if(/%/.test(deductions[i])) amount-=((parseFloat(deductions[i].replace('%','')))/100)*amount;
			//Deduct amount
			else amount-=parseFloat(deductions[i]);
		}
	}
	
	return amount;
}

//Submit the information
C.submit=function(){
	var formData=new FormData();
	formData.append('call','submit');
	formData.append('money',C.money);
	formData.append('points',C.points);
	formData.append('moneyAfterFees',C.fees(C.money));
	formData.append('service',service.value);
	formData.append('idempotencyKey',C.idempotencyKey);
	
	C.form.classList.add('continue-submitting');

	new Promise(function(resolve,reject){
		//Check values
		if(!email.checkValidity()){
			reject('Your email is invalid!');
		}
		formData.append('email',email.value);
		
		if(!userEl.checkValidity()){
			reject('Your username is invalid!');
		}
		formData.append('user',userEl.value);
		
		//Stripe
		if(C.services.stripe){
			stripe.createToken(card).then(result=>{
				if(result.error){
					reject(result.error.message);
				}else{
					formData.append('stripeToken',result.token.id);
					resolve();
				}
			});
		}
	}).then(()=>{
		//Send payment info
		fetch('continue/ajax.php',{
			method:'POST'
			,body:formData
		})
		.then(response=>{return response.json();})
		.then(json=>{
			message(json.message);
			
			updateValues(json);
		})
		.catch(response=>{
			message(response);
			C.form.classList.remove('continue-submitting');
		});
	}).catch(input=>{
		message(input);
		C.form.classList.remove('continue-submitting');
	});
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var pointsToMoney;
var moneyToPoints;
var currentGoal=0;

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function message(input){
	//Put the message inside of the relevant element(s)
	for(var i=0;i<messageEls.length;i++){
		messageEls[i].innerHTML=input;
	}
}

function users(json){
	var html='';
	
	//Early items are displayed simply
	for(var i=0;i<4;i++){
		//Don't go past JSON length
		if(i>=json.length) break;
		
		html+='<p class="continue-user-credit" style="font-size:'+Math.max(1.5-(i/5),.75)+'em">'+json[i].user+' <img class="continue-inline-svg" src="continue/logo.svg"> '+json[i].points+'</p>';
	}
	
	//Show remaining items
	if(json.length>=4){
		html+='<p class="continue-user-credit" style="font-size:.75em">';
		
		for(var i=4;i<json.length;i++){
			html+=json[i].user+' <img class="continue-inline-svg" src="continue/logo.svg"> '+json[i].points;
			
			if(i!==json.length-1){
				html+=', ';
			}
		}
		html+='</p>';
	}
	
	return html;
}

function updateValues(json){
	C.totalPoints=json.totalPoints;
	C.users=json.users;
	C.purchases=json.purchases;
	C.goals=json.goals;
	C.idempotencyKey=json.idempotencyKey;
	
	usersEls.innerHTML=users(C.users);
	totalPointsEls.innerHTML=C.totalPoints;
	
	//Get the current goal
	for(var i=0;i<C.goals.length;i++){
		//Skip this item if we have enough points and it's not last in the list
		if(C.totalPoints>C.goals[i].points && i!==C.goals.length-1) continue;
		
		C.form.querySelector('.continue-points-goal').innerHTML='/'+C.goals[i].points;
		C.form.querySelector('.continue-points-goal').dataset.goal=i;
		
		//Set background bar to show amount to next
		C.form.querySelector('.continue-points-info').style.background='linear-gradient(to right,#fdd3b1 '+Math.min((C.totalPoints/C.goals[i].points)*100,100)+'%,#cec5c1 0%)';
		
		updateGoal(i);
		break;
	}
	
	C.form.classList.remove('continue-submitting');
}

//Update current goal text
function updateGoal(number=0){
	//Keep with the limits
	if(number<0) number=0;
	if(number>=C.goals.length) number=C.goals.length-1;
	
	currentGoal=number;
	
	//Toggle back arrow
	if(number===0) goalsPrevious.classList.add('continue-goals-button-inactive');
	else goalsPrevious.classList.remove('continue-goals-button-inactive');
	
	//Toggle right arrow
	if(number===C.goals.length-1) goalsNext.classList.add('continue-goals-button-inactive');
	else goalsNext.classList.remove('continue-goals-button-inactive');
	
	var goalText='';
	
	//If we have this goal
	if(C.totalPoints>=C.goals[number].points){
		goalsEl.classList.add('continue-current-goal-have');
		
		goalText+='<strong title="'+C.goals[number].dateMet+'">'+new Intl.DateTimeFormat().format(C.goals[number].timestamp)+'</strong> ';
	//If we don't have this goal
	}else{
		goalsEl.classList.remove('continue-current-goal-have');
		
		//If this is the next goal, let the user know
		if(number===0) goalText+='<strong>Next</strong> ';
		else if(C.totalPoints>=C.goals[number-1].points) goalText+='<strong>Next</strong> ';
	}
	
	goalText+=C.goals[number].reward+' <img class="continue-inline-svg" src="continue/logo.svg"> '+C.goals[number].points;
	
	currentGoalEl.innerHTML=goalText;
}

///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

var stripe;
var card;

C.form.classList.add('continue-form');

//Get info on payment setup from ajax.php; we'll also submit payment TO ajax.php. This way, we don't have to adjust data in two places; we can trust the data will be the same when we start up the form, and when we submit.
var formData=new FormData();
formData.append('call','get');

var pointsEls, moneyEls, messageEls, totalPointsEls, paymentInfoEl, usersEls, userEl, email, goalsEl, goalsPrevious, goalsNext, currentGoalEl, service;

fetch('continue/ajax.php',{
	method:'POST',
	body:formData
})
.then(
	response=>{return response.json()}
)
.then(
	json=>{
		if(json.success){
			//Set the values right
			
			//Create the form if it's been passed
			if(json.html){
				C.form.innerHTML=json.html;
				
				///////////////////////////////////////
				///////////////ELEMENTS////////////////
				///////////////////////////////////////
				
				pointsEls=C.form.querySelectorAll('.continue-points');
				moneyEls=C.form.querySelectorAll('.continue-money');
				messageEls=C.form.querySelectorAll('.continue-message');
				totalPointsEls=C.form.querySelector('.continue-total-points');
				usersEls=C.form.querySelector('.continue-users');

				userEl=C.form.querySelector('.continue-user');
				email=C.form.querySelector('.continue-email');
				
				goalsEl=C.form.querySelector('.continue-goals');
				goalsPrevious=C.form.querySelector('.continue-goals-previous')
				goalsNext=C.form.querySelector('.continue-goals-next')
				currentGoalEl=C.form.querySelector('.continue-goals-current');
				
				paymentInfoEl=C.form.querySelector('.continue-card');
				
				service=C.form.querySelector('.continue-service');
				
				///////////////////////////////////////
				////////////EVENT LISTENERS////////////
				///////////////////////////////////////

				C.form.querySelector('.continue-goals-previous').addEventListener('click',function(event){
					event.preventDefault();
					updateGoal(currentGoal-1);
				});

				C.form.querySelector('.continue-goals-next').addEventListener('click',function(event){
					event.preventDefault();
					updateGoal(currentGoal+1);
				});

				C.form.querySelector('.continue-points-goal').addEventListener('click',function(event){
					updateGoal(parseInt(event.target.dataset.goal));
				});
			}
			C.ratio=json.ratio;
			C.currency=json.currency;
			C.feeCalc=json.feeCalc;
			C.services=json.services;
			
			//Run through services
			if(C.services.stripe){
				//Load and set up Stripe
				var script=document.createElement('script');
				script.src='https://js.stripe.com/v3/';
				C.form.appendChild(script);
				
				script.addEventListener('load',function(){
					stripe=Stripe(C.services.stripe);
					
					var elements=stripe.elements();
					
					card=elements.create('card');
					card.mount(paymentInfoEl);
				});
			}
			
			var tempSplit=C.ratio.split(':');
			pointsToMoney=tempSplit[0]/tempSplit[1];
			moneyToPoints=tempSplit[1]/tempSplit[0];
			
			//Add event listeners for points input(s)
			for(var i=0;i<pointsEls.length;i++){
				if(moneyEls[i].tagName==='INPUT') pointsEls[i].addEventListener('input',function(){
					C.points=this.value;
					C.convert('money');
				});
			}
			
			//Add event listeners for money input(s)
			for(var i=0;i<moneyEls.length;i++){
				if(moneyEls[i].tagName==='INPUT'){
					moneyEls[i].addEventListener('input',function(){
						C.money=this.value*100;
						C.convert('points');
					});
				}
			}
			
			//On form submission
			C.form.addEventListener('submit',function(event){
				event.preventDefault();
				C.submit();
			});
			
			updateValues(json);
		}
	}
);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

}