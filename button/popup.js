var today = new Date();
var dd;
var mm;
var yyyy;

function setDateFields(d, m, y) {
	dd = d;
	mm = m;
	yyyy = y;
}

function populateCurrencies(info) {
	var currency = document.getElementById('currency');
	if (info) {
		for (var i = 0; i < info.length; i++) {
			var opt = info[i].cc;
			if (opt && opt != 'USD') {
				var el = document.createElement("option");
				el.id = opt;
				el.textContent = opt;
				el.value = opt;
				el.text = opt;
				currency.appendChild(el);
			}
		}
	}
}

function onLoad() {
	onToday();
	var date = '' + yyyy + mm + dd;
	var url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=' + date + '&json';
	var request = httpGetAsync(url, function(responseText) {
		var info = JSON.parse(responseText);
		if (info[0]) {
		    populateCurrencies(info);
		}
	});
	document.getElementById('today').addEventListener('click', onToday);
	document.getElementById('go').addEventListener('click', onGo);
	document.getElementById('rate').addEventListener('click', onCopy);
}

document.addEventListener("DOMContentLoaded", onLoad);

function normalizeDate(dd, mm, yyyy) {
	var d = '' + dd;
	var m = '' + mm;
	var y = '' + yyyy;

	if (Number(dd) && d.length < 2 && dd < 10) {
		dd = '0' + dd;
	} 

	if (Number(mm) && m.length < 2 && mm < 10) {
		mm = '0' + mm;
	}
	
	if (Number(yyyy) && y.length < 4 && yyyy < 100) {
		yyyy = '20' + yyyy;
	}
	
	document.getElementById('dd').value = dd;
	document.getElementById('mm').value = mm;
	document.getElementById('yyyy').value = yyyy;
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function processRate(currency) {
	var isValid = Date.parse('' + yyyy + '-' + mm + '-' + dd);
	if (isValid) {
		var date = '' + yyyy + mm + dd;
		var url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json&valcode=' + currency + '&date=' + date;
		var request = httpGetAsync(url, function(responseText) {
			var info = JSON.parse(responseText);
			if (info[0]) {
				showRate(info[0].rate);
			}
		});
	} else {
		hideRate();
	}
}

function onGo() {
	setDateFields(document.getElementById('dd').value,
	              document.getElementById('mm').value,
				  document.getElementById('yyyy').value);
	normalizeDate(dd, mm, yyyy);
	processRate(document.getElementById('currency').value);
}

function onToday() {
	setDateFields(today.getDate(), today.getMonth() + 1, today.getFullYear()); //January is 0!
	normalizeDate(dd, mm, yyyy);
	processRate(document.getElementById('currency').value);
	
	document.getElementById('go').disabled = false;
}

function copyStringToClipboard(str) {
   // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = str;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   // Remove temporary element
   document.body.removeChild(el);
}

function onCopy() {
	copyStringToClipboard(document.getElementById("rate").value);
}

function showRate(rate) {
	document.getElementById("rate").value = rate;
	document.getElementById("separator").hidden = false;
	document.getElementById("rate").hidden = false;
}

function hideRate() {
	document.getElementById("rate").value = '';
	document.getElementById("separator").hidden = true;
	document.getElementById("rate").hidden = true;
}