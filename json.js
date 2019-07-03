// Create a client instance
//Example client = new Paho.MQTT.Client("postman.cloudmqtt.com", 34266,"luis.silva@lsdi.ufma.br");
var port = 34733;
var host = "postman.cloudmqtt.com";
var pintura_parado = [];
var pintura_andando = [];
var pintura_correndo = [];
var pintura = [];
var map;
var valor;
var i = 0;
var w = 0;
var k = 0;
var inicio_parado = 0;
var inicio_andando = 0;
var inicio_correndo = 0;
var path_parado = [];
var path_andando = [];
var path_correndo = [];
var tempo = [];

client = new Paho.MQTT.Client(host, port, "web_" + parseInt(Math.random() * 100, 10));

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
var options = {
	useSSL: true,
	userName: "gnoyhyfh",
	password: "1fcYKehDxWjH",
	onSuccess: onConnect,
	onFailure: doFail
}

// connect the client
client.connect(options);

// called when the client connects
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	console.log("onConnect");
	client.subscribe("mhub/luis.silva@lsdi.ufma.br/service_topic/Location");
	client.subscribe("mhub/luis.silva@lsdi.ufma.br/service_topic/Velocidade");

}

function doFail(e) {
	console.log(e);

	var t = document.getElementById("messages").innerHTML += "<div id='1'>" + "Falha na Conexão" + "</div>";
	var t = document.getElementById("messages").innerHTML += "<div id='2'>" + "Host: " + "" + host + "</div>";
	var t = document.getElementById("messages").innerHTML += "<div id='3'>" + "Porta: " + "" + port + "</div>";

}

function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("onConnectionLost:" + responseObject.errorMessage);
		var txt_pre_definido = document.getElementById('messages').value;
		var t = document.getElementById("messages").innerHTML += "<div id='4'>" + responseObject.errorMessage + "</div>";
		//i++;

	}
}
var tempo_fim = 0;

function onMessageArrived(message) {

	var obj = JSON.parse(message.payloadString.replace(/\bNaN\b/g, "null"));
	

	pintura.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude });

	if (obj.serviceName == "Velocidade") {
		valor = parseFloat(obj.serviceValue).toFixed(4);
		document.getElementById("velocidade").innerHTML = "<h3 id='velocidade' style='color:green'> " + valor + " m/s </h3>";

		if (valor <= 0.45) {
			tempo.push(Math.round(new Date().getTime()/1000));
			document.getElementById("boneco").src = "img/parado.png";
			document.getElementById("messages").innerHTML += "<div style='color:green'> " + "PARADO " + tempo_fim + "s" + "</div>";
		}
		else if (valor > 1.8) {
			tempo.push(Math.round(new Date().getTime()/1000));
			tempo_fim = tempo[tempo.length-1] - tempo[0];
			tempo = [];
			document.getElementById("boneco").src = 'img/correndo.png';
			document.getElementById("messages").innerHTML += "<div style='color:red'> " + "CORRENDO" + "</div>";
		}
		else {
			tempo.push(Math.round(new Date().getTime()/1000));
			tempo_fim = tempo[tempo.length-1] - tempo[0];
			tempo = [];
			document.getElementById("boneco").src = 'img/andando.png';
			document.getElementById("messages").innerHTML += "<div style='color:yellow'> " + "ANDANDO" + "</div>";
		}
	} else if (obj.serviceName == "Location") {
		if (valor <= 0.45) {
			pintura_parado.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude });
			i++;
			if (i == 5) {
				for (var j = inicio_parado; j <= pintura_parado.length - 1; j++) {
					path_parado.push(pintura_parado[pintura_parado.length - 1]);
					inicio_parado = pintura_parado.length - 1;
				}
				i = 0;
				atualiza();
				pintura.push(pintura_correndo[pintura_correndo.length - 1]);
			}
		}
		else if (valor > 1.8) {
			pintura_correndo.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude });
			w++;
			if (w == 1) {
				for (var j = inicio_correndo; j <= pintura_correndo.length - 1; j++) {
					path_correndo.push(pintura_correndo[pintura_correndo.length - 1]);
					inicio_correndo = pintura_correndo.length - 1;
				}
				w = 0;
				atualiza();
				path_correndo.push(pintura[pintura.length-1]);
				pintura.push(pintura_correndo[pintura_correndo.length - 1]);
			}

		}
		else {
			pintura_andando.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude });
			k++;
			if (k == 3) {
				for (var j = inicio_andando; j <= pintura_andando.length - 1; j++) {
					path_andando.push(pintura_andando[pintura_andando.length - 1]);
					inicio_andando = pintura_andando.length - 1;
				}
				k = 0;
				atualiza();
				path_andando.push(pintura[pintura.length-1]);
				pintura.push(pintura_andando[pintura_andando.length - 1]);
			}
		}
	}
	tempo.push(Math.round(new Date().getTime()/1000));
	tempo_fim = tempo[tempo.length-1] - tempo[0];
	updateScroll();
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), { zoom: 25, center: { lat: -2.559153, lng: -44.307938 }, mapTypeId: 'terrain' });
}

function atualiza() {
	var movimentos = [path_parado, path_andando, path_correndo];

	var percurso = new google.maps.Polyline({
		path: pintura,
		geodesic: true,
		strokeColor: '#0000FF',
		strokeOpacity: 1.0,
		strokeWeight: 20
	});
	
	var coloracao_andando = new google.maps.Polyline({
		path: movimentos[1],
		geodesic: true,
		strokeColor: '#FFFF00',
		strokeOpacity: 1.0,
		strokeWeight: 15
	});

	var coloracao_correndo = new google.maps.Polyline({
		path: movimentos[2],
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 10
	});

	for (var i = 0; i < path_parado.length - 1; i++) {
		marker = new google.maps.Marker({
			position: path_parado[i],
			center: path_parado[i],
			map: map,
			title: JSON.stringify(path_parado[i])
		});
		map.setCenter(path_parado[i]);

	}

	coloracao_andando.setMap(map);
	coloracao_correndo.setMap(map);

	path_andando = [];
	path_correndo = [];
}

function updateScroll(){
    var element = document.getElementById("messages");
    element.scrollTop = -(element.scrollHeight);
}