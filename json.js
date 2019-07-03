// var host = "lsdi.ufma.br";
// var port = 1883;
var port = 34733;
var host = "postman.cloudmqtt.com";
var pintura_parado = [];
var pintura_andando = [];
var pintura_correndo = [];
var pintura = [];
var map;
var valor;
var path_parado = [];
var path_andando = [];
var path_correndo = [];
var tempo = [];
var tempo_fim = 0;
var aux = [];

//cria uma instancia de cliente para subscrever no broker
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

// conecta o cliente
client.connect(options);

// ao conectar subscreve os topicos
function onConnect() {
	client.subscribe("mhub/luis.silva@lsdi.ufma.br/service_topic/Location");
	client.subscribe("mhub/luis.silva@lsdi.ufma.br/service_topic/Velocidade");
}

// caso falhe
function doFail(e) {
	console.log(e);

	var t = document.getElementById("messages").innerHTML += "<div id='1'>" + "Falha na Conexão" + "</div>";
	var t = document.getElementById("messages").innerHTML += "<div id='2'>" + "Host: " + "" + host + "</div>";
	var t = document.getElementById("messages").innerHTML += "<div id='3'>" + "Porta: " + "" + port + "</div>";

}

// caso desconecte
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("onConnectionLost:" + responseObject.errorMessage);
		var txt_pre_definido = document.getElementById('messages').value;
		var t = document.getElementById("messages").innerHTML += "<div id='4'>" + responseObject.errorMessage + "</div>";
		//i++;

	}
}

// sempre que uma mensagem nova chega
function onMessageArrived(message) {
	var obj = JSON.parse(message.payloadString.replace(/\bNaN\b/g, "null")); // gera um objeto a partir do JSON recebido do broker
	pintura.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude }); // incrementa um array de longitudes e latitudes

	// tratamento de elementos visuais da pagina baseados nos valores de velocidade
	if (obj.serviceName == "Velocidade") {
		valor = parseFloat(obj.serviceValue).toFixed(4); //recebe o valor calculado do topico velocidade
		document.getElementById("velocidade").innerHTML = "<h3 id='velocidade' style='color:green'> " + valor + " m/s </h3>"; //atualiza a exibicao de velocidade

		if (valor > 100000){ //tratamento de calibragem
			document.getElementById("messages").innerHTML += "<div style='color:blue'> " + "CALIBRANDO...</div>";
			document.getElementById("velocidade").innerHTML = "<h3 id='velocidade' style='color:blue'>  CALIBRANDO... </h3>";
		}
		else if (valor <= 0.45) {
			tempo.push(Math.round(new Date().getTime()/1000)); //pega o timestamp atual e coloca no array de tempos
			document.getElementById("boneco").src = "img/parado.png"; //atualiza o icone exibido na pagida de acordo com a velocidade
			document.getElementById("messages").innerHTML += "<div style='color:green'> " + "PARADO " + tempo_fim + "s" + "</div>"; //atualiza o log com o tempo e o tipo de movimento (parado)
		}
		else if (valor > 2.1) {
			tempo.push(Math.round(new Date().getTime()/1000));
			tempo_fim = tempo[tempo.length-1] - tempo[0];
			tempo = []; //zera o array de tempo
			document.getElementById("boneco").src = 'img/correndo.png';
			document.getElementById("messages").innerHTML += "<div style='color:red'> " + "CORRENDO" + "</div>";
		}
		else {
			tempo.push(Math.round(new Date().getTime()/1000));
			tempo_fim = tempo[tempo.length-1] - tempo[0];
			tempo = []; //zera o array de tempo
			document.getElementById("boneco").src = 'img/andando.png';
			document.getElementById("messages").innerHTML += "<div style='color:yellow'> " + "ANDANDO" + "</div>";
		}
	} else if (obj.serviceName == "Location") { //tratamento de elementos de localizacao no mapa
		if (valor <= 0.45) {
			pintura_parado.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude }); //incrementa o array dedicado ao tipo:movimento PARADO
			path_parado.push(pintura_parado[pintura_parado.length - 1]); //incrementa o array dedicado a pintura do tipo:movimento PARADO
			atualiza(); //chama a funcao de atualizacao da pintura do mapa
			pintura.push(pintura_parado[pintura_parado.length - 1]); //incrementa o array de longitudes e latitudes
			
		}
		else if (valor > 2.1) {
			pintura_correndo.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude }); //incrementa o array dedicado ao tipo:movimento CORRENDO
			path_correndo.push(pintura_correndo[pintura_correndo.length - 1]);
			atualiza();
			path_correndo.push(pintura[pintura.length-1]); // reinicia o array dedicado a pintura de tipo:movimento CORRENDO, para que ele continue de onde o movimento de caminhada parou
			pintura.push(pintura_correndo[pintura_correndo.length - 1]);
		}
		else {
			pintura_andando.push({ lat: obj.sourceLocationLatitude, lng: obj.sourceLocationLongitude }); //incrementa o array dedicado ao tipo:movimento ANDANDO
			path_andando.push(pintura_andando[pintura_andando.length - 1]);
			atualiza();
			path_andando.push(pintura[pintura.length-1]); // reinicia o array dedicado a pintura de tipo:movimento ANDANDO, para que ele continue de onde o movimento de corrida parou
			pintura.push(pintura_andando[pintura_andando.length - 1]);
		
		}
	}
	tempo.push(Math.round(new Date().getTime()/1000)); //pega o ultimo timestamp e incrementa no array de tempo
	tempo_fim = tempo[tempo.length-1] - tempo[0]; //calcula os segundos decorridos utilizando o ultimo elemento do array de tempos menos o primeiro
	updateScroll(); //chama a atualizacao de rolagem do log
}

//inicializa o mapa
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), { zoom: 25, center: { lat: -2.559153, lng: -44.307938 }, mapTypeId: 'terrain' });
}

function atualiza() {
	var movimentos = [path_parado, path_andando, path_correndo];
	
	var coloracao_andando = new google.maps.Polyline({ //cria a linha dedicada ao tipo:movimento ANDANDO
		path: movimentos[1],
		geodesic: true,
		strokeColor: '#FFFF00',
		strokeOpacity: 1.0,
		strokeWeight: 15
	});

	var coloracao_correndo = new google.maps.Polyline({ //cria a linha dedicada ao tipo:movimento CORRENDO
		path: movimentos[2],
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 10
	});

	for (var i = 0; i < path_parado.length - 1; i++) { //itera sobre o array dedicado ao tipo:movimento PARADO
		marker = new google.maps.Marker({ //cria marcadores nos locais designados
			position: path_parado[i],
			center: path_parado[i],
			map: map,
			//title: JSON.stringify(path_parado[i])
			title: "tempo parado " + tempo_fim.toString() + "s"
		});
		//map.setCenter(path_parado[i]);

	}

	map.setCenter(pintura[pintura.length-1]);

	coloracao_andando.setMap(map); //seta a linha no mapa
	coloracao_correndo.setMap(map);

	path_andando = []; //reinicia o array dedicado a pintura do tipo:movimento ANDANDO
	path_correndo = [];
}

//atualiza a rolagem do log
function updateScroll(){
    var element = document.getElementById("messages");
    element.scrollTop = -(element.scrollHeight);
}