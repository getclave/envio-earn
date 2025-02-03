const fs = require("fs");
const path = require("path");

const registerHandlersPath = path.join(__dirname, "generated/src/RegisterHandlers.bs.js");

let content = fs.readFileSync(registerHandlersPath, "utf8");

// Replace the require path
content = content.replace(
  /require\("root\/" \+ handlerPathRelativeToRoot\)/g,
  'require("../../" + handlerPathRelativeToRoot)'
);

fs.writeFileSync(registerHandlersPath, content);

console.log("Fixed paths in RegisterHandlers.bs.js");
