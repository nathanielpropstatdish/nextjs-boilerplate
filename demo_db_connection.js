//sudo mysql to connect to mysql server as root, this requires no additional password (uses root user password by default)
var mysql = require('mysql');  //require mysql library for node

var con = mysql.createConnection({ //create a connection using the createConnection function of the mysql library, store in variable
  host: "127.0.0.1", //this is normally localhost but I switched it to an IP as a fix for some GH codespace stuff
  user: "standard", //You have to create a username/password combo in mysql, then you can use the credentials to login
  password: "password"
});

con.connect(function(err) { /*call the connect function of the mysql library and we throw an entire function into the connect call?  So it seems
So this is a callback function.  The function gets executed after the connection attempt OR if an error occurs.  In this case its simple
we either connect through and the function prints text to console or we get an error and the function prints the error out.  Turns out these are pretty core to JS
which is, again, a wiggly (no typing) language where you can just do whatever.  
Remember stringing together 5 function calls or accessing sub-sub-sub attributes of JSON arrays is normal*/
  if (err) throw err; //throw err appears to exit the program as well.
  console.log("Connected!");
  con.end();
  console.log("Connection ended properly");
}); //there should be a connection.end(); call here in order to close out the SQL connection and save resources.  I added it.

