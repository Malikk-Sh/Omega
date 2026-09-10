import { Game } from "./app/Game.js";

const boot = async () => {
  const fatal = document.querySelector("#m0-fatal");
  try {
    const game = new Game();
    await game.start();
    document.documentElement.dataset.omegaReady = "true";
  } catch (error) {
    console.error(error);
    if (fatal) {
      fatal.hidden = false;
      fatal.textContent = error instanceof Error ? error.message : String(error);
    }
  }
};

void boot();
