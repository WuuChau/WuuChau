//pass Data from backend (server) to frontend (webpage)
// socket.io -> websocket
//required socket.io in html with <script> we can use it now in the js

var socket = io.connect('10.130.3.97:3000');

//setIntervall from server.js
document.addEventListener("DOMContentLoaded",onDOMReadyHandler())  //DOMContentLoaded = warten bis HTML-Doku vollständig geladen hat

function onDOMReadyHandler(event){
    socket.on('data',(data) => {  //'data' = topic we used in server.js //parse the (data) in  // socket.on = listening for socket events 
       var speed = document.getElementsByTagName('canvas')[0] //'p' [1]
      // var grad = document.getElementById('grad')
      // var speed2 = document.getElementById('rpm')
      // speed2.setAttribute('rpm', data.Speed)
      // grad.setAttribute('grad', data.Grad.toFixed(2))//'grad'//setAttribute = Sets/Updates the Value of an attribute on the specified element 
       speed.setAttribute('data-value', data.Speed) //'rpm'
      //var data = document.getElementById('data')
      //data.setAttribute('data', data)
       console.log(data)
       
       let progressBar = document.querySelector(".circular-progress");
       let valueContainer = document.querySelector(".value-container");     
      
       valueContainer.textContent = "Position: " +  `${data.Grad.toFixed(2)}°`; //`${}` = Template String   `Platzhalter`
       progressBar.style.background = `conic-gradient(#ff6400 ${data.Grad.toFixed(2)}deg, #f5a069 ${data.Grad.toFixed(2)}deg`;
    });
}
