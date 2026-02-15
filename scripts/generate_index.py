import json
import os

def generate_index():
    apps_dir = 'apps'
    docs_dir = 'docs'
    output_file = os.path.join(docs_dir, 'index.md')
    
    header = """# Welcome to Tommy's Projects

This is the central hub for my various projects hosted on GitHub Pages.

## Featured Projects

"""
    
    apps = []
    if os.path.exists(apps_dir):
        for filename in os.listdir(apps_dir):
            if filename.endswith('.json'):
                with open(os.path.join(apps_dir, filename), 'r') as f:
                    apps.append(json.load(f))
    
    # Sort apps by name
    apps.sort(key=lambda x: x.get('name', ''))
    
    content = header
    for app in apps:
        name = app.get('name', 'Unnamed App')
        root_path = app.get('root_path', '#')
        description = app.get('description', '')
        docs_path = app.get('docs_path')
        
        content += f"### [{name}]({root_path})\n"
        content += f"{description}\n\n"
        content += f"- **Links:**\n"
        content += f"    - [**Live SPA**]({root_path})\n"
        if docs_path:
            content += f"    - [**Documentation**]({docs_path})\n"
        content += "\n---\n\n"

    # Add footer for other sections
    content += "### [Maps Overview](/maps/)\nA collection of geographic and spatial visualization tools.\n"

    if not os.path.exists(docs_dir):
        os.makedirs(docs_dir)

    with open(output_file, 'w') as f:
        f.write(content)
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    generate_index()
