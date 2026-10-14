// src/ui/SaveManager.ts
import { GameEngine } from '../core/GameEngine';

export class SaveManager {
  constructor(private game: GameEngine) {}

  async saveCurrentGame(): Promise<void> {
    try {
      await this.game.saveGame();
    } catch (error) {
      console.error('Speichern fehlgeschlagen:', error);
      throw error;
    }
  }

  async saveGameAs(slotName: string): Promise<void> {
    await this.game.saveGame(slotName);
  }

  async loadGame(slot?: string): Promise<void> {
    await this.game.loadGame(slot);
  }

  async getSavesList() {
    return await this.game.listSaves();
  }

  async deleteSave(slot: string): Promise<void> {
    await this.game.deleteSave(slot);
  }
}