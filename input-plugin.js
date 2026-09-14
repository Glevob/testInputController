/// Основной класс Плагина ///
class BaseInputPlugin {
    constructor() {
	this.controller = null;
    }

    init(controller) {
	this.controller = controller;
    }

    attach(target) {}
    detach(target) {}

    isActionActive(actionConfig) {
	return false;
    }

    reset() {}
}

/// Класс для управления клавиатурой ///
class KeyboardInputPlugin extends BaseInputPlugin {
    constructor() {
	super();
	this._pressedKeys = new Set();
 	this._onKeyDown = this._onKeyDown.bind(this);
	this._onKeyUp = this._onKeyUp.bind(this);
    }

    attach(target) {
	target.addEventListener("keydown", this._onKeyDown);
	target.addEventListener("keyup", this._onKeyUp);
    }

    detach(target) {
	target.removeEventListener("keydown", this._onKeyDown);
	target.removeEventListener("keyup", this._onKeyUp);
	this.reset();
    }

    reset() {
	this._pressedKeys.clear();
    }

    isActionActive(actionConfig) {
	if (!actionConfig || !actionConfig.keys) return false;
	for (const keyCode of actionConfig.keys) {
	  if (this._pressedKeys.has(keyCode)) {
	    return true;
	  }
	}
	return false;
    }

    isKeyPressed(keyCode) {
	return this._pressedKeys.has(keyCode);
    }

    _onKeyDown(event) {
	if (!this.controller || !this.controller.enabled || !this.controller.focused) return;
	const code = event.keyCode || event.which;
	const wasPressed = this._pressedKeys.has(code);
	this._pressedKeys.add(code);

	if (!wasPressed) {
	  this.controller.onInputStateChange();
	}
    }

    _onKeyUp(event) {
	const code = event.keyCode || event.which;
	this._pressedKeys.delete(code);
	if (this.controller) {
	  this.controller.onInputStateChange();
	}
    }
}

/// Класс для управления мышкой ///
class MouseInputPlugin extends BaseInputPlugin {
    constructor() {
	super();
	this._pressedButtons = new Set();
 	this._onMouseDown = this._onMouseDown.bind(this);
	this._onMouseUp = this._onMouseUp.bind(this);
    }

    attach(target) {
	window.addEventListener("mousedown", this._onMouseDown);
	window.addEventListener("mouseup", this._onMouseUp);
    }

    detach(target) {
	window.removeEventListener("mousedown", this._onMouseDown);
	window.removeEventListener("mouseup", this._onMouseUp);
	this.reset();
    }

    reset() {
	this._pressedButtons.clear();
    }

    isActionActive(actionConfig) {
	if (!actionConfig || !actionConfig.mouseButtons) return false;
	for (const buttonCode of actionConfig.mouseButtons) {
	  if (this._pressedButtons.has(buttonCode)) {
	    return true;
	  }
	}
	return false;
    }

    _onMouseDown(event) {
	if (event.target.closest('button')) return;
	if (!this.controller || !this.controller.enabled || !this.controller.focused) return;
	const button = event.button;
	const wasPressed = this._pressedButtons.has(button);
	this._pressedButtons.add(button);

	if (!wasPressed) {
	  this.controller.onInputStateChange();
	}
    }

    _onMouseUp(event) {
	const button = event.button;
	this._pressedButtons.delete(button);
	if (this.controller) {
	  this.controller.onInputStateChange();
	}
    }
}



