// src/ui/PixiUISystem.ts
import * as PIXI from 'pixi.js';
import { PixiGraphicsHelpers } from './PixiGraphicsHelpers';

/**
 * Complete PixiJS UI System - Modern glassmorphic design
 * Replaces DOM-based UI with full canvas rendering
 */

export interface UITheme {
  colors: {
    background: number;
    backgroundDark: number;
    panel: number;
    glass: number;
    accent: number;
    accentSecondary: number;
    text: number;
    textMuted: number;
    success: number;
    danger: number;
    warning: number;
  };
  gradients: {
    primary: number[];
    secondary: number[];
    gold: number[];
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: number;
  fontSize: {
    small: number;
    normal: number;
    large: number;
    title: number;
    hero: number;
  };
}

export const defaultTheme: UITheme = {
  colors: {
    background: 0x0b1020,
    backgroundDark: 0x0f1724,
    panel: 0x0e2940,
    glass: 0x1a2a40,
    accent: 0x7dd3fc,
    accentSecondary: 0xa78bfa,
    text: 0xe6eef8,
    textMuted: 0x94a3b8,
    success: 0x34d399,
    danger: 0xfb7185,
    warning: 0xfbbf24,
  },
  gradients: {
    primary: [0x7dd3fc, 0xa78bfa],
    secondary: [0x0e2940, 0x1a3a5a],
    gold: [0xffd700, 0xffed4e],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
  },
  borderRadius: 12,
  fontSize: {
    small: 12,
    normal: 14,
    large: 16,
    title: 20,
    hero: 32,
  },
};

export interface UIButton {
  container: PIXI.Container;
  background: PIXI.Graphics;
  text: PIXI.Text;
  onClick?: () => void;
}

export interface UIPanel {
  container: PIXI.Container;
  background: PIXI.Graphics;
  title?: PIXI.Text;
  content: PIXI.Container;
}

export class PixiUISystem {
  private theme: UITheme;

  constructor(app: PIXI.Application, theme: UITheme = defaultTheme) {
    // Store app reference if needed in future
    console.log('PixiUISystem initialized with app:', app.renderer.type);
    this.theme = theme;
  }

  /**
   * Create a glassmorphic panel with shadow and blur effect
   */
  public createPanel(
    width: number,
    height: number,
    title?: string,
    options: {
      alpha?: number;
      borderColor?: number;
      borderWidth?: number;
      padding?: number;
    } = {}
  ): UIPanel {
    const {
      alpha = 0.15,
      borderColor = 0xffffff,
      borderWidth = 1,
      padding = this.theme.spacing.md,
    } = options;

    const container = new PIXI.Container();
    const background = new PIXI.Graphics();

    // Glassmorphic background with gradient - using PixiJS 8.x API
    background.roundRect(0, 0, width, height, this.theme.borderRadius);
    background.fill({ color: this.theme.colors.glass, alpha });
    background.stroke({ color: borderColor, alpha: 0.1, width: borderWidth });

    container.addChild(background);

    const content = new PIXI.Container();
    content.x = padding;
    content.y = padding;

    let titleText: PIXI.Text | undefined;
    if (title) {
      titleText = this.createText(title, {
        fontSize: this.theme.fontSize.title,
        fill: this.theme.colors.accent,
        fontWeight: 'bold',
      });
      titleText.x = padding;
      titleText.y = padding;
      container.addChild(titleText);
      content.y = titleText.height + padding * 2;
    }

    container.addChild(content);

    return {
      container,
      background,
      title: titleText,
      content,
    };
  }

  /**
   * Create an interactive button with hover effects
   */
  public createButton(
    text: string,
    width: number,
    height: number,
    onClick?: () => void,
    options: {
      variant?: 'primary' | 'secondary' | 'danger' | 'success';
      fontSize?: number;
    } = {}
  ): UIButton {
    const { variant = 'primary', fontSize = this.theme.fontSize.normal } =
      options;

    const container = new PIXI.Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const background = new PIXI.Graphics();
    const colors = this.getButtonColors(variant);

    // Draw button background
    this.drawButtonBackground(background, width, height, colors.normal);

    const buttonText = this.createText(text, {
      fontSize,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    buttonText.anchor.set(0.5);
    buttonText.x = width / 2;
    buttonText.y = height / 2;

    container.addChild(background);
    container.addChild(buttonText);

    // Hover effects
    container.on('pointerover', () => {
      background.clear();
      this.drawButtonBackground(background, width, height, colors.hover);
      container.scale.set(1.02);
    });

    container.on('pointerout', () => {
      background.clear();
      this.drawButtonBackground(background, width, height, colors.normal);
      container.scale.set(1);
    });

    container.on('pointerdown', () => {
      container.scale.set(0.98);
    });

    container.on('pointerup', () => {
      container.scale.set(1.02);
      if (onClick) onClick();
    });

    return {
      container,
      background,
      text: buttonText,
      onClick,
    };
  }

  /**
   * Create styled text using PixiJS 8.x API
   */
  public createText(
    text: string,
    style: Partial<PIXI.TextStyle> = {}
  ): PIXI.Text {
    const defaultStyle = {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: this.theme.fontSize.normal,
      fill: this.theme.colors.text,
      wordWrap: false,
      ...style,
    };

    return PixiGraphicsHelpers.createText(text, defaultStyle);
  }

  /**
   * Create a progress bar
   */
  public createProgressBar(
    width: number,
    height: number,
    progress: number,
    options: {
      backgroundColor?: number;
      fillColor?: number;
      showLabel?: boolean;
      label?: string;
    } = {}
  ): PIXI.Container {
    const {
      backgroundColor = 0x1a1a2e,
      fillColor = this.theme.colors.accent,
      showLabel = true,
      label = `${Math.round(progress * 100)}%`,
    } = options;

    const container = new PIXI.Container();

    // Background - using PixiJS 8.x API
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, height / 2);
    bg.fill({ color: backgroundColor, alpha: 0.5 });

    // Fill - using PixiJS 8.x API
    const fill = new PIXI.Graphics();
    const fillWidth = Math.max(height, width * progress); // Minimum width = height for rounded ends
    fill.roundRect(0, 0, fillWidth, height, height / 2);
    fill.fill({ color: fillColor });

    container.addChild(bg);
    container.addChild(fill);

    if (showLabel && label) {
      const text = this.createText(label, {
        fontSize: this.theme.fontSize.small,
        fill: 0xffffff,
      });
      text.anchor.set(0.5);
      text.x = width / 2;
      text.y = height / 2;
      container.addChild(text);
    }

    return container;
  }

  /**
   * Create an icon sprite
   */
  public createIcon(
    symbol: string,
    size: number = 24,
    color: number = this.theme.colors.text
  ): PIXI.Text {
    return this.createText(symbol, {
      fontSize: size,
      fill: color,
    });
  }

  /**
   * Create a separator line using PixiJS 8.x API
   */
  public createSeparator(
    width: number,
    color: number = 0xffffff,
    alpha: number = 0.1
  ): PIXI.Graphics {
    const line = new PIXI.Graphics();
    line.moveTo(0, 0);
    line.lineTo(width, 0);
    line.stroke({ color, alpha, width: 1 });
    return line;
  }

  /**
   * Create a card container
   */
  public createCard(
    width: number,
    height: number,
    options: {
      title?: string;
      subtitle?: string;
      icon?: string;
      hoverable?: boolean;
    } = {}
  ): UIPanel {
    const { title, subtitle, icon, hoverable = false } = options;

    const panel = this.createPanel(width, height, undefined, {
      alpha: 0.1,
      padding: this.theme.spacing.md,
    });

    if (hoverable) {
      panel.container.eventMode = 'static';
      panel.container.cursor = 'pointer';

      panel.container.on('pointerover', () => {
        panel.background.clear();
        panel.background.roundRect(
          0,
          0,
          width,
          height,
          this.theme.borderRadius
        );
        panel.background.fill({ color: this.theme.colors.glass, alpha: 0.2 });
        panel.background.stroke({ color: this.theme.colors.accent, alpha: 0.3, width: 1 });
      });

      panel.container.on('pointerout', () => {
        panel.background.clear();
        panel.background.roundRect(
          0,
          0,
          width,
          height,
          this.theme.borderRadius
        );
        panel.background.fill({ color: this.theme.colors.glass, alpha: 0.1 });
        panel.background.stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
      });
    }

    let yOffset = 0;

    if (icon) {
      const iconText = this.createIcon(icon, 32, this.theme.colors.accent);
      iconText.x = this.theme.spacing.md;
      iconText.y = this.theme.spacing.md;
      panel.content.addChild(iconText);
      yOffset = iconText.height + this.theme.spacing.sm;
    }

    if (title) {
      const titleText = this.createText(title, {
        fontSize: this.theme.fontSize.large,
        fill: this.theme.colors.text,
        fontWeight: 'bold',
      });
      titleText.y = yOffset;
      panel.content.addChild(titleText);
      yOffset += titleText.height + this.theme.spacing.xs;
    }

    if (subtitle) {
      const subtitleText = this.createText(subtitle, {
        fontSize: this.theme.fontSize.small,
        fill: this.theme.colors.textMuted,
      });
      subtitleText.y = yOffset;
      panel.content.addChild(subtitleText);
    }

    return panel;
  }

  /**
   * Get button colors based on variant
   */
  private getButtonColors(variant: string): {
    normal: number;
    hover: number;
  } {
    const colorMap: Record<string, { normal: number; hover: number }> = {
      primary: { normal: this.theme.colors.accent, hover: 0x60c5f0 },
      secondary: { normal: this.theme.colors.accentSecondary, hover: 0x9676ed },
      danger: { normal: this.theme.colors.danger, hover: 0xf95171 },
      success: { normal: this.theme.colors.success, hover: 0x10b981 },
    };

    return colorMap[variant] || colorMap.primary;
  }

  /**
   * Draw button background with gradient using PixiJS 8.x API
   */
  private drawButtonBackground(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    color: number
  ): void {
    graphics.roundRect(0, 0, width, height, this.theme.borderRadius);
    graphics.fill({ color });

    // Add subtle shadow/highlight
    graphics.roundRect(
      0,
      0,
      width,
      height / 2,
      this.theme.borderRadius
    );
    graphics.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
  }

  /**
   * Create a tooltip using PixiJS 8.x API
   */
  public createTooltip(text: string, maxWidth: number = 200): PIXI.Container {
    const container = new PIXI.Container();

    const tooltipText = this.createText(text, {
      fontSize: this.theme.fontSize.small,
      fill: this.theme.colors.text,
      wordWrap: true,
      wordWrapWidth: maxWidth - this.theme.spacing.md * 2,
    });

    const padding = this.theme.spacing.sm;
    const width = Math.min(
      tooltipText.width + padding * 2,
      maxWidth
    );
    const height = tooltipText.height + padding * 2;

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
    bg.stroke({ color: this.theme.colors.accent, alpha: 0.5, width: 1 });

    tooltipText.x = padding;
    tooltipText.y = padding;

    container.addChild(bg);
    container.addChild(tooltipText);

    return container;
  }

  /**
   * Create particle effect using PixiJS 8.x API
   */
  public createParticle(
    x: number,
    y: number,
    color: number = this.theme.colors.accent,
    size: number = 4
  ): PIXI.Graphics {
    const particle = new PIXI.Graphics();
    particle.circle(0, 0, size);
    particle.fill({ color });
    particle.x = x;
    particle.y = y;
    return particle;
  }

  /**
   * Create a stat display (icon + label + value)
   */
  public createStatDisplay(
    icon: string,
    label: string,
    value: string,
    options: {
      iconColor?: number;
      valueColor?: number;
    } = {}
  ): PIXI.Container {
    const {
      iconColor = this.theme.colors.accent,
      valueColor = this.theme.colors.text,
    } = options;

    const container = new PIXI.Container();

    const iconText = this.createIcon(icon, 20, iconColor);
    container.addChild(iconText);

    const labelText = this.createText(label, {
      fontSize: this.theme.fontSize.small,
      fill: this.theme.colors.textMuted,
    });
    labelText.x = iconText.width + this.theme.spacing.xs;
    container.addChild(labelText);

    const valueText = this.createText(value, {
      fontSize: this.theme.fontSize.normal,
      fill: valueColor,
      fontWeight: 'bold',
    });
    valueText.x = labelText.x + labelText.width + this.theme.spacing.sm;
    container.addChild(valueText);

    return container;
  }

  /**
   * Get theme
   */
  public getTheme(): UITheme {
    return this.theme;
  }

  /**
   * Update theme
   */
  public setTheme(theme: Partial<UITheme>): void {
    this.theme = { ...this.theme, ...theme };
  }
}
