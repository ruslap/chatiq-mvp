{
  "meta": {
    "product": "Chtq",
    "screen": "Admin → Settings → Widget",
    "purpose": "Configure widget appearance/behavior + provide installation snippet",
    "source_screenshot_notes": {
      "ui_language": "uk-UA",
      "observed_legacy_brand_in_snippet": "Screenshot shows `chatni` in embed code; for Chtq MVP replace with `chtq` tokens."
    },
    "design_direction": [
      "modern, calm SaaS",
      "developer-friendly settings UI",
      "Catppuccin-like softness (low harsh contrast)",
      "cards + subtle elevation, not heavy borders",
      "compact but breathable spacing"
    ]
  },

  "breakpoints_tailwind": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  },

  "layout": {
    "page": {
      "background": "surface",
      "max_width": "1100–1200px content container (centered)",
      "padding": {
        "base": "16px",
        "md": "24px",
        "lg": "32px"
      },
      "vertical_rhythm": "24px between major sections"
    },

    "header": {
      "title": {
        "text": "Налаштування",
        "style": "large, muted, lightweight heading"
      },
      "tabs_row": {
        "type": "top navigation tabs",
        "items": ["Компанія", "Канали звʼязку", "Віджет", "Робочі години", "Автоматизація", "Шаблони", "Сповіщення"],
        "active_item": "Віджет",
        "active_indicator": "thin underline in primary color",
        "divider": "subtle bottom border line across the row"
      }
    },

    "content": {
      "sections": [
        {
          "id": "widget_settings_card",
          "type": "card",
          "title": "Налаштування віджета",
          "body_layout": "label column + control column (form rows)",
          "cta": "Зберегти button at lower-left inside the card"
        },
        {
          "id": "install_snippet_card",
          "type": "card",
          "title": "Встановіть віджет на сайт",
          "subtitle": "Скопіюйте код та встановіть його в html код вашого сайту",
          "body_layout": "single column with code block"
        }
      ]
    }
  },

  "components": {
    "tabs": {
      "visuals": {
        "font": "medium",
        "inactive_color": "text-secondary",
        "active_color": "text-primary",
        "active_underline_height": "2px",
        "row_spacing": "wide gaps between items, feels airy"
      },
      "behavior": {
        "hover": "text becomes slightly stronger + subtle underline fade",
        "active": "persistent underline + slightly bolder text"
      }
    },

    "card": {
      "radius": "12px (modern soft)",
      "background": "surface-elevated",
      "border": "very subtle (or none) + soft shadow",
      "shadow": "light in light mode; deeper but diffused in dark mode",
      "padding": "24px",
      "title_style": "semibold, 18–20px",
      "subtitle_style": "14px, muted"
    },

    "form_row": {
      "grid": {
        "md_up": "2 columns: label (fixed ~220px) + control (fluid)",
        "base": "stacked: label above control"
      },
      "spacing": {
        "row_gap": "16–18px",
        "label_to_control_gap": "16px"
      },
      "label_style": {
        "size": "14px",
        "color": "text-secondary"
      }
    },

    "color_picker_preview": {
      "label": "Колір віджета:",
      "control": {
        "type": "small swatch + picker trigger",
        "swatch_size": "36×18-ish (rounded)",
        "border": "1px subtle border",
        "fill": "primary-400/500 like soft blue"
      },
      "states": {
        "hover": "slightly stronger border",
        "focus": "soft focus ring (primary tint)"
      }
    },

    "segmented_control": {
      "used_for": ["Розмір віджета", "Позиція віджета"],
      "shape": "pill group (rounded container)",
      "segments": {
        "padding": "10–12px horizontal, 8–10px vertical",
        "font": "14px medium",
        "min_width": "fits content; consistent widths per group"
      },
      "states": {
        "inactive": "surface with subtle border",
        "active": "surface + primary-tinted border or soft primary background",
        "hover": "slight background lift",
        "focus": "soft ring"
      },
      "examples": {
        "size": ["Стандартний", "Компактний 기억"],
        "position": ["Ліворуч", "Праворуч", "Задати вручну"]
      }
    },

    "checkbox_group": {
      "label": "Мова віджета:",
      "items": [
        { "text": "Українська", "checked": true },
        { "text": "Англійська", "checked": false },
        { "text": "Німецька", "checked": false }
      ],
      "style": {
        "checkbox": "rounded corners (not sharp), primary when checked",
        "alignment": "inline row wrap"
      },
      "behavior": {
        "hover": "label highlight",
        "a11y": "entire label clickable, not just box"
      }
    },

    "toggle": {
      "used_for": ["Показувати welcome message:", "Показувати контактну форму:"],
      "style": {
        "track": "rounded pill",
        "thumb": "circle, elevated",
        "on_color": "primary-600",
        "off_color": "gray-300/gray-600 (dark)"
      },
      "behavior": {
        "interaction": "tap/click toggles + smooth motion",
        "disabled_state": "reduced opacity + no pointer"
      }
    },

    "textarea": {
      "label": "Повідомлення:",
      "content_example": "Вітаю! 👋 ...",
      "style": {
        "height": "120–140px",
        "radius": "10–12px",
        "background": "surface",
        "border": "subtle",
        "placeholder": "muted"
      },
      "states": {
        "focus": "soft ring + border tint primary",
        "error_optional": "danger tint border + helper text"
      },
      "conditional_visibility": "Shown/enabled when welcome toggle is ON; otherwise collapsed or disabled with explanation"
    },

    "primary_button": {
      "text": "Зберегти",
      "size": "md",
      "shape": "rounded (10–12px)",
      "fill": "primary-600",
      "text_color": "white",
      "states": {
        "hover": "slightly darker",
        "pressed": "deeper shade",
        "disabled": "gray fill + muted text"
      }
    },

    "code_block": {
      "purpose": "Embed snippet copy-paste",
      "container": {
        "radius": "12px",
        "background": "surface-muted",
        "border": "subtle border",
        "padding": "16px"
      },
      "content": {
        "format": "monospace",
        "line_height": "1.6",
        "wrap": "soft wrap on mobile; horizontal scroll on larger screens",
        "copy_action": {
          "recommended_addition_modern": "Add a copy button top-right inside code block (icon + 'Скопіювати') with toast 'Скопійовано'"
        }
      },
      "syntax_highlighting_accents": {
        "keyword": "purple accent (e.g., 'async')",
        "strings": "green accent",
        "identifiers": "default text",
        "comments_optional": "muted gray"
      },
      "tokenized_snippet": {
        "note": "Use product tokens; screenshot shows legacy 'chatni'.",
        "example": [
          "<script async src=\"https://<WIDGET_CDN_DOMAIN>/widget.js\"></script>",
          "<script>",
          "  window.<PRODUCT_NS> = {",
          "    organizationId: \"<ORG_ID>\",",
          "    language: \"ua\"",
          "  }",
          "</script>"
        ]
      }
    }
  },

  "responsive_behavior": {
    "base_lt_sm": {
      "tabs": "becomes horizontally scrollable with fade edges; active underline remains visible",
      "cards": "full width, stacked",
      "form_rows": "stack labels above controls",
      "segmented_controls": "wrap to 2 lines if needed",
      "code_block": "soft wrap OR horizontal scroll; keep copy button accessible"
    },
    "sm": {
      "container_padding": "16px",
      "tabs": "still scrollable if overflow",
      "form": "mostly stacked, but allow 2-col if space permits"
    },
    "md": {
      "container_padding": "24px",
      "form": "2-col label/control grid becomes default",
      "segmented_controls": "single line groups"
    },
    "lg": {
      "container_padding": "32px",
      "cards": "slightly larger padding + more breathing room",
      "code_block": "prefer horizontal scroll over wrapping to preserve code shape"
    },
    "xl_2xl": {
      "max_width": "cap content for readability; do not stretch form lines too wide"
    }
  },

  "typography": {
    "scale": {
      "page_title": "30–34px (lightweight, muted)",
      "section_title": "18–20px semibold",
      "body": "14–16px",
      "muted": "13–14px"
    },
    "tone": "neutral, product-like, not marketing"
  },

  "spacing_and_radii": {
    "radii": {
      "card": "12px",
      "input": "10–12px",
      "button": "10–12px",
      "toggle_track": "9999px",
      "segmented": "9999px outer, 10–12px segment"
    },
    "spacing": {
      "card_padding": "24px",
      "row_gap": "16–18px",
      "between_cards": "20–24px"
    }
  },

  "color_system": {
    "primary_palette": {
      "name": "Soft Indigo/Blue (Tailwind-like)",
      "50": "#EEF2FF",
      "100": "#E0E7FF",
      "300": "#A5B4FC",
      "500": "#6366F1",
      "600": "#4F46E5",
      "700": "#4338CA"
    },
    "secondary_palette": {
      "name": "Slate Neutral (Tailwind-like)",
      "200": "#E5E7EB",
      "400": "#9CA3AF",
      "600": "#4B5563",
      "800": "#1F2937"
    },
    "grays": {
      "bg": "#F9FAFB",
      "surface": "#FFFFFF",
      "surface_elevated": "#FFFFFF",
      "surface_muted": "#F3F4F6",
      "border": "#E5E7EB",
      "text_primary": "#111827",
      "text_secondary": "#6B7280",
      "text_muted": "#9CA3AF"
    },
    "accents_complex": {
      "code_keyword_purple": "#8B5CF6",
      "code_string_green": "#22C55E",
      "focus_ring": "primary-300 with ~40% opacity",
      "shadow_light": "black 8–12% blur large",
      "shadow_dark": "black 35–45% blur large (diffused)"
    }
  },

  "dark_mode": {
    "strategy": "Same layout; swap surfaces and reduce contrast; keep primary as the only saturated color.",
    "colors": {
      "bg": "#0B1220",
      "surface": "#0F172A",
      "surface_elevated": "#111B2E",
      "surface_muted": "#101A2C",
      "border": "#22304A",
      "text_primary": "#E5E7EB",
      "text_secondary": "#9CA3AF",
      "text_muted": "#6B7280",
      "primary_shift": {
        "500": "#7C83FF",
        "600": "#6A6EFF"
      },
      "toggle_off": "#334155",
      "code_block_bg": "#0F172A"
    },
    "shadows": "Use fewer shadows; rely more on slight border + surface elevation"
  },

  "states_and_feedback": {
    "loading": "Disable Save button + show subtle inline spinner in button; keep layout stable",
    "success": "Toast: 'Збережено' (top-right or bottom-right); subtle green accent",
    "error": "Inline helper text under the field; card remains calm (no big red banners unless critical)",
    "unsaved_changes": "Optional modern enhancement: show sticky mini-bar 'Є незбережені зміни' with Save/Cancel"
  },

  "a11y": {
    "targets": "Min 40px height for toggles and segmented items",
    "keyboard": "Tabs navigable; segmented behaves like radio group; toggles reachable",
    "contrast": "AA for text; keep primary-on-surface readable",
    "labels": "All inputs have visible labels; helper text tied to fields"
  }
}
