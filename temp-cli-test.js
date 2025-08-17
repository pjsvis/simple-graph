#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS((exports, module) => {
  var sep = __require("path").sep || "/";
  module.exports = fileUriToPath;
  function fileUriToPath(uri) {
    if (typeof uri != "string" || uri.length <= 7 || uri.substring(0, 7) != "file://") {
      throw new TypeError("must pass in a file:// URI to convert to a file path");
    }
    var rest = decodeURI(uri.substring(7));
    var firstSlash = rest.indexOf("/");
    var host = rest.substring(0, firstSlash);
    var path = rest.substring(firstSlash + 1);
    if (host == "localhost")
      host = "";
    if (host) {
      host = sep + sep + host;
    }
    path = path.replace(/^(.+)\|/, "$1:");
    if (sep == "\\") {
      path = path.replace(/\//g, "\\");
    }
    if (/^.+\:/.test(path)) {} else {
      path = sep + path;
    }
    return host + path;
  }
});

// node_modules/bindings/bindings.js
var require_bindings = __commonJS((exports, module) => {
  var __filename = "D:\\dev\\simple-graph\\node_modules\\bindings\\bindings.js";
  var fs = __require("fs");
  var path = __require("path");
  var fileURLToPath = require_file_uri_to_path();
  var join = path.join;
  var dirname = path.dirname;
  var exists = fs.accessSync && function(path2) {
    try {
      fs.accessSync(path2);
    } catch (e) {
      return false;
    }
    return true;
  } || fs.existsSync || path.existsSync;
  var defaults = {
    arrow: process.env.NODE_BINDINGS_ARROW || " → ",
    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
    platform: process.platform,
    arch: process.arch,
    nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
    version: process.versions.node,
    bindings: "bindings.node",
    try: [
      ["module_root", "build", "bindings"],
      ["module_root", "build", "Debug", "bindings"],
      ["module_root", "build", "Release", "bindings"],
      ["module_root", "out", "Debug", "bindings"],
      ["module_root", "Debug", "bindings"],
      ["module_root", "out", "Release", "bindings"],
      ["module_root", "Release", "bindings"],
      ["module_root", "build", "default", "bindings"],
      ["module_root", "compiled", "version", "platform", "arch", "bindings"],
      ["module_root", "addon-build", "release", "install-root", "bindings"],
      ["module_root", "addon-build", "debug", "install-root", "bindings"],
      ["module_root", "addon-build", "default", "install-root", "bindings"],
      ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
    ]
  };
  function bindings(opts) {
    if (typeof opts == "string") {
      opts = { bindings: opts };
    } else if (!opts) {
      opts = {};
    }
    Object.keys(defaults).map(function(i2) {
      if (!(i2 in opts))
        opts[i2] = defaults[i2];
    });
    if (!opts.module_root) {
      opts.module_root = exports.getRoot(exports.getFileName());
    }
    if (path.extname(opts.bindings) != ".node") {
      opts.bindings += ".node";
    }
    var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
    var tries = [], i = 0, l = opts.try.length, n, b, err;
    for (;i < l; i++) {
      n = join.apply(null, opts.try[i].map(function(p) {
        return opts[p] || p;
      }));
      tries.push(n);
      try {
        b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
        if (!opts.path) {
          b.path = n;
        }
        return b;
      } catch (e) {
        if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
          throw e;
        }
      }
    }
    err = new Error(`Could not locate the bindings file. Tried:
` + tries.map(function(a) {
      return opts.arrow + a;
    }).join(`
`));
    err.tries = tries;
    throw err;
  }
  module.exports = exports = bindings;
  exports.getFileName = function getFileName(calling_file) {
    var { prepareStackTrace: origPST, stackTraceLimit: origSTL } = Error, dummy = {}, fileName;
    Error.stackTraceLimit = 10;
    Error.prepareStackTrace = function(e, st) {
      for (var i = 0, l = st.length;i < l; i++) {
        fileName = st[i].getFileName();
        if (fileName !== __filename) {
          if (calling_file) {
            if (fileName !== calling_file) {
              return;
            }
          } else {
            return;
          }
        }
      }
    };
    Error.captureStackTrace(dummy);
    dummy.stack;
    Error.prepareStackTrace = origPST;
    Error.stackTraceLimit = origSTL;
    var fileSchema = "file://";
    if (fileName.indexOf(fileSchema) === 0) {
      fileName = fileURLToPath(fileName);
    }
    return fileName;
  };
  exports.getRoot = function getRoot(file) {
    var dir = dirname(file), prev;
    while (true) {
      if (dir === ".") {
        dir = process.cwd();
      }
      if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
        return dir;
      }
      if (prev === dir) {
        throw new Error('Could not find module root given file: "' + file + '". Do you have a `package.json` file? ');
      }
      prev = dir;
      dir = join(dir, "..");
    }
  };
});

// node_modules/sqlite3/lib/sqlite3-binding.js
var require_sqlite3_binding = __commonJS((exports, module) => {
  module.exports = require_bindings()("node_sqlite3.node");
});

// node_modules/sqlite3/lib/trace.js
var require_trace = __commonJS((exports) => {
  var __filename = "D:\\dev\\simple-graph\\node_modules\\sqlite3\\lib\\trace.js";
  var util = __require("util");
  function extendTrace(object, property, pos) {
    const old = object[property];
    object[property] = function() {
      const error = new Error;
      const name = object.constructor.name + "#" + property + "(" + Array.prototype.slice.call(arguments).map(function(el) {
        return util.inspect(el, false, 0);
      }).join(", ") + ")";
      if (typeof pos === "undefined")
        pos = -1;
      if (pos < 0)
        pos += arguments.length;
      const cb = arguments[pos];
      if (typeof arguments[pos] === "function") {
        arguments[pos] = function replacement() {
          const err = arguments[0];
          if (err && err.stack && !err.__augmented) {
            err.stack = filter(err).join(`
`);
            err.stack += `
--> in ` + name;
            err.stack += `
` + filter(error).slice(1).join(`
`);
            err.__augmented = true;
          }
          return cb.apply(this, arguments);
        };
      }
      return old.apply(this, arguments);
    };
  }
  exports.extendTrace = extendTrace;
  function filter(error) {
    return error.stack.split(`
`).filter(function(line) {
      return line.indexOf(__filename) < 0;
    });
  }
});

// node_modules/sqlite3/lib/sqlite3.js
var require_sqlite3 = __commonJS((exports, module) => {
  var path = __require("path");
  var sqlite3 = require_sqlite3_binding();
  var EventEmitter = __require("events").EventEmitter;
  module.exports = exports = sqlite3;
  function normalizeMethod(fn) {
    return function(sql) {
      let errBack;
      const args = Array.prototype.slice.call(arguments, 1);
      if (typeof args[args.length - 1] === "function") {
        const callback = args[args.length - 1];
        errBack = function(err) {
          if (err) {
            callback(err);
          }
        };
      }
      const statement = new Statement(this, sql, errBack);
      return fn.call(this, statement, args);
    };
  }
  function inherits(target, source) {
    for (const k in source.prototype)
      target.prototype[k] = source.prototype[k];
  }
  sqlite3.cached = {
    Database: function(file, a, b) {
      if (file === "" || file === ":memory:") {
        return new Database(file, a, b);
      }
      let db;
      file = path.resolve(file);
      if (!sqlite3.cached.objects[file]) {
        db = sqlite3.cached.objects[file] = new Database(file, a, b);
      } else {
        db = sqlite3.cached.objects[file];
        const callback = typeof a === "number" ? b : a;
        if (typeof callback === "function") {
          let cb2 = function() {
            callback.call(db, null);
          };
          var cb = cb2;
          if (db.open)
            process.nextTick(cb2);
          else
            db.once("open", cb2);
        }
      }
      return db;
    },
    objects: {}
  };
  var Database = sqlite3.Database;
  var Statement = sqlite3.Statement;
  var Backup = sqlite3.Backup;
  inherits(Database, EventEmitter);
  inherits(Statement, EventEmitter);
  inherits(Backup, EventEmitter);
  Database.prototype.prepare = normalizeMethod(function(statement, params) {
    return params.length ? statement.bind.apply(statement, params) : statement;
  });
  Database.prototype.run = normalizeMethod(function(statement, params) {
    statement.run.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.get = normalizeMethod(function(statement, params) {
    statement.get.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.all = normalizeMethod(function(statement, params) {
    statement.all.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.each = normalizeMethod(function(statement, params) {
    statement.each.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.map = normalizeMethod(function(statement, params) {
    statement.map.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.backup = function() {
    let backup;
    if (arguments.length <= 2) {
      backup = new Backup(this, arguments[0], "main", "main", true, arguments[1]);
    } else {
      backup = new Backup(this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    backup.retryErrors = [sqlite3.BUSY, sqlite3.LOCKED];
    return backup;
  };
  Statement.prototype.map = function() {
    const params = Array.prototype.slice.call(arguments);
    const callback = params.pop();
    params.push(function(err, rows) {
      if (err)
        return callback(err);
      const result = {};
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        const key = keys[0];
        if (keys.length > 2) {
          for (let i = 0;i < rows.length; i++) {
            result[rows[i][key]] = rows[i];
          }
        } else {
          const value = keys[1];
          for (let i = 0;i < rows.length; i++) {
            result[rows[i][key]] = rows[i][value];
          }
        }
      }
      callback(err, result);
    });
    return this.all.apply(this, params);
  };
  var isVerbose = false;
  var supportedEvents = ["trace", "profile", "change"];
  Database.prototype.addListener = Database.prototype.on = function(type) {
    const val = EventEmitter.prototype.addListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
      this.configure(type, true);
    }
    return val;
  };
  Database.prototype.removeListener = function(type) {
    const val = EventEmitter.prototype.removeListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0 && !this._events[type]) {
      this.configure(type, false);
    }
    return val;
  };
  Database.prototype.removeAllListeners = function(type) {
    const val = EventEmitter.prototype.removeAllListeners.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
      this.configure(type, false);
    }
    return val;
  };
  sqlite3.verbose = function() {
    if (!isVerbose) {
      const trace = require_trace();
      [
        "prepare",
        "get",
        "run",
        "all",
        "each",
        "map",
        "close",
        "exec"
      ].forEach(function(name) {
        trace.extendTrace(Database.prototype, name);
      });
      [
        "bind",
        "get",
        "run",
        "all",
        "each",
        "map",
        "reset",
        "finalize"
      ].forEach(function(name) {
        trace.extendTrace(Statement.prototype, name);
      });
      isVerbose = true;
    }
    return sqlite3;
  };
});

// src/database/connection.ts
var import_sqlite3 = __toESM(require_sqlite3(), 1);
import { promisify } from "util";
var DEFAULT_DB_CONFIG = {
  type: "memory",
  filename: ":memory:",
  readonly: false,
  timeout: 5000,
  pragmas: {
    journal_mode: "WAL",
    busy_timeout: 5000,
    synchronous: "NORMAL",
    foreign_keys: "ON"
  }
};
async function createDatabaseConnection(config = {}) {
  const finalConfig = { ...DEFAULT_DB_CONFIG, ...config };
  const dbPath = finalConfig.type === "memory" ? ":memory:" : finalConfig.filename;
  return new Promise((resolve, reject) => {
    const db = new import_sqlite3.default.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to connect to database: ${err.message}`));
        return;
      }
      db.serialize(() => {
        if (finalConfig.pragmas.journal_mode) {
          db.run(`PRAGMA journal_mode=${finalConfig.pragmas.journal_mode};`);
        }
        if (finalConfig.pragmas.busy_timeout) {
          db.run(`PRAGMA busy_timeout = ${finalConfig.pragmas.busy_timeout};`);
        }
        if (finalConfig.pragmas.synchronous) {
          db.run(`PRAGMA synchronous = ${finalConfig.pragmas.synchronous};`);
        }
        if (finalConfig.pragmas.foreign_keys) {
          db.run(`PRAGMA foreign_keys = ${finalConfig.pragmas.foreign_keys};`);
        }
      });
      const connection = {
        run: promisify(db.run.bind(db)),
        get: promisify(db.get.bind(db)),
        all: promisify(db.all.bind(db)),
        exec: promisify(db.exec.bind(db)),
        close: async () => {
          await promisify(db.close.bind(db))();
        }
      };
      resolve(connection);
    });
  });
}
async function connectToTheLoom(dbPath = "data/databases/the-loom-v2.db", readonly = false) {
  return createDatabaseConnection({
    type: "file",
    filename: dbPath,
    readonly
  });
}

// src/database/schema.ts
function createSchema() {
  return `
-- Main table for storing graph nodes
CREATE TABLE IF NOT EXISTS nodes (
    body TEXT,
    id   TEXT GENERATED ALWAYS AS (json_extract(body, '$.id')) VIRTUAL NOT NULL UNIQUE
);

-- Index on the virtual 'id' column for fast lookups
CREATE INDEX IF NOT EXISTS id_idx ON nodes(id);

-- Main table for storing graph edges
CREATE TABLE IF NOT EXISTS edges (
    source     TEXT,
    target     TEXT,
    properties TEXT,
    UNIQUE(source, target, properties) ON CONFLICT REPLACE,
    FOREIGN KEY(source) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Indexes on source and target for fast edge traversal
CREATE INDEX IF NOT EXISTS source_idx ON edges(source);
CREATE INDEX IF NOT EXISTS target_idx ON edges(target);

-- FTS5 virtual table for full-text search on the 'body' of nodes
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
    body,
    content='nodes',
    content_rowid='rowid'
);

-- Triggers to keep the FTS table synchronized with the nodes table
CREATE TRIGGER IF NOT EXISTS nodes_after_insert AFTER INSERT ON nodes BEGIN
    INSERT INTO nodes_fts(rowid, body) VALUES (new.rowid, new.body);
END;

CREATE TRIGGER IF NOT EXISTS nodes_after_delete AFTER DELETE ON nodes BEGIN
    INSERT INTO nodes_fts(nodes_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
END;

CREATE TRIGGER IF NOT EXISTS nodes_after_update AFTER UPDATE ON nodes BEGIN
    INSERT INTO nodes_fts(nodes_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
    INSERT INTO nodes_fts(rowid, body) VALUES (new.rowid, new.body);
END;

-- Insert the genesis node if it doesn't exist
INSERT INTO nodes (body)
SELECT json_object(
    'id', '0',
    'label', 'System',
    'body', 'This is the genesis node, the root of the graph.',
    'createdAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE id = '0');
`;
}

// src/database/insert-node.ts
function insertNode(nodeJson) {
  return `INSERT INTO nodes VALUES(json(?))`;
}
function insertNodeFromObject(node) {
  return insertNode(JSON.stringify(node));
}
function getInsertNodeParams(node) {
  return [JSON.stringify(node)];
}

// src/api/NodeManager.ts
class NodeManager {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  async get(id) {
    const result = await this.connection.get("SELECT body FROM nodes WHERE id = ?", [id]);
    return result ? JSON.parse(result.body) : null;
  }
  async add(node) {
    const sql = insertNodeFromObject(node);
    const params = getInsertNodeParams(node);
    return this.connection.run(sql, params);
  }
  async delete(id) {
    if (id === "0") {
      throw new Error("The genesis node cannot be deleted.");
    }
    return this.connection.run("DELETE FROM nodes WHERE id = ?", [id]);
  }
  async update(id, partialNode) {
    if ("id" in partialNode) {
      delete partialNode.id;
    }
    const updateObject = JSON.stringify(partialNode);
    return this.connection.run(`UPDATE nodes SET body = json_patch(body, ?) WHERE id = ?`, [updateObject, id]);
  }
  async find(query) {
    let conditions = [];
    let params = [];
    if (query.type) {
      conditions.push("json_extract(body, '$.type') = ?");
      params.push(query.type);
    }
    if (query.label) {
      conditions.push("json_extract(body, '$.label') LIKE ?");
      params.push(`%${query.label}%`);
    }
    if (conditions.length === 0) {
      const results2 = await this.connection.all("SELECT body FROM nodes");
      return results2.map((row) => JSON.parse(row.body));
    }
    const sql = `SELECT body FROM nodes WHERE ${conditions.join(" AND ")}`;
    const results = await this.connection.all(sql, params);
    return results.map((row) => JSON.parse(row.body));
  }
  async search(query) {
    const results = await this.connection.all(`SELECT n.body
             FROM nodes_fts fts
             JOIN nodes n ON fts.rowid = n.rowid
             WHERE fts.body MATCH ?`, [query]);
    return results.map((row) => JSON.parse(row.body));
  }
}

// src/database/insert-edge.ts
function insertEdge(source, target, propertiesJson) {
  return `INSERT INTO edges VALUES(?, ?, json(?))`;
}
function insertEdgeFromObject(edge) {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : "{}";
  return insertEdge(edge.source, edge.target, propertiesJson);
}
function getInsertEdgeParams(edge) {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : "{}";
  return [edge.source, edge.target, propertiesJson];
}

// src/api/EdgeManager.ts
class EdgeManager {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  async get(source, target) {
    const row = await this.connection.get("SELECT * FROM edges WHERE source = ? AND target = ?", [source, target]);
    if (!row)
      return null;
    return {
      source: row.source,
      target: row.target,
      properties: row.properties ? JSON.parse(row.properties) : {}
    };
  }
  async forNode(id, direction = "both") {
    let sql;
    switch (direction) {
      case "outgoing":
        sql = "SELECT * FROM edges WHERE source = ?";
        break;
      case "incoming":
        sql = "SELECT * FROM edges WHERE target = ?";
        break;
      case "both":
      default:
        sql = "SELECT * FROM edges WHERE source = ? OR target = ?";
        break;
    }
    const params = direction === "both" ? [id, id] : [id];
    const results = await this.connection.all(sql, params);
    return results.map((row) => ({
      source: row.source,
      target: row.target,
      properties: row.properties ? JSON.parse(row.properties) : {}
    }));
  }
  async add(edge) {
    const sql = insertEdgeFromObject(edge);
    const params = getInsertEdgeParams(edge);
    return this.connection.run(sql, params);
  }
  async update(source, target, properties) {
    const propertiesJson = JSON.stringify(properties);
    return this.connection.run("UPDATE edges SET properties = ? WHERE source = ? AND target = ?", [propertiesJson, source, target]);
  }
  async delete(source, target) {
    return this.connection.run("DELETE FROM edges WHERE source = ? AND target = ?", [source, target]);
  }
}

// src/api/QueryManager.ts
class QueryManager {
  connection;
  nodes;
  edges;
  constructor(connection) {
    this.connection = connection;
    this.nodes = new NodeManager(connection);
    this.edges = new EdgeManager(connection);
  }
  async raw(sql, params) {
    if (!sql.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed for raw reads.");
    }
    return this.connection.all(sql, params);
  }
  async run(sql, params) {
    return this.connection.run(sql, params);
  }
  async stats() {
    const [nodeCount, edgeCount, nodeTypes, edgeTypes] = await Promise.all([
      this.connection.get("SELECT COUNT(*) as count FROM nodes"),
      this.connection.get("SELECT COUNT(*) as count FROM edges"),
      this.connection.all("SELECT json_extract(body, '$.type') as type, COUNT(*) as count FROM nodes GROUP BY type"),
      this.connection.all("SELECT json_extract(properties, '$.type') as type, COUNT(*) as count FROM edges GROUP BY type")
    ]);
    return {
      nodeCount: nodeCount.count,
      edgeCount: edgeCount.count,
      nodeTypes: Object.fromEntries(nodeTypes.map((row) => [row.type || "unknown", row.count])),
      edgeTypes: Object.fromEntries(edgeTypes.map((row) => [row.type || "unknown", row.count]))
    };
  }
  async traverse(options) {
    const { startNodeId, maxDepth = 3, direction = "outgoing" } = options;
    const visited = new Set;
    const result = [];
    const traverse = async (nodeId, depth) => {
      if (depth > maxDepth || visited.has(nodeId))
        return;
      visited.add(nodeId);
      const node = await this.nodes.get(nodeId);
      if (node)
        result.push(node);
      const edges = await this.edges.forNode(nodeId, direction);
      for (const edge of edges) {
        const nextNodeId = direction === "incoming" ? edge.source : edge.target;
        if (!visited.has(nextNodeId)) {
          await traverse(nextNodeId, depth + 1);
        }
      }
    };
    await traverse(startNodeId, 0);
    return result;
  }
}

// src/visualization/mind-map-generator.ts
async function generateMindMap(startNodeId, depth, dbConnection) {
  const db = dbConnection || await connectToTheLoom();
  const nodes = [];
  const edges = [];
  const visited = new Set;
  const queue = [[startNodeId, 0]];
  visited.add(startNodeId);
  while (queue.length > 0) {
    const [currentId, currentDepth] = queue.shift();
    const node = await db.get("SELECT * FROM nodes WHERE id = ?", [currentId]);
    if (node) {
      nodes.push(node);
    }
    if (currentDepth < depth) {
      const connectedEdges = await db.all("SELECT * FROM edges WHERE source = ?", [currentId]);
      for (const edge of connectedEdges) {
        edges.push(edge);
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push([edge.target, currentDepth + 1]);
        }
      }
    }
  }
  let dot = `digraph G {
`;
  dot += `  rankdir="LR";
`;
  dot += `  layout="twopi";
`;
  dot += `  node [shape="box", style="rounded,filled"];
`;
  for (const node of nodes) {
    const parsedBody = JSON.parse(node.body);
    dot += `  "${node.id}" [label="${parsedBody.label}"];
`;
  }
  for (const edge of edges) {
    dot += `  "${edge.source}" -> "${edge.target}";
`;
  }
  dot += "}";
  if (!dbConnection) {
    await db.close();
  }
  return dot;
}

// src/visualization/renderers/graphviz-renderer.ts
import { exec } from "child_process";
import { promisify as promisify2 } from "util";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
var execAsync = promisify2(exec);
async function isGraphvizInstalled() {
  try {
    await execAsync("dot -V");
    return true;
  } catch (error) {
    console.error("Graphviz not found. Please install it to render graphs.");
    return false;
  }
}
async function renderDotToImage(dotString, format, outputPath) {
  const tempDotFile = join(tmpdir(), `simple-graph-temp-${Date.now()}.dot`);
  try {
    writeFileSync(tempDotFile, dotString, "utf-8");
    const command = `dot -T${format} -o "${outputPath}" "${tempDotFile}"`;
    const { stderr } = await execAsync(command);
    if (stderr) {
      throw new Error(`Graphviz stderr: ${stderr}`);
    }
  } finally {
    if (existsSync(tempDotFile)) {
      unlinkSync(tempDotFile);
    }
  }
}

// src/visualization/dot-generator.ts
var DEFAULT_DOT_CONFIG = {
  layout: "dot",
  rankdir: "TB",
  includeNodeTypes: ["directive", "cda", "oh_term"],
  includeEdgeTypes: ["references", "semantic_similarity", "category_bridge", "shared_inspiration"],
  maxEdges: 200,
  nodeColors: {
    directive: "#E3F2FD",
    cda: "#FFF3E0",
    oh_term: "#F3E5F5",
    core_concept: "#E8F5E8"
  },
  edgeColors: {
    references: "#1976D2",
    semantic_similarity: "#388E3C",
    category_bridge: "#F57C00",
    shared_inspiration: "#7B1FA2",
    keyword_similarity: "#5D4037",
    belongs_to_cda: "#757575"
  },
  nodeShapes: {
    directive: "box",
    cda: "ellipse",
    oh_term: "diamond",
    core_concept: "hexagon"
  },
  edgeStyles: {
    references: "solid",
    semantic_similarity: "dashed",
    category_bridge: "bold",
    shared_inspiration: "dotted"
  },
  showNodeLabels: true,
  showEdgeLabels: false,
  maxLabelLength: 30,
  clusterByCategory: true,
  fontSize: 10,
  dpi: 300
};

class DotGraphGenerator {
  db;
  constructor(db) {
    this.db = db;
  }
  async generateDot(config = {}) {
    const finalConfig = { ...DEFAULT_DOT_CONFIG, ...config };
    const nodes = await this.extractNodes(finalConfig);
    const edges = await this.extractEdges(finalConfig);
    return this.buildDotGraph(nodes, edges, finalConfig);
  }
  async extractNodes(config) {
    let whereConditions = [];
    let params = [];
    if (config.includeNodeTypes && config.includeNodeTypes.length > 0) {
      const placeholders = config.includeNodeTypes.map(() => "?").join(",");
      whereConditions.push(`json_extract(body, '$.node_type') IN (${placeholders})`);
      params.push(...config.includeNodeTypes);
    }
    if (config.excludeNodeTypes && config.excludeNodeTypes.length > 0) {
      const placeholders = config.excludeNodeTypes.map(() => "?").join(",");
      whereConditions.push(`json_extract(body, '$.node_type') NOT IN (${placeholders})`);
      params.push(...config.excludeNodeTypes);
    }
    if (config.includeCategories && config.includeCategories.length > 0) {
      const placeholders = config.includeCategories.map(() => "?").join(",");
      whereConditions.push(`json_extract(body, '$.category') IN (${placeholders})`);
      params.push(...config.includeCategories);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const query = `
      SELECT 
        id,
        json_extract(body, '$.node_type') as node_type,
        json_extract(body, '$.directive_id') as directive_id,
        json_extract(body, '$.title') as title,
        json_extract(body, '$.term') as term,
        json_extract(body, '$.concept_name') as concept_name,
        json_extract(body, '$.category') as category,
        json_extract(body, '$.description') as description,
        json_extract(body, '$.definition') as definition
      FROM nodes 
      ${whereClause}
      ORDER BY node_type, category, id
    `;
    const rows = await this.db.all(query, ...params);
    if (!Array.isArray(rows)) {
      console.warn("Database query returned non-array result:", rows);
      return [];
    }
    return rows.map((row) => this.createDotNode(row, config));
  }
  createDotNode(row, config) {
    const nodeType = row.node_type;
    let label = "";
    if (nodeType === "directive") {
      label = row.directive_id || row.id;
      if (config.showNodeLabels && row.title) {
        label += `\\n${this.truncateText(row.title, config.maxLabelLength)}`;
      }
    } else if (nodeType === "cda") {
      label = row.title || "CDA";
    } else if (nodeType === "oh_term") {
      label = row.term || row.id;
    } else if (nodeType === "core_concept") {
      label = row.concept_name || row.id;
    } else {
      label = row.id;
    }
    let tooltip = `Type: ${nodeType}`;
    if (row.category)
      tooltip += `\\nCategory: ${row.category}`;
    if (row.description)
      tooltip += `\\nDescription: ${this.truncateText(row.description, 100)}`;
    if (row.definition)
      tooltip += `\\nDefinition: ${this.truncateText(row.definition, 100)}`;
    return {
      id: this.sanitizeId(row.id),
      label: this.escapeLabel(label),
      nodeType,
      category: row.category,
      color: config.nodeColors?.[nodeType],
      shape: config.nodeShapes?.[nodeType],
      tooltip: this.escapeLabel(tooltip)
    };
  }
  async extractEdges(config) {
    let whereConditions = [];
    let params = [];
    if (config.includeEdgeTypes && config.includeEdgeTypes.length > 0) {
      const placeholders = config.includeEdgeTypes.map(() => "?").join(",");
      whereConditions.push(`json_extract(properties, '$.type') IN (${placeholders})`);
      params.push(...config.includeEdgeTypes);
    }
    if (config.excludeEdgeTypes && config.excludeEdgeTypes.length > 0) {
      const placeholders = config.excludeEdgeTypes.map(() => "?").join(",");
      whereConditions.push(`json_extract(properties, '$.type') NOT IN (${placeholders})`);
      params.push(...config.excludeEdgeTypes);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const limitClause = config.maxEdges ? `LIMIT ${config.maxEdges}` : "";
    const query = `
      SELECT 
        source,
        target,
        json_extract(properties, '$.type') as edge_type,
        json_extract(properties, '$.context') as context
      FROM edges 
      ${whereClause}
      ORDER BY edge_type, source, target
      ${limitClause}
    `;
    const rows = await this.db.all(query, ...params);
    if (!Array.isArray(rows)) {
      console.warn("Database query returned non-array result for edges:", rows);
      return [];
    }
    return rows.map((row) => this.createDotEdge(row, config));
  }
  createDotEdge(row, config) {
    const edgeType = row.edge_type;
    let label = "";
    if (config.showEdgeLabels) {
      label = edgeType;
      if (row.context) {
        label += `\\n${this.truncateText(row.context, config.maxLabelLength)}`;
      }
    }
    let tooltip = `Type: ${edgeType}`;
    if (row.context)
      tooltip += `\\nContext: ${this.truncateText(row.context, 100)}`;
    return {
      source: this.sanitizeId(row.source),
      target: this.sanitizeId(row.target),
      label: config.showEdgeLabels ? this.escapeLabel(label) : undefined,
      type: edgeType,
      color: config.edgeColors?.[edgeType],
      style: config.edgeStyles?.[edgeType],
      tooltip: this.escapeLabel(tooltip)
    };
  }
  buildDotGraph(nodes, edges, config) {
    const lines = [];
    lines.push("digraph KnowledgeGraph {");
    lines.push(`  layout="${config.layout}"`);
    lines.push(`  rankdir="${config.rankdir}"`);
    lines.push(`  dpi=${config.dpi}`);
    lines.push(`  fontsize=${config.fontSize}`);
    lines.push('  node [fontname="Arial"]');
    lines.push('  edge [fontname="Arial"]');
    if (config.title) {
      lines.push(`  labelloc="t"`);
      lines.push(`  label="${this.escapeLabel(config.title)}"`);
    }
    lines.push("");
    if (config.clusterByCategory) {
      this.addCategoryClusters(lines, nodes, config);
    } else if (config.clusterByNodeType) {
      this.addNodeTypeClusters(lines, nodes, config);
    } else {
      this.addNodes(lines, nodes);
    }
    lines.push("");
    this.addEdges(lines, edges);
    lines.push("}");
    return lines.join(`
`);
  }
  addCategoryClusters(lines, nodes, config) {
    const nodesByCategory = new Map;
    for (const node of nodes) {
      const category = node.category || "Uncategorized";
      if (!nodesByCategory.has(category)) {
        nodesByCategory.set(category, []);
      }
      nodesByCategory.get(category).push(node);
    }
    let clusterIndex = 0;
    for (const [category, categoryNodes] of nodesByCategory) {
      lines.push(`  subgraph cluster_${clusterIndex} {`);
      lines.push(`    label="${this.escapeLabel(category)}"`);
      lines.push("    style=filled");
      lines.push("    fillcolor=lightgrey");
      lines.push("");
      for (const node of categoryNodes) {
        lines.push(this.formatNode(node));
      }
      lines.push("  }");
      lines.push("");
      clusterIndex++;
    }
  }
  addNodeTypeClusters(lines, nodes, config) {
    const nodesByType = new Map;
    for (const node of nodes) {
      if (!nodesByType.has(node.nodeType)) {
        nodesByType.set(node.nodeType, []);
      }
      nodesByType.get(node.nodeType).push(node);
    }
    let clusterIndex = 0;
    for (const [nodeType, typeNodes] of nodesByType) {
      lines.push(`  subgraph cluster_${clusterIndex} {`);
      lines.push(`    label="${this.escapeLabel(nodeType.toUpperCase())}"`);
      lines.push("    style=filled");
      lines.push("    fillcolor=lightblue");
      lines.push("");
      for (const node of typeNodes) {
        lines.push(this.formatNode(node));
      }
      lines.push("  }");
      lines.push("");
      clusterIndex++;
    }
  }
  addNodes(lines, nodes) {
    lines.push("  // Nodes");
    for (const node of nodes) {
      lines.push(this.formatNode(node));
    }
  }
  formatNode(node) {
    const attributes = [];
    attributes.push(`label="${node.label}"`);
    if (node.color)
      attributes.push(`fillcolor="${node.color}"`);
    if (node.shape)
      attributes.push(`shape="${node.shape}"`);
    if (node.tooltip)
      attributes.push(`tooltip="${node.tooltip}"`);
    attributes.push("style=filled");
    return `    ${node.id} [${attributes.join(", ")}]`;
  }
  addEdges(lines, edges) {
    lines.push("  // Edges");
    for (const edge of edges) {
      lines.push(this.formatEdge(edge));
    }
  }
  formatEdge(edge) {
    const attributes = [];
    if (edge.label)
      attributes.push(`label="${edge.label}"`);
    if (edge.color)
      attributes.push(`color="${edge.color}"`);
    if (edge.style)
      attributes.push(`style="${edge.style}"`);
    if (edge.tooltip)
      attributes.push(`tooltip="${edge.tooltip}"`);
    const attrString = attributes.length > 0 ? ` [${attributes.join(", ")}]` : "";
    return `    ${edge.source} -> ${edge.target}${attrString}`;
  }
  sanitizeId(id) {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  escapeLabel(text) {
    return text.replace(/"/g, "\\\"").replace(/\n/g, "\\n");
  }
  truncateText(text, maxLength) {
    if (!maxLength || text.length <= maxLength)
      return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}

// src/visualization/canned-graphs.ts
var GRAPH_RECIPES = {
  complete: {
    title: "Complete CDA Knowledge Graph",
    layout: "dot",
    clusterByCategory: true,
    maxEdges: 100,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  "directives-only": {
    title: "Core Directives Network",
    includeNodeTypes: ["directive"],
    includeEdgeTypes: ["references", "semantic_similarity", "category_bridge"],
    layout: "neato",
    clusterByCategory: true,
    showNodeLabels: true,
    maxLabelLength: 20
  },
  "relationships-network": {
    title: "Directive Relationships Network",
    includeNodeTypes: ["directive"],
    includeEdgeTypes: ["semantic_similarity", "shared_inspiration", "keyword_similarity"],
    layout: "fdp",
    clusterByNodeType: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 15,
    edgeColors: {
      semantic_similarity: "#4CAF50",
      shared_inspiration: "#9C27B0",
      keyword_similarity: "#FF9800"
    }
  },
  "category-adv": {
    title: "ADV Category Network",
    includeCategories: ["ADV"],
    includeNodeTypes: ["directive"],
    layout: "circo",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { directive: "#FFCDD2" }
  },
  "category-cog": {
    title: "COG Category Network",
    includeCategories: ["COG"],
    includeNodeTypes: ["directive"],
    layout: "circo",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { directive: "#C8E6C9" }
  },
  "category-phi": {
    title: "PHI Category Network",
    includeCategories: ["PHI"],
    includeNodeTypes: ["directive"],
    layout: "circo",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { directive: "#DCEDC8" }
  },
  "category-qpg": {
    title: "QPG Category Network",
    includeCategories: ["QPG"],
    includeNodeTypes: ["directive"],
    layout: "circo",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { directive: "#FFE0B2" }
  },
  "category-opm": {
    title: "OPM Category Network",
    includeCategories: ["OPM"],
    includeNodeTypes: ["directive"],
    layout: "circo",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: true,
    maxLabelLength: 25,
    nodeColors: { directive: "#E1BEE7" }
  },
  "cross-category-bridges": {
    title: "Cross-Category Bridges",
    includeNodeTypes: ["directive"],
    includeEdgeTypes: ["category_bridge"],
    layout: "dot",
    rankdir: "LR",
    clusterByCategory: true,
    showNodeLabels: true,
    showEdgeLabels: true,
    edgeColors: { category_bridge: "#FF5722" },
    edgeStyles: { category_bridge: "bold" }
  },
  "inspirational-clusters": {
    title: "Inspirational Source Networks",
    includeNodeTypes: ["directive"],
    includeEdgeTypes: ["shared_inspiration"],
    layout: "neato",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    nodeColors: { directive: "#F3E5F5" },
    edgeColors: { shared_inspiration: "#9C27B0" },
    edgeStyles: { shared_inspiration: "dotted" }
  },
  "semantic-similarity": {
    title: "Semantic Similarity Network",
    includeNodeTypes: ["directive"],
    includeEdgeTypes: ["semantic_similarity", "keyword_similarity"],
    layout: "sfdp",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    nodeColors: { directive: "#E8F5E8" },
    edgeColors: {
      semantic_similarity: "#4CAF50",
      keyword_similarity: "#8BC34A"
    },
    edgeStyles: {
      semantic_similarity: "dashed",
      keyword_similarity: "solid"
    }
  },
  "hub-authority": {
    title: "Hub and Authority Nodes",
    includeNodeTypes: ["directive"],
    layout: "dot",
    clusterByCategory: false,
    showNodeLabels: true,
    showEdgeLabels: false,
    maxEdges: 50
  },
  "layout-hierarchical": {
    title: "Layout: Hierarchical top-down",
    layout: "dot",
    includeNodeTypes: ["directive"],
    includeCategories: ["ADV", "COG", "PHI"],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  "layout-force-directed": {
    title: "Layout: Force-directed spring model",
    layout: "neato",
    includeNodeTypes: ["directive"],
    includeCategories: ["ADV", "COG", "PHI"],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  "layout-spring-model": {
    title: "Layout: Spring model for large graphs",
    layout: "fdp",
    includeNodeTypes: ["directive"],
    includeCategories: ["ADV", "COG", "PHI"],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  "layout-circular": {
    title: "Layout: Circular layout",
    layout: "circo",
    includeNodeTypes: ["directive"],
    includeCategories: ["ADV", "COG", "PHI"],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  },
  "layout-radial": {
    title: "Layout: Radial layout",
    layout: "twopi",
    includeNodeTypes: ["directive"],
    includeCategories: ["ADV", "COG", "PHI"],
    maxEdges: 30,
    showNodeLabels: true,
    showEdgeLabels: false
  }
};

// src/api/VisualizationManager.ts
class VisualizationManager {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  async mindMap(options) {
    return generateMindMap(options.startNodeId, options.depth, this.connection);
  }
  async cannedGraph(type) {
    const config = GRAPH_RECIPES[type];
    if (!config) {
      throw new Error(`Invalid graph type: ${type}`);
    }
    const generator = new DotGraphGenerator(this.connection);
    const dotContent = await generator.generateDot(config);
    return dotContent;
  }
  async render(dot, options) {
    if (!await isGraphvizInstalled()) {
      throw new Error("Graphviz is not installed. Please install it to render graphs.");
    }
    return renderDotToImage(dot, options.format, options.path);
  }
}

// src/SimpleGraph.ts
class SimpleGraph {
  connection;
  nodes;
  edges;
  query;
  visualize;
  constructor(connection) {
    this.connection = connection;
    this.nodes = new NodeManager(connection);
    this.edges = new EdgeManager(connection);
    this.query = new QueryManager(connection);
    this.visualize = new VisualizationManager(connection);
  }
  static async connect(options = {}) {
    const dbConnection = await createDatabaseConnection({
      type: options.path ? "file" : "memory",
      filename: options.path
    });
    await dbConnection.exec(createSchema());
    return new SimpleGraph(dbConnection);
  }
  async close() {
    await this.connection.close();
  }
}

// src/cli.ts
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const id = args[1];
  const query = args[1];
  let graph;
  try {
    const dbPath = process.env.SIMPLE_GRAPH_DB_PATH || "cda-import-test.db";
    graph = await SimpleGraph.connect({ path: dbPath });
    switch (command) {
      case "getNode":
        if (id === undefined) {
          console.error("Error: getNode requires an ID.");
          process.exit(1);
        }
        const nodeResult = await graph.nodes.get(id);
        console.log(JSON.stringify(nodeResult, null, 2));
        break;
      case "find":
        if (query === undefined) {
          console.error("Error: find requires a query string.");
          process.exit(1);
        }
        const findResult = await graph.nodes.search(query);
        console.log(JSON.stringify(findResult, null, 2));
        break;
      case "forNode":
        if (id === undefined) {
          console.error("Error: forNode requires an ID.");
          process.exit(1);
        }
        const edgeResult = await graph.edges.forNode(id);
        console.log(JSON.stringify(edgeResult, null, 2));
        break;
      default:
        console.error(`Error: Unknown command '${command}'.`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (graph) {
      await graph.close();
    }
  }
}
main();
