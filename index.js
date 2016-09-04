var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');


var todosFile = __dirname + '/todos.json';

// Create a new application.
var app = express();

// Use JSON body parser middleware.
app.use(bodyParser.json());

// Actions
app.get('/todo', function (request, response)  {
  response.sendFile(todosFile);
});

app.post('/todo', function (request, response) {

  var todo = request.body;

  if (todo.text == null || todo.text == '') {
    sendError(response, 400, 'No text specified');
  } else {

    readTodos(function (error, json) {
      if (error == null) {

        var allIds = json.todos.map(function (todo) { return todo.id; });
        var maxId = allIds.length === 0 ? 0 : Math.max.apply(Math, allIds);

        json.todos.push({
          id: maxId + 1,
          text: todo.text,
          done: false,
          createdAt: new Date()
        });

        writeTodos(json, function (error) {

          if (error == null) {
            response.json({result: 'ok'});
            response.end();
          } else {
            sendError(response, 500, 'Error writing file');
          }

        });

      } else {
        sendError(response, 500, 'Error reading file');
      }
    });

  }

});

app.delete('/todo/:id', function (request, response) {

  var id = request.params.id;

  readTodos(function (error, json) {

    if (error == null) {

      var keep = json.todos.filter(function (todo) {
        return todo.id != id;
      });

      if (keep.length === json.todos.length) {
        sendError(response, 404, "Item with ID " + id + " not found");
        return;
      }

      json.todos = keep;

      writeTodos(json, function (error) {

        if (error == null) {
          response.json({result: 'ok'});
          response.end();
        } else {
          sendError(response, 500, 'Error writing file');
        }

      });

    } else {
      sendError(response, 500, 'Error reading file');
    }

  });

});

function readTodos(callback) {
  fs.readFile(todosFile, 'utf-8', function (error, data) {
    if (error == null) {
      callback(null, JSON.parse(data));
    } else {
      callback(error);
    }
  });
}

function writeTodos(json, callback) {
  fs.writeFile(todosFile, JSON.stringify(json), callback);
}


function sendError(response, code, message) {
  response.statusCode = code;
  response.json({error: message});
  response.end();
}


// Start the server.
app.listen(8080);