const EventEmitter = require("events");
const path = require("path");
const { shell, nativeTheme, Menu, Tray } = require("electron");

const config = require("./config");
const logger = require("./logger");
const util = require("./util");
const events = require("./events");

const iconOn = path.join(__dirname, `/../../assets/on.png`);
const iconOff = path.join(__dirname, `/../../assets/off.png`);
// const iconOff = nativeImage.createFromDataURL(offUrl);
// todo use nativeImage and png loader

class CustomTray extends EventEmitter {
  tray = null;
  contextMenu = null;
  state = null;

  baseMenuTemplate = [
    { type: "separator" },
    {
      label: "Options",
      submenu: [
        {
          label: "Ocultar nomes de arquivos",
          type: "checkbox",
          checked: config.get("hideFilenames"),
          click: (menuItem) =>
            this.saveConfigAndUpdate("hideFilenames", menuItem.checked),
        },
        {
          label: "Ocultar status ativo/inativo",
          type: "checkbox",
          checked: config.get("hideStatus"),
          click: (menuItem) =>
            this.saveConfigAndUpdate("hideStatus", menuItem.checked),
        },
        {
          label: 'Ocultar o botão "Visualizar no Figma"',
          type: "checkbox",
          checked: config.get("hideViewButton"),
          click: (menuItem) =>
            this.saveConfigAndUpdate("hideViewButton", menuItem.checked),
        },
        // {
        //   label: "Connect to Discord when this app starts",
        //   type: "checkbox",
        //   checked: config.get("connectOnStartup"),
        //   click: (menuItem) =>
        //     this.saveConfigAndUpdate("connectOnStartup", menuItem.checked),
        // },
      ],
    },

    { type: "separator" },
    {
      label: "Mostrar configuração",
      click: () => shell.openPath(util.getAppDataPath()),
    },
    { type: "separator" },
    {
      label: "Sair",
      click: () => this.emit(events.QUIT),
    },
  ];

  constructor(trayState) {
    super();

    logger.debug("tray", "✅ Inicializado");

    this.state = trayState;

    this.tray = new Tray(this.getIconPath());
    this.update();

    nativeTheme.on("updated", () => this.update());
  }

  getIconPath() {
    const iconState = this.state.isDiscordReady ? "On" : "Off";

    if (process.platform === "darwin") {
      return path.join(__dirname, `/../../assets/Icon${iconState}Template.png`);
    } else if (process.platform === "win32") {
      // always use the darkmode icon on windows, taskbar seems to be dark regardless of theme
      return path.join(__dirname, `/../../assets/Icon${iconState}Windows.png`);
    }
  }

  update() {
    let menuTemplate;

    if (this.state.isDiscordReady) {
      menuTemplate = [
        {
          label: `Conectado ao Discord`,
          enabled: false,
          icon: iconOn,
        },
        { type: "separator" },
        {
          label: "Desconectar-se do Discord",
          click: () => this.emit(events.DISCONNECT),
        },
      ].concat(this.baseMenuTemplate);
    } else {
      if (this.state.isDiscordConnecting) {
        menuTemplate = [
          {
            label: "Conectando-se ao Discord",
            enabled: false,
            icon: iconOff,
          },
          { type: "separator" },
          {
            label: "Pare de se conectar ao Discord",
            click: () => this.emit(events.DISCONNECT),
          },
        ].concat(this.baseMenuTemplate);
      } else {
        menuTemplate = [
          {
            label: "Não conectado ao Discord",
            enabled: false,
            icon: iconOff,
          },
          { type: "separator" },
          {
            label: "Conecte-se ao Discord",
            click: () => this.emit(events.CONNECT),
          },
        ].concat(this.baseMenuTemplate);
      }
    }

    this.tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
    this.tray.setImage(this.getIconPath());
  }

  saveConfigAndUpdate(configKey, value) {
    config.set(configKey, value);
    config.save();

    // immeditely try a discord activity update
    this.emit(events.UPDATE_OPTIONS);
  }

  setState(state) {
    this.state = state;
    this.update();
  }
}

module.exports = CustomTray;
