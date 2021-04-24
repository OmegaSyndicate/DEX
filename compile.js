const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const contractPath = path.resolve(__dirname, "contracts");
const fileNames = fs.readdirSync(contractPath);

const compilerInput = {
  language: "Solidity",
  sources: fileNames.reduce((input, fileName) => {
    const filePath = path.resolve(contractPath, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    return { ...input, [fileName]: { content: source } };
  }, {}),
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

// Compile All contracts
const compiled = JSON.parse(solc.compile(JSON.stringify(compilerInput)));

fs.ensureDirSync(buildPath);

fileNames.map((fileName) => {
  const contracts = Object.keys(compiled.contracts[fileName]);
  contracts.map((contract) => {
    fs.outputJsonSync(
      path.resolve(buildPath, contract + ".json"),
      compiled.contracts[fileName][contract]
    );
  });
});
