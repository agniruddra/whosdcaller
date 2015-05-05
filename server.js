/**
 * Module dependencies.
 */
var express = require('express');
var session = require('client-sessions');
var favicon = require('serve-favicon');
//var routes = require('./routes');
var http = require('http');
var path = require('path');
//load customers route
var customers = require('./routes/customers'); 
var app = express();
var connection  = require('express-myconnection'); 
var mysql = require('mysql');
// all environments
app.set('port', process.env.PORT || 4300);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
/*------------------------------------------
    connection peer, register as middleware
    type koneksi : single,pool and request 
-------------------------------------------*/
app.use(
    connection(mysql,{
       host     : 'sql5.freemysqlhosting.net',
       user     : 'sql576084',
       password : 'mB4*yV9!',
       database : 'sql576084'
    },'request')
);//route index, hello world
app.use(session({
  cookieName: 'session',
  secret: 'eatmyshorts',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

function authUser(req,res,next){
    if (req.session && req.session.user) { // Check if session exists
		    // lookup the user in the DB by pulling their email from the session
		    var username = req.session.user.username;
		    console.log(username);
		  req.getConnection(function(err,connection){
		    connection.query('SELECT * FROM users WHERE username = ?',[username],function(err,user){
		    	console.log(user);
		      if (user===null) {
		        // if the user isn't found in the DB, reset the session info and
		        // redirect the user to the login page
		        req.session.reset();
		        res.redirect('/login');
		      } else {
		        // expose the user to the template
		        res.locals.user = user;

		        // render the dashboard page
		        next();
		      }
		    });
		  });
		  } else {
		    res.redirect('/login');
		  }
}


app.get('/',function(req,res){
  res.render('index');
});
app.get('/customers', customers.list);
app.get('/customers/add', customers.add);
app.post('/customers/add', customers.save);
app.get('/customers/edit/:phone',authUser, customers.edit); 
app.post('/customers/edit/:phone',customers.save_edit);
app.get('/customers/delete/:phone',authUser, customers.delete_customer);
app.post('/search/:phone',customers.search);
app.get('/login',function(req, res) {
    res.render('login');
});
app.post('/login', function(req,res){
	var username = req.body.username;
	req.getConnection(function(err,connection){
		console.log("hi");
	connection.query('SELECT * FROM users WHERE username = ?',[username],function(err,user){
  	console.log(user);
    if (user[0]==null) {
    	console.log("hello");
      	res.redirect('/login');
    }else {
    	console.log(req.body.password+"==="+user.password);
      if (req.body.password === user[0].password) {
      	req.session.user = user;
        res.redirect('/customers');
      } else {
      	console.log('Invalid');
        res.redirect('/login');
      }
    }
  });
});
});
app.use(app.router);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});