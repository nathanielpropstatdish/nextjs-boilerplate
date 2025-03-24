//sudo mysql to connect to mysql server as root, this requires no additional password (uses root user password by default)
var mysql = require('mysql');  //require mysql library for node

var con = mysql.createConnection({ //create a connection using the createConnection function of the mysql library, store in variable
  host: "127.0.0.1", //this is normally localhost but I switched it to an IP as a fix for some GH codespace stuff
  user: "standard", //You have to create a username/password combo in mysql, then you can use the credentials to login
  password: "password"
});

/*Hid all these notes behind a comment to do the work below

con.connect(function(err) { /*call the connect function of the mysql library and we throw an entire function into the connect call?  So it seems
So this is a callback function.  The function gets executed after the connection attempt OR if an error occurs.  In this case its simple
we either connect through and the function prints text to console or we get an error and the function prints the error out.  Turns out these are pretty core to JS
which is, again, a wiggly (no typing) language where you can just do whatever.  
Remember stringing together 5 function calls or accessing sub-sub-sub attributes of JSON arrays is normal*//*
  if (err) throw err; //throw err appears to exit the program as well.
  console.log("Connected!");
  
}); //there should be a connection.end(); call here in order to close out the SQL connection and save resources.  I added it.
*/

/*Thoughts
I admit, it was an AI that did some stuff below this.  Why include the command in the schema definition
is some logic I am too new to understand.  Is this standard?  I should think not...
But maybe this is how JS does it.  Anyways I'm not refactoring this right now.
It does make it easy to see what's going to happen with this schema though...
*/
/*Actual Notes
This code is intended to check for several tables, if they don't exist then we want to create them.
The schema for each table is stored in a value.
1. Connect to mysql server
2. Check if tables exist
3. Use complicated regex expression to parse the command out of our schema *Why would AI do this?
4. Create or modify the tables to match our schema *no error handling for removing a column with values
The AI never closed that connection to the SQL server, weird.
*/
const USERS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    TID INT,
    Wins INT,
    Losses INT,
    Points INT
  )
`;

const MATCHES_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS Matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Winner VARCHAR(255),
    Bet DECIMAL(10, 2),
    Payout DECIMAL(10, 2),
    Participants TEXT
  )
`;

const DOCUMENTS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS Documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255),
    Language VARCHAR(255),
    OriginCity VARCHAR(255),
    OriginState VARCHAR(255),
    Year INT,
    Month INT,
    Day INT,
    Difficulty VARCHAR(255)
  )
`;

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  // Check if database exists
  con.query("SHOW DATABASES LIKE 'test'", function(err, result) {
    if (err) throw err;

    if (result.length === 0) {
      // Database does not exist, create it
      con.query("CREATE DATABASE test", function(err, result) {
        if (err) throw err;
        console.log("Database created!");

        // Switch to the new database
        con.changeUser({database: 'test'}, function(err) {
          if (err) throw err;

          // Create tables
          createOrUpdateTables();
        });
      });
    } else {
      // Database exists, switch to it and check tables
      con.changeUser({database: 'test'}, function(err) {
        if (err) throw err;
        console.log("Switched to test database");

        // Create or update tables
        createOrUpdateTables();
      });
    }
  });
});

function createOrUpdateTables() {
  let pendingOperations = 3; // Number of tables to check/update

  // Create or update Users table
  con.query(USERS_TABLE_SCHEMA, function(err, result) {
    if (err) throw err;
    console.log("Users table checked/created!");
    checkAndUpdateTable('Users', USERS_TABLE_SCHEMA, operationCompleted);
  });

  // Create or update Matches table
  con.query(MATCHES_TABLE_SCHEMA, function(err, result) {
    if (err) throw err;
    console.log("Matches table checked/created!");
    checkAndUpdateTable('Matches', MATCHES_TABLE_SCHEMA, operationCompleted);
  });

  // Create or update Documents table
  con.query(DOCUMENTS_TABLE_SCHEMA, function(err, result) {
    if (err) throw err;
    console.log("Documents table checked/created!");
    checkAndUpdateTable('Documents', DOCUMENTS_TABLE_SCHEMA, operationCompleted);
  });

  function operationCompleted() {
    pendingOperations--;
    if (pendingOperations === 0) {
      con.end(function(err) {
        if (err) throw err;
        console.log("Connection ended properly");
      });
    }
  }
}

function checkAndUpdateTable(tableName, tableSchema, callback) {
  con.query(`DESCRIBE ${tableName}`, function(err, result) {
    if (err) {
      console.error(`Error describing table ${tableName}:`, err);
      callback();
      return;
    }

    // Extract column definitions from the table schema
    const columnDefinitions = tableSchema.match(/^\s*(?!CREATE TABLE)(\w+ \w+(\(\d+\))?(\sAUTO_INCREMENT)?(\sPRIMARY KEY)?)\s*$/gm);
    const expectedColumns = columnDefinitions.map(def => def.trim());

    const existingColumnNames = result.map(row => row.Field.toUpperCase());

    let pendingColumnOperations = expectedColumns.length;

    expectedColumns.forEach(column => {
      const columnName = column.split(' ')[0].toUpperCase();
      if (!existingColumnNames.includes(columnName)) {
        con.query(`ALTER TABLE ${tableName} ADD COLUMN ${column}`, function(err, result) {
          if (err) throw err;
          console.log(`Column ${columnName} added to ${tableName} table`);
          columnOperationCompleted();
        });
      } else {
        columnOperationCompleted();
      }
    });

    function columnOperationCompleted() {
      pendingColumnOperations--;
      if (pendingColumnOperations === 0) {
        callback();
      }
    }
  });
}