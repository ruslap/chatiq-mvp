import os

# Paths
base_dir = "/opt/chtq/widget-cdn/src/ui"
styles_src = os.path.join(base_dir, "extracted_styles.css")
template_src = os.path.join(base_dir, "extracted_template.html")
styles_dest = os.path.join(base_dir, "styles.ts")
template_dest = os.path.join(base_dir, "template.ts")

# Read files
with open(styles_src, "r") as f:
    raw_styles = f.read()

with open(template_src, "r") as f:
    raw_template = f.read()

# Process Styles
# Remove "  const styles = `" from start
if "const styles = `" in raw_styles:
    css_content = raw_styles.split("const styles = `", 1)[1]
else:
    css_content = raw_styles

# Process Template file to split remaining CSS and HTML
# Find "const html = `"
if "const html = `" in raw_template:
    parts = raw_template.split("const html = `")
    remaining_css = parts[0]
    html_content = parts[1]
else:
    # Fallback or error
    remaining_css = ""
    html_content = raw_template

# Clean up CSS
# The remaining_css might end with `  `;` or just `;`
remaining_css = remaining_css.strip()
if remaining_css.endswith("`;"):
    remaining_css = remaining_css[:-2]
elif remaining_css.endswith("`"):
    remaining_css = remaining_css[:-1]

full_css = css_content + "\n" + remaining_css
# Remove trailing backtick/semicolon from full_css if present (from first part if split didn't work as expected, but here we concatenated)
# Actually raw_styles didn't have the closing backtick because we cut it with sed at line 2156, but the closing was later.
# So raw_styles is properly open-ended.
# remaining_css comes from lines 2157... which ends with `;`
# So full_css is the content inside ` ... `.

# Clean up HTML
# html_content starts after `const html = ``, so it is the body.
# It ends with `;`
html_content = html_content.strip()
if html_content.endswith(";"):
    html_content = html_content[:-1]
if html_content.endswith("`"):
    html_content = html_content[:-1]


# Generate styles.ts
styles_ts = f"""import type {{ HSL }} from "../types";

export function getStyles(accentColor: string, secondaryColorValue: string, accentHSL: HSL): string {{
  return `{full_css}`;
}}
"""

# Generate template.ts
template_ts = f"""import {{ t }} from "../i18n";
import {{ ALLOWED_FILE_TYPES }} from "../config";

export function getTemplate(
  styles: string,
  agentName: string,
  agentAvatar: string | null,
  welcomeMessage: string,
  soundEnabled: boolean,
  position: 'left' | 'right'
): string {{
  return `{html_content}`;
}}
"""

# Write files
with open(styles_dest, "w") as f:
    f.write(styles_ts)

with open(template_dest, "w") as f:
    f.write(template_ts)

print("Files generated successfully.")
