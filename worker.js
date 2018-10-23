var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/chat')
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');

var msg= mongoose.model('msg',{
  content: String,
  time: String
})

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

    var app = express();
    

    var httpServer = this.httpServer;
    var scServer = this.scServer;

    if (environment === 'dev') {
      // Log every HTTP request. See https://github.com/expressjs/morgan for other
      // available formats.
      app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Add GET /heforforalth-check express route
    healthChecker.attach(this, app);

    httpServer.on('request', app);

    var count = 0;
   
    var m= new msg();
    

    /*

      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function (socket) {

      // Some sample logic to show how to handle client events,
      // replace this with your own logic
      
      socket.on('chat', function (data) {
       
        
        m.content=data;
        m.time= new Date;
        m.save().then(()=>console.log('saved',m.time)).catch(err=>console.log(err))
        console.log("USer connected",data);
        scServer.exchange.publish('yell', data);
        socket.on('disconnect', function()
        {
          console.log("User Disconnected");
        })
        
      });

      var interval = setInterval(function () {
        socket.emit('random', {
          number: Math.floor(Math.random() * 5)
        });
      }, 1000);
     
      socket.on('disconnect', function () {
        clearInterval(interval);
      });
    });
  }
}

new Worker();
