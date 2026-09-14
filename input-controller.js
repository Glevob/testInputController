const InputController = (() => {
  class InputController {
    static ACTION_ACTIVATED = "input-controller:action-activated";
    static ACTION_DEACTIVATED = "input-controller:action-deactivated";

    ACTION_ACTIVATED = InputController.ACTION_ACTIVATED;
    ACTION_DEACTIVATED = InputController.ACTION_DEACTIVATED;

    constructor(actionsToBind = {}, target = null) {
      this.enabled = true;
      this.focused = true;
      this.target = null;

      this._actions = {};
      this._pressedKeys = new Set();

      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
      this._onFocus = this._onFocus.bind(this);
      this._onBlur = this._onBlur.bind(this);

      window.addEventListener("focus", this._onFocus);
      window.addEventListener("blur", this._onBlur);

      if (actionsToBind) {
        this.bindActions(actionsToBind);
      }

      if (target) {
        this.attach(target);
      }
    }

    get enabled() {
      return this._enabled;
    }
    
    set enabled(value) {
      const boolVal = Boolean(value);
      if (this._enabled && !boolVal) {
         this._enabled = false;
         this._resetState();
      } else {
	 this._enabled = boolVal;
      }
    }

    bindActions(actionsToBind) {
      for (const [actionName, config] of Object.entries(actionsToBind)) {
        const keysArr = config.keys || [];
	const hasEnabledConfig = config.enabled !== undefined;
        const isEnabled = hasEnabledConfig ? Boolean(config.enabled) : true;

        if (!this._actions[actionName]) {
          this._actions[actionName] = {
            keys: new Set(keysArr),
            enabled: isEnabled,
            active: false
          };
        } else {
            keysArr.forEach(k => this._actions[actionName].keys.add(k));
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
       const isNowActive = this.isActionActive(actionName);
       if (isNowActive && !act.active) {
	act.active = true;
	this._dispatch(this.ACTION_ACTIVED, actionName);
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
      
      this._pressedKeys.clear();

      this.target = target;
      if (!dontEnable) {
        this.enabled = true;
      }

      this.target.addEventListener("keydown", this._onKeyDown);
      this.target.addEventListener("keyup", this._onKeyUp);
    }

    detach() {
      if (this.target) {
        this.target.removeEventListener("keydown", this._onKeyDown);
        this.target.removeEventListener("keyup", this._onKeyUp);
        this._resetState();
        this.target = null;
      }
      this.enabled = false;
    }

    isActionActive(actionName) {
      if (!this.enabled || !this.focused) return false;
      const act = this._actions[actionName];
      if (!act || !act.enabled) return false;

      for (const keyCode of act.keys) {
        if (this._pressedKeys.has(keyCode)) {
          return true;
        }
      }
      return false;
    }

    isKeyPressed(keyCode) {
      if (!this.enabled || !this.focused) return false;
      return this._pressedKeys.has(keyCode);
    }

    _onKeyDown(event) {
      if (!this.enabled || !this.focused) return;
      
      const code = event.keyCode || event.which;
      const wasPressed = this._pressedKeys.has(code);
      this._pressedKeys.add(code);

      if (!wasPressed) {
        this._updateActionsState();
      }
    }

    _onKeyUp(event) {
      //if (!this.enabled) return;
      
      const code = event.keyCode || event.which;
      this._pressedKeys.delete(code);
      this._updateActionsState();
    }

    _onFocus() {
      this.focused = true;
    }

    _onBlur() {
      this.focused = false;
      this._resetState();
    }

    _resetState() {
      this._pressedKeys.clear();
      for (const [actionName, act] of Object.entries(this._actions)) {
        if (act.active) {
          act.active = false;
          this._dispatch(this.ACTION_DEACTIVATED, actionName);
        }
      }
    }

    _updateActionsState() {
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

    _dispatch(eventName, actionName) {
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