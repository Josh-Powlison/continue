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
d('points'			,	10													);
d('money'			,	null												);
d('pointsEls'		,	[]													);
d('moneyEls'		,	[]													);

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
		//Either put values out to values or innerHTML, depending on if the element's an input
		if(C[to+'Els'][i].tagName==='INPUT') C[to+'Els'][i].value=C[to];
		else{
			//If money, output in locale's format
			if(to==='money') C[to+'Els'][i].innerHTML=new Intl.NumberFormat('en-US',{style:'currency',currency:C.currency}).format(C[to]/100);
			//Otherwise, it's just a regular number
			else C[to+'Els'][i].innerHTML=C[to];
		}
	}
}

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
	fetch('continue.php',{
		method:'POST'
		,data:formData
		,headers:{'Content-Type':'application/json'}
	})
	.then(response=>response.json())
	.then(json=>console.log(json))
	;
}

///////////////////////////////////////
///////////PRIVATE VARIABLES///////////
///////////////////////////////////////

var pointsToMoney;
var moneyToPoints;

///////////////////////////////////////
///////////PRIVATE FUNCTIONS///////////
///////////////////////////////////////

///////////////////////////////////////
////////////EVENT LISTENERS////////////
///////////////////////////////////////



///////////////////////////////////////
/////////////////START/////////////////
///////////////////////////////////////

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
				if(C['moneyEls'][i].tagName==='INPUT') C['moneyEls'][i].addEventListener('input',function(){
					C.money=this.value;
					C.convert('points');
				});
			}
		}
	}
);

///////////////////////////////////////
/////////////////ADMIN/////////////////
///////////////////////////////////////

}