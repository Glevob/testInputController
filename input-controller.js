const InputController = (() => {
  class InputController {
    static ACTION_ACTIVATED = "input-controller:action-activated";
    static ACTION_DEACTIVATED = "input-controller:action-deactivated";

    ACTION_ACTIVATED = InputController.ACTION_ACTIVATED;
    ACTION_DEACTIVATED = InputController.ACTION_DEACTIVATED;

    constructor(actionsToBind = {}, target = null, plugins = []) {
      this._enabled = true;
      this.focused = true;
      this.target = null;

      this._actions = {};
      this._plugins = [];

      this._onFocus = this._onFocus.bind(this);
      this._onBlur = this._onBlur.bind(this);

      window.addEventListener("focus", this._onFocus);
      window.addEventListener("blur", this._onBlur);

      const defaultPlugins = plugins.length > 0 ? plugins : [new KeyboardInputPlugin()];
      defaultPlugins.forEach(plugin => this.registerPlugin(plugin));

      if (actionsToBind) {
        this.bindActions(actionsToBind);
      }

      if (target) {
        this.attach(target);
      }
    }

    registerPlugin(plugin) {
      plugin.init(this);
      this._plugins.push(plugin);

      if (this.target) {
        plugin.attach(this.target);
      }
    }

    get enabled() {
      return this._enabled;
    }

    set enabled(value) {
      const boolVal = Boolean(value);
      if (this._enabled === boolVal) return;

      if (boolVal) {
        this._enabled = true;
        if (this.focused) {
          this.onInputStateChange();
        }
      } else {
        this._deactivateAllActions();
        this._enabled = false;
      }
    }

    bindActions(actionsToBind) {
      for (const [actionName, config] of Object.entries(actionsToBind)) {
        const hasEnabledConfig = config.enabled !== undefined;
        const isEnabled = hasEnabledConfig ? Boolean(config.enabled) : true;

        if (!this._actions[actionName]) {
          this._actions[actionName] = {
            config: { ...config },
            enabled: isEnabled,
            active: false
          };
        } else {
          if (!this._actions[actionName].config) {
            this._actions[actionName].config = {};
          }
          Object.assign(this._actions[actionName].config, config);

          if (hasEnabledConfig) {
            if (isEnabled) {
              this.enableAction(actionName);
            } else {
              this.disableAction(actionName);
            }
          }
        }
      }
    }

    enableAction(actionName) {
      const act = this._actions[actionName];
      if (!act) return;

      const wasEnabled = act.enabled;
      act.enabled = true;

      if (!wasEnabled && this.enabled && this.focused) {
        if (this.isActionActive(actionName) && !act.active) {
          act.active = true;
          this._dispatch(this.ACTION_ACTIVATED, actionName);
        }
      }
    }

    disableAction(actionName) {
      const act = this._actions[actionName];
      if (!act) return;

      act.enabled = false;
      if (act.active) {
        act.active = false;
        this._dispatchDirect(this.ACTION_DEACTIVATED, actionName);
      }
    }

    attach(target, dontEnable = false) {
      if (this.target) {
        this.detach();
      }

      this.target = target;
      if (!dontEnable) {
        this._enabled = true;
      }

      this._plugins.forEach(plugin => plugin.attach(this.target));
    }

    detach() {
      if (this.target) {
        this._deactivateAllActions();
        this._plugins.forEach(plugin => plugin.detach(this.target));
        this.target = null;
      }
      this._enabled = false;
    }

    isActionActive(actionName) {
      if (!this.enabled || !this.focused) return false;
      const act = this._actions[actionName];
      if (!act || !act.enabled) return false;

      for (const plugin of this._plugins) {
        if (plugin.isActionActive(act.config)) {
          return true;
        }
      }
      return false;
    }

    isKeyPressed(keyCode) {
      const kbPlugin = this._plugins.find(p => p instanceof KeyboardInputPlugin);
      return kbPlugin ? kbPlugin.isKeyPressed(keyCode) : false;
    }


    onInputStateChange() {
      if (!this.enabled || !this.focused) return;

      for (const [actionName, act] of Object.entries(this._actions)) {
        if (!act.enabled) continue;

        const isNowActive = this.isActionActive(actionName);

        if (isNowActive && !act.active) {
          act.active = true;
          this._dispatch(this.ACTION_ACTIVATED, actionName);
        } else if (!isNowActive && act.active) {
          act.active = false;
          this._dispatch(this.ACTION_DEACTIVATED, actionName);
        }
      }
    }

    _deactivateAllActions() {
      for (const [actionName, act] of Object.entries(this._actions)) {
        if (act.active) {
          act.active = false;
          this._dispatchDirect(this.ACTION_DEACTIVATED, actionName);
        }
      }
      this._plugins.forEach(plugin => plugin.reset());
    }

    _onFocus() {
      this.focused = true;
      this.onInputStateChange();
    }

    _onBlur() {
      this.focused = false;
      this._deactivateAllActions();
    }

    _dispatch(eventName, actionName) {
      if (!this.enabled) return;
      this._dispatchDirect(eventName, actionName);
    }

    _dispatchDirect(eventName, actionName) {
      if (!this.target) return;

      const customEvent = new CustomEvent(eventName, {
        detail: { action: actionName },
        bubbles: true
      });
      this.target.dispatchEvent(customEvent);
    }
  }

  return InputController;
})();