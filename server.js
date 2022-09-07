var can = require('socketcan');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var channel = can.createRawChannel("can0",true); 
var fs = require('fs')
var dirname = require('path');
var ps = require('python-shell');

var canData ={};
var maxInc = 16000;
var dir;
var freq;   
var rpm; 
var ena;
var microSteps = 3200;
var startLogging;

//return middleware that only parses urlencoded bodies and only looks at request where the conten-type header matchtes the type option i.e. /update
app.use(express.urlencoded({extendend: true}));

//tell express to do to use the folder and webfiles (html)
app.use(express.static(__dirname + "/html")); //use html folder

//server up scripts for canvas gauges
app.use("/scripts",express.static(__dirname + "/node_modules/canvas-gauges/"));

//listening to POST request made by the browser  <form action="/update"
app.post('/update', function(req,res){
    //change maxInc, dir, freq, rpm  after Input Value
    maxInc=req.body.inc
    dir = req.body.dir
    freq = req.body.freq    
    rpm = req.body.rpm    
    ena = req.body.btn
   // console.log(ena)
   // console.log(freq)
   // console.log(rpm)
   // console.log(dir)
    if (freq == '')
    { freq = Math.round(microSteps / 60 * rpm)       
    // console.log(freq)    
    }
    var options = { 
       args: [freq,dir,ena],
    };
    //Start Stepper Motor after Button	
    ps.PythonShell.run("stepper.py", options, function (err) {
    if (err) console.error(err)    
    });
    
    //log data on button 
    console.log("logging")
    fs.unlinkSync("./data.json"); //delete old data.json file
    clearInterval(startLogging); //stop previous setInterval 
    //wait for some time, to not lot the ramp
    setTimeout(function(){
    //creatin new.json file with canData data
       startLogging = setInterval(() => {
       var logger = fs.createWriteStream('data.json', {flags:'a'}); //flags: 'a' => appending (old data will be preserved)             
       logger.write(JSON.stringify(canData, null, "\t")); //"\t" = Absatz nach jedem EIntrag
      },5) //logs every 5ms
    },1000) //starts logging after 2sec

}) 

//download data.json on button
app.post('/download', function(req,res){
    const file = `${__dirname}/data.json`;
    res.download(file);
})

//ws: catch anyone who tries to connect
//accept connection
io.on('connection', function(client){
   // console.log('Client Connected!')
})

setInterval(() => { // call a function at a specified interval until clearInterval
    io.emit('data', canData) // 'data = topic um drauf  zuzugreifen  , output canData, 
    },50)  //sending canData  every 50 millisecond from a socket -> need to put it in index.js
 
//listen to messages
channel.addListener("onMessage",function(msg){   //Log any Message
    canData.Inkremente = msg.data.readUIntBE(1,1) << 8 | msg.data.readUIntBE(0,1)
    console.log(msg) // candump
    canData.Grad = canData.Inkremente / maxInc * 360; //in Degree, 16000 through input
    canData.Speed = msg.data.readUIntBE(5,1) << 8 | msg.data.readUIntBE(4,1)  
    if((canData.Speed & 0x8000) > 0) //ist MSB gesetzt? 
    {
        canData.Speed = (canData.Speed - 0x10000);
    }
    console.log(canData)
 // console.log(maxInc)
 // console.log(dir)
 // console.log(freq)
})

channel.start()

server.listen(3000) //listen to port 3000, 3xxx ports dont have many major uses -> safe for development usage || lower ports like 80 needts root access 