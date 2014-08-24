var path = require('path');
var util = require('util');
var exec = require('child_process').execFile;
var fs = require('fs');
var projectDir = process.cwd();
var packageDir = path.dirname(process.argv[1]);
var jsdocPath = path.join(packageDir, './node_modules/jsdoc/jsdoc.js');
var target = path.resolve(process.argv[2]);
var docFolder = path.join(projectDir, 'docs');
var cssFile = path.join(docFolder, 'doc.css');
var jsonDoc = path.join(packageDir, 'jsdoc.json');
var baseCss = path.join(packageDir, 'template/doc.css');

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

exec(jsdocPath, ['-c', jsonDoc, target], function(error, stdout, stderr) {
   if (error) {
      console.log("Error calling jsdoc");
      console.log(stderr);
   } else {
      console.log(stdout);
   }
});
