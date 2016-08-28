var fs = require("fs");

var indexFileName       = "index.html";
var srcDir              = "src/";
var publishDir          = "bin/";
var scriptFilename      = "script.js";
var scriptDir           = "js/";
var regexScriptSection  = /<!-- JS:LIB:BEGIN -->([\s\S]*?)<!-- JS:LIB:END -->/;
var excludeFiles        = [ ".gitignore", ".git", "bin", "test", ".settings", "build",
                            ".project", "README.md", "*psd", "*.psd", "*libs" ];
var indexFile           = fs.readFileSync(srcDir + indexFileName, "utf8");

// find the scripts in index.html
function extractScriptNames() {
  console.log("Extracting script file names from index.html");

  var regexScriptName = /<script src="(.*?)"><\/script>/g;
  var scriptSection = regexScriptSection.exec(indexFile)[1];

  // extract script names
  var names = []; 
  var match;
  while ((match = regexScriptName.exec(scriptSection)) != null) {
    var script = match[1];
    names.push(script);
  }
    
  return names;
}

// run all scripts through uglifyJS and write to new dest
function minifyScripts(scriptNames) {
  console.log("Minifying and concatting scripts.");

  var jsp = require("uglify-js").parser;
  var pro = require("uglify-js").uglify;

  var regexMinifed = /min.js$/;
  var regexCopyright = /^\/\*![\s\S]*?\*\//m;
    var buffer = [];
  scriptNames.forEach(function(script) {
    var scriptFile = fs.readFileSync(srcDir + script, "utf8");
    var copyright = regexCopyright.exec(scriptFile);
    if (copyright) {
      buffer.push(copyright);
    }

    // check if file is already minified
    if (!regexMinifed.test(script)) {
      var ast = jsp.parse(scriptFile);
      ast = pro.ast_mangle(ast);
      ast = pro.ast_squeeze(ast);
      scriptFile = pro.gen_code(ast);
    } else {
      console.log("> Skipping: " + script + " is already minified.");
    }

    buffer.push(scriptFile + ";");
  });

  var combined = buffer.join("\n");
  fs.writeFileSync(publishDir + scriptDir + scriptFilename, combined);
  console.log("Combined all scripts into " + scriptFilename);
}

desc("Build project");
task("build", function() {
  // Clean old build directory
  if (fs.existsSync(publishDir)) {
    console.log("Deleting old bin directory");
    jake.rmRf(publishDir);
  }

  // create new publish dir
  console.log("Creating new bin directory");
  jake.mkdirP(publishDir + scriptDir);

  // minify js
  var scriptNames = extractScriptNames();
  minifyScripts(scriptNames);

  // insert minified js into index.html
  console.log("Replacing script files with minified version in index.html");
  indexFile = indexFile.replace(regexScriptSection, '<script src="js/'
  + scriptFilename + '"></script>');

  // remove debug statements
  console.log("Removing IF DEBUG statements in index.html");
  var regexDebug = /<!-- DEBUG -->[\s\S]*?<!-- \/DEBUG -->/gmi;
  indexFile = indexFile.replace(regexDebug, "");

  // insert production statements
  var regexProduction = /<!-- PRODUCTION([\s\S]*?)\/PRODUCTION -->/gmi;
  indexFile = indexFile.replace(regexProduction, "$1");

  // copy index file
  console.log("Copying index.html to /bin");
  fs.writeFileSync(publishDir + indexFileName, indexFile);

  // copy other files
  console.log("Copying all other files into /bin");
  function createExludeRegex() {
    // exclude files that get optimization treatment
    excludeFiles.push(indexFileName);
    excludeFiles.push.apply(excludeFiles, scriptNames);

    // convert wildcard notation to proper regex
    // *foo.jpg becomes ^.*foo\.jpg$
    excludeFiles = excludeFiles.map(function(file) {
      file = file.replace(/\./g, "\\.").replace("*", ".*", "g");
      file = "^" + file + "$";
      return file;
    });

    return new RegExp(excludeFiles.join("|"));
  }

  var regexExcludeFiles = createExludeRegex();
  copyFiles("");

  /**
  * Recursively copies all files that dont match the exclude filter from the
  * base directory to the publish directory.
  */
  function copyFiles(dir) {
    var files = fs.readdirSync(srcDir + dir);
    files.forEach(function(file) {
      var currentDir = dir + file;
      if (!regexExcludeFiles.test(currentDir)) {
        var stats = fs.statSync(srcDir + currentDir);
        if (stats.isDirectory()) {
          if (!fs.existsSync(publishDir + currentDir)) {
            fs.mkdirSync(publishDir + currentDir);
          }
          copyFiles(currentDir + "/");
        } else if (stats.isFile()) {
          var contents = fs.readFileSync(srcDir + currentDir);
          fs.writeFileSync(publishDir + currentDir, contents);
        }
      }
    });
  }

  // update manifest, put new timestamp
  var fileDir = publishDir + "cache.appcache";
  var contents = fs.readFileSync(fileDir, "utf8");
  contents = contents.replace("{{timestamp}}", Date.now());
  fs.writeFileSync(fileDir, contents);

  console.log("Project built.");
});

desc("default");
task("default", [ "build" ], function() {
  // build on default
});

desc("Deploy project to github pages");
task("deploy", [ "build" ], function() {
  console.log("Deploying project to github pages");
  var exec = require('child_process').exec;
  /**
  * The command copies all files from /bin into github pages repo, commits
  * and pushes the changes.
  */
  var command = "cp -r bin/* ../drichard.github.com/mindmaps/; "
  + "cd ../drichard.github.com/mindmaps/; " + "git add .; "
  + "git commit -a -m 'deploy mindmaps'; " + "git push;";
  exec(command, function(error, stdout, stderr) {

    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
      console.log("Deployed all files successfully");
      console.log("STDOUT:\n" + stdout);
    }

    if (stderr) {
      console.log("STDERR: " + stderr);
    }
  });
});

desc("Generate JSDoc");
task("generate-docs", function() {
  console.log("Creating project documentation");
  var exec = require('child_process').exec;
  var command = "docs/generate.sh";
  exec(command, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
      console.log("STDOUT:\n" + stdout);
      console.log("Created documentation");
    }

    if (stderr) {
      console.log("STDERR: " + stderr);
    }
  });
});

desc("Increase version");
task("increase-version", function(version) {
  if (!version) fail("No version given");

  console.log("Increasing version to", version)
  // TODO write script that increases version in mindmaps.js, package.json, 
  // creates a git tag, commits all changes and pushes to master
});

desc("Start dev server");
task("server", function() {
  jake.exec("node server.js", {printStdout: true, printStderr: true});
});

desc("Start dev server with production files");
task("server-prod", ["build"], function() {
  jake.exec("node server.js --production", {printStdout: true, printStderr: true});
});
