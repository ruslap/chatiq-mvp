{
  "meta": {
    "product": "Chtq – Chat Dashboard",
    "ui_type": "SaaS chat widget admin/dashboard",
    "design_style": [
      "modern",
      "clean",
      "soft SaaS",
      "developer-oriented",
      "calm",
      "high whitespace",
      "Catppuccin-inspired (soft contrast, not flat)"
    ],
    "layout_philosophy": "Two-column layout with fixed sidebar and fluid content area, optimized for focus and clarity"
  },

  "breakpoints_tailwind": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  },

  "layout": {
    "root": {
      "display": "flex",
      "direction": "row",
      "height": "100vh",
      "background": "surface"
    },

    "sidebar": {
      "width": {
        "base": "100%",
        "md": "280px"
      },
      "behavior": {
        "sm": "collapsible / overlay",
        "md_up": "fixed static"
      },
      "structure": [
        "logo",
        "search_input",
        "tabs",
        "chat_list",
        "empty_state"
      ]
    },

    "main_content": {
      "flex": "1",
      "display": "flex",
      "direction": "column",
      "background": "surface-muted"
    }
  },

  "top_bar": {
    "height": "56px",
    "background": "primary",
    "elements": [
      {
        "type": "brand",
        "content": "Chtq",
        "alignment": "left"
      },
      {
        "type": "trial_notice",
        "text": "Trial ends in 13 days",
        "style": "subtle pill"
      },
      {
        "type": "cta_button",
        "text": "Upgrade",
        "variant": "outline-inverse"
      },
      {
        "type": "icon_buttons",
        "icons": ["help", "notifications", "settings", "user_avatar"]
      }
    ]
  },

  "sidebar_details": {
    "search": {
      "type": "input",
      "placeholder": "Search",
      "style": "rounded, soft background, no hard border",
      "icon": "magnifier"
    },

    "tabs": {
      "items": ["All", "New", "Mine"],
      "style": {
        "active": "underline + bold text",
        "inactive": "muted"
      }
    },

    "chat_list": {
      "item_height": "64px",
      "interaction": "hover highlight",
      "active_state": "left accent bar"
    },

    "empty_state": {
      "icon": "box",
      "text": "No conversations yet",
      "tone": "neutral-muted"
    }
  },

  "main_empty_state": {
    "alignment": "center",
    "illustration": {
      "type": "svg",
      "content": "paper plane with dashed path",
      "motion": "optional subtle float"
    },
    "text": "Select a conversation to start chatting",
    "tone": "friendly, non-intrusive"
  },

  "color_palettes": {
    "primary": {
      "name": "Soft Blue",
      "50": "#eef2ff",
      "100": "#e0e7ff",
      "300": "#a5b4fc",
      "500": "#6366f1",
      "600": "#4f46e5",
      "700": "#4338ca"
    },

    "secondary": {
      "name": "Slate / Neutral Accent",
      "200": "#e5e7eb",
      "400": "#9ca3af",
      "600": "#4b5563",
      "800": "#1f2937"
    },

    "grays": {
      "background": "#f9fafb",
      "surface": "#ffffff",
      "surface_muted": "#f3f4f6",
      "border": "#e5e7eb",
      "text_primary": "#111827",
      "text_secondary": "#6b7280"
    },

    "accents": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "danger": "#ef4444"
    }
  },

  "dark_mode": {
    "background": "#0f172a",
    "surface": "#111827",
    "surface_muted": "#1f2937",
    "text_primary": "#e5e7eb",
    "text_secondary": "#9ca3af",
    "border": "#334155",
    "primary_shift": "lighter, more desaturated blue",
    "illustrations": "same SVGs, reduced contrast"
  },

  "typography": {
    "font_style": "humanist sans",
    "scale": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px"
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semibold": 600
    }
  },

  "interactions": {
    "hover": "soft background fade (150–200ms)",
    "focus": "subtle ring, no harsh outline",
    "transitions": "opacity + transform only",
    "empty_states": "never block interaction"
  },

  "accessibility": {
    "contrast": "WCAG AA",
    "hit_targets": "min 40px",
    "keyboard": "full navigability"
  }
}
