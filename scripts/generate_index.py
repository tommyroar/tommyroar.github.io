import json
import os

def generate_index():
    apps_dir = 'apps'
    docs_dir = 'docs'
    output_file = os.path.join(docs_dir, 'index.md')
    
    header = "# Welcome to Tommy's Projects

This is the central hub for my various projects hosted on GitHub Pages.

## Featured Projects

"
    
    apps = []
    for filename in os.listdir(apps_dir):
        if filename.endswith('.json'):
            with open(os.path.join(apps_dir, filename), 'r') as f:
                apps.append(json.load(f))
    
    # Sort apps by name or another criteria if desired
    apps.sort(key=lambda x: x.get('name', ''))
    
    content = header
    for app in apps:
        name = app.get('name', 'Unnamed App')
        root_path = app.get('root_path', '#')
        description = app.get('description', '')
        docs_path = app.get('docs_path')
        
        content += f"### [{name}]({root_path})
"
        content += f"{description}

"
        content += f"- **Links:**
"
        content += f"    - [**Live SPA**]({root_path})
"
        if docs_path:
            content += f"    - [**Documentation**]({docs_path})
"
        content += "
---

"

    # Add back the Maps Overview or any footer
    content += "### [Maps Overview](/maps/)
A collection of geographic and spatial visualization tools.
"

    with open(output_file, 'w') as f:
        f.write(content)
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    generate_index()
