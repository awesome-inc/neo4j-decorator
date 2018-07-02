const fs = require('fs');
const glob = require('glob');
const merge = require('deepmerge');
const yaml = require('js-yaml');

function loadYaml(pattern) {
  const fileNames = glob.sync(pattern);
  const partials = fileNames.map(fileName => _loadYaml(fileName));
  console.debug(`Loaded yml: [${fileNames}]`);
  return merge.all(partials);
}

function _loadYaml(fileName) {
  const file = _loadFile(fileName, 'utf8');
  return yaml.safeLoad(file);
}

function _loadFile(fileName, fileFormat) {
  const format = fileFormat || 'utf8';
  return fs.readFileSync(`${fileName}`, format);
}

module.exports = loadYaml;
