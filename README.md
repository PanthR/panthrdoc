This is a simple documentation generator intended for internal use in the PanthR project.

To use: `npm install panthrdoc --save-dev` then add something like:

```
"doc": "node ./node_modules/panthrdoc/run.js ."
```

in the scripts section of your `package.json`. You can then create the documentation by running `npm run doc`.

The first time you run this, a `docs` folder will be created if it doesn't exist and populated with a `doc.css`.

The folder name is hard-coded for now.
