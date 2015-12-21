var path = require('path');
var util = require('util');
var spawn = require('win-spawn');
var fs = require('fs');
var projectDir = process.cwd();
var packageDir = path.dirname(process.argv[1]);
var jsdocPath = path.join(packageDir, './node_modules/jsdoc/jsdoc.js');
var target = path.resolve(process.argv[2]);
var docFolder = path.join(projectDir, 'docs');
var cssFile = path.join(docFolder, 'doc.css');
var jsonDoc = path.join(packageDir, 'jsdoc.json');
var baseCss = path.join(packageDir, 'template/doc.css');
var jsdocProcess;

if (!fs.existsSync(docFolder)) {
   console.log("Creating docs folder");
   fs.mkdir(docFolder);
};

function needsUpdate(that, other) {
   return !fs.existsSync(that) || (fs.statSync(that).mtime < fs.statSync(other).mtime);
}

if (needsUpdate(cssFile, baseCss)) {
   console.log("Copying over css file");
   fs.createReadStream(baseCss).pipe(fs.createWriteStream(cssFile));
};

jsdocProcess = spawn(jsdocPath, ['-c', jsonDoc, target]);

jsdocProcess.stdout.on('data', function(data) {
   console.log('stdout: ' + data);
});
jsdocProcess.stderr.on('data', function(data) {
   console.log('stderr: ' + data);
});
jsdocProcess.on('close', function(code) {
   console.log('jsdocError code:', code);
});
//    if (error) {
//       console.log("Error calling jsdoc");
//       console.log(stderr);
//    } else {
//       console.log(stdout);
//    }
// });

