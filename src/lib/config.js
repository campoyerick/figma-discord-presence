const convict = require("convict");
const fs = require("fs-extra");

const logger = require("./logger");
const util = require("./util");

const retries = 10;

const conf = convict({
  hideFilenames: {
    doc: "Mostrar ou ocultar nomes de arquivos.",
    default: false,
    format: "Boolean",
  },
  hideStatus: {
    doc: "Mostrar ou ocultar o status ativo/inativo.",
    default: false,
    format: "Boolean",
  },
  hideViewButton: {
    doc: "Mostrar ou ocultar a visualização no botão figma.",
    default: true,
    format: "Boolean",
  },
  // connectOnStartup: {
  //   doc: "Connect to Discord on application startup",
  //   default: true,
  //   format: "Boolean",
  // },
});

function save(times, init = false) {
  times = times || 0;
  const options = { spaces: 2 };

  if (init) {
    options.flag = "wx";
  }

  try {
    fs.writeJsonSync(
      util.getAppData("/config.json"),
      conf.getProperties(),
      options
    );
  } catch (err) {
    // if any other error than 'File already exists' then retry.
    if (err.code !== "EEXIST") {
      logger.error("config", err.message);
      if (times < retries) {
        setTimeout(() => {
          save(times + 1);
        }, 1000);
      }
    }
  }
  logger.debug("config", "salvo!");
}

function getAll() {
  if (conf) {
    return conf.getProperties();
  }
}

module.exports = conf;
module.exports.save = save;
module.exports.getAll = getAll;
