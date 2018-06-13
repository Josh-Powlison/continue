function Continue(input){

'use strict';

//If an input object doesn't exist, make one
if(!input) input={};

///////////////////////////////////////
///////////PUBLIC VARIABLES////////////
///////////////////////////////////////

//Engine settings
const C=this;

//Set default values
function d(v,val){C[v]=(input[v]!==undefined ? input[v] : val);}

/*VARIABLE				DEFAULT VALUE										*/
d('form'			,	null												);
d('points'			,	10													);
d('money'			,	null												);
d('pointsEls'		,	[]													);
d('moneyEls'		,	[]													);
d('messageEls'		,	[]													);

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
	//Go through each relevant element
	for(var i=0;i<C[to+'Els'].length;i++){
		var value=C[to];
		
		//If it's outputting to money and display isn't raw, get the local display for it!
		if(to==='money'){
			if(C[to+'Els'][i].tagName==='INPUT'){
				value=C[to]/100;
			}else{
				value=new Intl.NumberFormat('en-US',{style:'currency',currency:C.currency}).format(C[to]/100);
			}
		}
		
		//Output to the tag, whether it's a value or innerHTML
		if(C[to+'Els'][i].tagName==='INPUT') C[to+'Els'][i].value=value;
		else C[to+'Els'][i].innerHTML=value;
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
	formData.append('service',document.getElementById('service').value);
	formData.append('idempotencyKey',C.idempotencyKey);

	new Promise(function(resolve,reject){
		//Check values
		if(!document.getElementById('email').checkValidity){
			reject('Your email is invalid!');
		}
		formData.append('email',document.getElementById('email').value);
		
		if(!document.getElementById('user').checkValidity){
			reject('Your username is invalid!');
		}
		formData.append('user',document.getElementById('user').value);
		
		//Stripe
		if(C.services.stripe){
			stripe.createToken(card).then(result=>{
				if(result.error){
					reject(result.error.message);
					console.log(result);
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
			console.log(json);
			message(json.message);
			C.idempotencyKey=json.idempotencyKey;
		})
		.catch(response=>{message(response);})
		;
	}).catch(input=>{
		message(input);
	});
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var pointsToMoney;
var moneyToPoints;

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

function message(input){
	//Put the message inside of the relevant element(s)
	for(var i=0;i<C['messageEls'].length;i++){
		C['messageEls'][i].innerHTML=input;
	}
}

function users(json){
	var table='<table>';
	for(var i=0;i<json.length;i++){
		table+='<tr><td>'+json[i].user+'</td><td>'+json[i].points+'</td></tr>';
	}
	table+='</table>';
	
	return table;
}

function goals(json){
	var table='<table>';
	
	var nextGoal=null;
	
	for(var i=0;i<json.length;i++){
		if(json[i].dateMet===null){
			nextGoal=i;
			table+='<tr><td>'+json[i].reward+'</td><td>'+json[i].points+'</td><td>Ongoing!</td></tr>';
			continue;
		}
		
		table+='<tr><td>'+json[i].reward+'</td><td>'+json[i].points+'</td><td>'+new Intl.DateTimeFormat().format(json[i].timestamp)+'</td></tr>';
	}
	table+='</table>';
	
	return table;
}

function purchases(json){
	var table='<table>';
	for(var i=0;i<json.length;i++){
		table+='<tr><td>'+json[i].user+'</td><td>'+json[i].points+'</td><td>'+json[i].comment+'</td><td>'+new Intl.DateTimeFormat().format(json[i].timestamp)+'</td></tr>';
	}
	table+='</table>';
	
	return table;
}

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////



///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

var stripe;
var card;

//Get info on payment setup from ajax.php; we'll also submit payment TO ajax.php. This way, we don't have to adjust data in two places; we can trust the data will be the same when we start up the form, and when we submit.
var formData=new FormData();
formData.append('call','get');

fetch('continue/ajax.php',{
	method:'POST',
	body:formData
})
.then(
	response=>{return response.json()}
)
.then(
	json=>{
		console.log(json);
		if(json.success){
			C.ratio=json.ratio;
			C.currency=json.currency;
			C.feeCalc=json.feeCalc;
			C.totalPoints=json.totalPoints;
			C.users=json.users;
			C.purchases=json.purchases;
			C.goals=json.goals;
			C.services=json.services;
			C.idempotencyKey=json.idempotencyKey;
			
			document.getElementById('users').innerHTML=users(C.users);
			document.getElementById('purchases').innerHTML=purchases(C.purchases);
			if(C.goals) document.getElementById('goals').innerHTML=goals(C.goals);
			document.getElementById('totalPoints').innerHTML=C.totalPoints;
			
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
					card.mount(document.getElementById('cardElement'));
				});
			}
			
			var tempSplit=C.ratio.split(':');
			pointsToMoney=tempSplit[0]/tempSplit[1];
			moneyToPoints=tempSplit[1]/tempSplit[0];
			
			//Add event listeners for points input(s)
			for(var i=0;i<C['pointsEls'].length;i++){
				if(C['moneyEls'][i].tagName==='INPUT') C['pointsEls'][i].addEventListener('input',function(){
					C.points=this.value;
					C.convert('money');
				});
			}
			
			//Add event listeners for money input(s)
			for(var i=0;i<C['moneyEls'].length;i++){
				if(C['moneyEls'][i].tagName==='INPUT'){
					C['moneyEls'][i].addEventListener('input',function(){
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
		}
	}
);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

}