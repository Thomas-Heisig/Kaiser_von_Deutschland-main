// src/ui/PixiGraphicsHelpers.ts
import * as PIXI from 'pixi.js';

/**
 * Helper functions for PixiJS 8.x Graphics API
 * Replaces deprecated methods with new API
 */

export class PixiGraphicsHelpers {
  /**
   * Draw a filled rectangle (replaces beginFill + drawRect + endFill)
   */
  static fillRect(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha: number = 1
  ): PIXI.Graphics {
    graphics.rect(x, y, width, height);
    graphics.fill({ color, alpha });
    return graphics;
  }

  /**
   * Draw a filled rounded rectangle
   */
  static fillRoundedRect(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: number,
    alpha: number = 1
  ): PIXI.Graphics {
    graphics.roundRect(x, y, width, height, radius);
    graphics.fill({ color, alpha });
    return graphics;
  }

  /**
   * Draw a stroked rounded rectangle
   */
  static strokeRoundedRect(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: number,
    alpha: number = 1,
    strokeWidth: number = 1
  ): PIXI.Graphics {
    graphics.roundRect(x, y, width, height, radius);
    graphics.stroke({ color, alpha, width: strokeWidth });
    return graphics;
  }

  /**
   * Draw a filled circle
   */
  static fillCircle(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha: number = 1
  ): PIXI.Graphics {
    graphics.circle(x, y, radius);
    graphics.fill({ color, alpha });
    return graphics;
  }

  /**
   * Draw a filled and stroked rounded rectangle (panel style)
   */
  static fillAndStrokeRoundedRect(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    strokeWidth: number = 1
  ): PIXI.Graphics {
    graphics.roundRect(x, y, width, height, radius);
    graphics.fill({ color: fillColor, alpha: fillAlpha });
    graphics.stroke({ color: strokeColor, alpha: strokeAlpha, width: strokeWidth });
    return graphics;
  }

  /**
   * Create a Text object using new API
   */
  static createText(
    text: string,
    style: Partial<PIXI.TextStyle>
  ): PIXI.Text {
    return new PIXI.Text({ text, style: new PIXI.TextStyle(style) });
  }
}
