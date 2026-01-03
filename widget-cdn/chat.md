{
  "component": "ChatWidget",
  "purpose": "Embedded customer support / assistant chat widget",
  "positioning": {
    "launcher": {
      "type": "floatingActionButton",
      "placement": "bottom-right",
      "offset": {
        "desktop": "24px",
        "mobile": "16px"
      },
      "shape": "circle",
      "size": {
        "desktop": 56,
        "mobile": 48
      },
      "icon": "chat-bubble",
      "badge": {
        "optional": true,
        "useCase": "unread messages",
        "shape": "circle",
        "size": 8
      }
    },
    "panel": {
      "type": "modal-popover",
      "anchor": "launcher",
      "maxWidth": 380,
      "minWidth": 320,
      "height": {
        "desktop": 520,
        "mobile": "100vh"
      },
      "borderRadius": {
        "desktop": 14,
        "mobile": 0
      },
      "shadow": "xl soft ambient"
    }
  },

  "layout": {
    "structure": [
      "Header",
      "Conversation",
      "Composer"
    ],
    "flow": "vertical",
    "spacing": {
      "sectionGap": 12,
      "messageGap": 10
    }
  },

  "header": {
    "height": 56,
    "alignment": "horizontal",
    "elements": [
      {
        "type": "avatar",
        "shape": "circle",
        "size": 28,
        "background": "primary",
        "text": "V"
      },
      {
        "type": "titleGroup",
        "title": "Digital Assistant",
        "subtitle": "Today, 2:24pm"
      },
      {
        "type": "action",
        "icon": "close",
        "hitArea": 32
      }
    ],
    "behavior": {
      "sticky": true
    }
  },

  "conversation": {
    "scrollable": true,
    "padding": 16,
    "background": "surface",
    "timestampStyle": {
      "fontSize": 12,
      "opacity": 0.6,
      "alignment": "center"
    },
    "messages": {
      "assistant": {
        "alignment": "left",
        "avatar": {
          "visible": true,
          "size": 24,
          "background": "primary",
          "text": "V"
        },
        "bubble": {
          "maxWidth": "75%",
          "borderRadius": "16 16 16 4",
          "background": "secondary-100",
          "textColor": "foreground"
        }
      },
      "user": {
        "alignment": "right",
        "avatar": {
          "visible": false
        },
        "bubble": {
          "maxWidth": "75%",
          "borderRadius": "16 16 4 16",
          "background": "secondary-50",
          "textColor": "foreground"
        }
      },
      "typingIndicator": {
        "dots": 3,
        "animation": "pulse",
        "alignment": "left"
      }
    }
  },

  "composer": {
    "height": "auto",
    "padding": 12,
    "elements": [
      {
        "type": "input",
        "placeholder": "Type here…",
        "multiline": true,
        "maxRows": 4
      },
      {
        "type": "actions",
        "icons": [
          "emoji",
          "attachment",
          "send"
        ]
      }
    ],
    "sendButton": {
      "shape": "circle",
      "size": 36,
      "state": {
        "disabled": "no input",
        "active": "primary"
      }
    }
  },

  "colorSystem": {
    "primary": {
      "name": "Blue",
      "scale": {
        "500": "#2563EB",
        "600": "#1D4ED8"
      }
    },
    "secondary": {
      "name": "Indigo / Soft Blue",
      "scale": {
        "50": "#F5F7FF",
        "100": "#EEF2FF"
      }
    },
    "grays": {
      "background": "#FFFFFF",
      "surface": "#F9FAFB",
      "border": "#E5E7EB",
      "textPrimary": "#111827",
      "textSecondary": "#6B7280",
      "muted": "#9CA3AF"
    },
    "accents": {
      "shadow": "rgba(0,0,0,0.12)",
      "divider": "rgba(0,0,0,0.06)"
    }
  },

  "darkMode": {
    "background": "#0F172A",
    "surface": "#020617",
    "primary": "#3B82F6",
    "secondary": {
      "assistantBubble": "#1E293B",
      "userBubble": "#0B1220"
    },
    "text": {
      "primary": "#E5E7EB",
      "secondary": "#94A3B8"
    },
    "border": "#1E293B",
    "shadow": "rgba(0,0,0,0.6)"
  },

  "typography": {
    "fontFamily": "system-ui",
    "sizes": {
      "title": 14,
      "body": 14,
      "caption": 12
    },
    "weights": {
      "title": 600,
      "body": 400
    },
    "lineHeight": 1.4
  },

  "motion": {
    "panel": {
      "enter": "fade + slide-up",
      "exit": "fade + slide-down"
    },
    "messages": {
      "enter": "fade + slight translate"
    }
  },

  "responsiveBreakpoints": {
    "sm": "≥640px",
    "md": "≥768px",
    "lg": "≥1024px",
    "xl": "≥1280px",
    "2xl": "≥1536px"
  },

  "accessibility": {
    "contrast": "WCAG AA",
    "focusRings": true,
    "keyboardNavigation": true,
    "ariaRoles": [
      "dialog",
      "log",
      "textbox",
      "button"
    ]
  }
}
