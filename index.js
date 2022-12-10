const express = require("express");
const { open } = require("sqlite");
const sqlite = require("sqlite3");
const hogan = require("hogan.js");

const app = express();
app.use((req, res, next) => {
  res.setHeader("connection", "close");
  next();
});
app.use(express.urlencoded({ extended: true }));

const loadDb = () => {
  return open({
    driver: sqlite.Database,
    filename: "./data.sqlite",
  });
};

const defaults = {
  name: "*",
};

const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];

const merge = (currentobj, newobj) => {
  for (let key of Object.keys(newobj)) {
    if (UNSAFE_KEYS.includes(key)) continue;
    const val = newobj[key];
    key = key.trim();
    if (typeof currentobj[key] !== "undefined" && typeof val === "object") {
      currentobj[key] = merge(currentobj[key], val);
    } else {
      currentobj[key] = val;
    }
  }

  return currentobj;
};

const TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="../../favicon.ico">

    <title>SEC Playground - Your security playground</title>

    <!-- Bootstrap core CSS -->
    <link href="dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <!-- <link href="jumbotron.css" rel="stylesheet"> -->
  </head>

  <body>

    <nav class="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
      <a class="navbar-brand" href="#">SEC Playground - Your security playground</a>
      <div class="collapse navbar-collapse" id="navbarsExampleDefault">
      </div>
    </nav>

    <!-- Main jumbotron for a primary marketing message or call to action -->
    <div class="jumbotron">
      <div class="container">
      <!-- Search bar -->
      <div class="form-container">
      	      <br>
              <form class="form" method="post">
	          <label>Filter: <br></label>
                  <input id="search" type="text" name="name" class="input" placeholder="Name..."/>
                  <input id="search" type="text" name="house" class="input" placeholder="House..."/>
                  <button id="clear" class="clear-results">submit</button>
              </form>
      	      <br>
    </div>
      <!-- Search bar -->
      <!-- Tables -->
<table border="1">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>House</th>
    </tr>
  </thead>
  <tbody>
  {{#data}}
    <tr>
      <td>{{ID}}</td>
      <td>{{name}}</td>
      <td>{{house}}</td>
    </tr>
  {{/data}}
  {{^data}}
    Nothing found
  {{/data}}
  </tbody>
</table>
     <!-- Tables -->
     </div>
    </div>
    <!-- -->
    <div class="container">
      <div class="row">
      </div>
      <hr>

      <footer>
        <p>&copy; SEC Playground Company 2022</p>
      </footer>
    </div> <!-- /container -->
    ================================================== -->
  </body>
</html>
`;

//app.get('/', (req, res) => {
app.get('/', async (req, res) => {
  const db = await loadDb();

  const template = hogan.compile(TEMPLATE);

  const conditions = [];
  const params = [];
  const query = `SELECT * FROM data ${
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  }`;
  const data = await db.all(query, params);
  try {
    return res.send(template.render({ data }));
  } catch (ex) {
  } finally {
    await db.close();
  }
  const f = `return ${template}`;
  try {
    res.json({ error: Function(f)() });
  } catch (ex) {
    res.json({ error: ex + "" });
  }
});

app.post("/", async (req, res) => {
  const db = await loadDb();
  const filtering_keyword = req.body;
  const filter = {};
  merge(filter, defaults);
  merge(filter, filtering_keyword);

  const template = hogan.compile(TEMPLATE);

  const conditions = [];
  const params = [];
  if (filter.name && filter.name !== "*") {
    conditions.push(`name LIKE '%' || ? || '%'`);
    params.push(filter.name);
  }

  if (filter.year) {
    conditions.push("(house = ?)");
    params.push(filter.house);
  }

  const query = `SELECT * FROM data ${
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  }`;
  const data = await db.all(query, params);
  try {
    return res.send(template.render({ data }));
  } catch (ex) {
  } finally {
    await db.close();
  }
  const f = `return ${template}`;
  try {
    res.json({ error: Function(f)() });
  } catch (ex) {
    res.json({ error: ex + "" });
  }
});

app.listen(80, () => {
  console.log(`Listening on http://localhost:80`);
});
