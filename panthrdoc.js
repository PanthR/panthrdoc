var docEntries = {};
exports.handlers = {
   parseBegin: function(e) {
      var ourFiles = reorderFiles(e.sourcefiles.filter(function(name) {
         return /\/panthrBase.js|\/base\//.test(name);
      }));
      while(e.sourcefiles.length > 0) { e.sourcefiles.pop(); }
      ourFiles.forEach(function(s) { e.sourcefiles.push(s); });
      return e;
   },
   beforeParse: function(e) {
      e.source = e.source.replace(/(\/\*\*(?:.|\n)*?)\*\/\s*\n(.*)$/mg, function(s, comment, code) {
         var commentTags = processTags(comment);
         var procCode = processCode(code);
         return comment + '\n' + addTags(commentTags, procCode) + ' */\n' + code;
      });
   }
};

exports.defineTags = function(dictionary) {
   dictionary.defineTag('fullName', {
      onTagged: function(doclet, tag) { doclet.fullName = tag.value; }
   });
}

function reorderFiles(arr) {
   return arr.sort(function(a, b) {
     function strip(s) { return s.replace(/\.js$/, ''); }
     a = strip(a); b = strip(b);
     if (a.indexOf(b) === 0) { return 1; }
     if (b.indexOf(a) === 0) { return -1; }
     return a < b ? -1 : 1;
   });
}

function processTags(s) {
   var tags = {};
   matches = s.match(/^\s*\*\s*@(\w+)\s*(.*)$/gm);
   (matches || []).forEach(function(match) {
      match = match.match(/@(\w+)\s*(.*)$/);
      tags[match[1]] = match[2];
   });
   return tags;
}

function processCode(s) {
   var constr = /^\s*function\s+(\w+)(\(.*\))/;
   var method = /^\s*([\w\.]+)\s*\=\s*function\s*(?:\w*)(\([^\)]*\))/;
   var member = /^\s*([\w\.]+)\s*\=/;
   var loader = /^\s*loader\.add(Class|Instance|Module)Method\(\'([\w\.]+)\'\,\s*\'(\w+)\'\,\s*function\s*\w*(\([^\)]*\))/;
   var match;
   if (constr.test(s)) {
      match = s.match(constr);
      return { type: 'class', name: match[1], fullName: match[1] + match[2], static: true };
   } else if (method.test(s)) {
      match = s.match(method);
      return {
         type: 'method',
         name: match[1].match(/\w+$/)[0],
         fullName: match[1] + match[2],
         isStatic: isStatic(match[1])
      }
   } else if (member.test(s)) {
      match = s.match(member);
      return {
         type: 'member',
         name: match[1].match(/\w+$/)[0],
         fullName: match[1],
         isStatic: isStatic(match[1])
      }
   } else if (loader.test(s)) {
      match = s.match(loader);
      return {
         type: 'method',
         name: match[3],
         fullName: match[2] + '.' + match[3] + match[4],
         isStatic: !(match[1] === 'Instance')
      }
   }
   return undefined;
}

function addTags(existing, newValues) {
   if (newValues == null) { return ''; }
   var typeTags = ['class', 'module', 'method', 'member', 'function', 'func', 'kind'];
   var scopeTags = ['static', 'inner', 'instance', 'global'];
   var result = addTag('fullName', newValues.fullName);
   if (!hasAny(existing, typeTags)) { result += addTag(newValues.type, newValues.name); }
   if (!hasAny(existing, scopeTags)) { result += addTag(newValues.isStatic ? 'static' : 'instance', null); }
   return result;
}

function hasAny(obj, tags) {
   for (var i = 0; i < tags.length; i += 1) {
      if (obj.hasOwnProperty(tags[i])) { return true; }
   }
   return false;
}

function addTag(tag, value) {
   return '   * @' + tag + ' ' + ((value == null) ? '' : value) + '\n';
}

function isStatic(s) {
   return !(/(\.prototype|this)\./.test(s));
}
