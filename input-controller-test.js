document.addEventListener("DOMContentLoaded", () => {
  const targetElement = document.body;
  const box = document.getElementById("box");
  const log = document.getElementById("log");

  const keyboardPlugin = new KeyboardInputPlugin();
  const mousePlugin = new MouseInputPlugin();

  const controller = new InputController({
    "left": { keys: [37, 65], enabled: true },              // Стрелка влево и клавиша A
    "right": { keys: [39, 68], enabled: true },             // Стрелка вправо и клавиша D
    "up": { keys: [38, 87], enabled: true },                // Стрелка вверх и клавиша W
    "down": { keys: [40, 83], enabled: true }               // Стрелка вниз и клавиша S
  }, targetElement, [keyboardPlugin, mousePlugin]);

  let posX = 150;
  let posY = 150;
  const speed = 4;

  targetElement.addEventListener(controller.ACTION_ACTIVATED, (e) => {
    appendLog(`Активация действия: ${e.detail.action}`);
    if (e.detail.action === "jump") {
      box.style.backgroundColor = "red";
    }
  });

  targetElement.addEventListener(controller.ACTION_DEACTIVATED, (e) => {
    appendLog(`Деактивация действия: ${e.detail.action}`);
    if (e.detail.action === "jump") {
      box.style.backgroundColor = "blue";
    }
  });

  function update() {
    if (controller.isActionActive("left")) posX -= speed;
    if (controller.isActionActive("right")) posX += speed;
    if (controller.isActionActive("up")) posY -= speed;
    if (controller.isActionActive("down")) posY += speed;

    posX = Math.max(0, Math.min(350, posX));
    posY = Math.max(0, Math.min(350, posY));

    box.style.transform = `translate(${posX}px, ${posY}px)`;

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);

  const removeButtonFocus = (e) => {e.target.blur();}

  document.getElementById("btn-attach").addEventListener("click", (e) => {
    removeButtonFocus(e);
    controller.attach(targetElement);
    appendLog("Контроллер прикреплен к DOM");
  });

  document.getElementById("btn-detach").addEventListener("click", (e) => {
    removeButtonFocus(e);
    controller.detach();
    appendLog("Контроллер откреплен (detach)");
  });

  document.getElementById("btn-enable").addEventListener("click", (e) => {
    removeButtonFocus(e);
    controller.enabled = true;
    appendLog("Контроллер включен (enabled = true)");
  });

  document.getElementById("btn-disable").addEventListener("click", (e) => {
    removeButtonFocus(e);
    controller.enabled = false;
    appendLog("Контроллер выключен (enabled = false)");
  });

  document.getElementById("btn-bind-jump").addEventListener("click", (e) => {
    removeButtonFocus(e);
    controller.bindActions({
      "jump": { keys: [32], mouseButtons: [0],  enabled: true } // Пробел и ЛКМ
    });
    appendLog("Добавлена активность 'jump' (Пробел)");
  });

  function appendLog(msg) {
    const entry = document.createElement("div");
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }
});