import unittest
import os
import json
import shutil
import tempfile
import sys

# Add the scripts directory to sys.path so we can import generate_index
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../scripts')))
from generate_index import generate_index

class TestGenerateIndex(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory
        self.test_dir = tempfile.mkdtemp()
        self.old_cwd = os.getcwd()
        os.chdir(self.test_dir)
        
        # Setup mock structure
        os.makedirs('apps')
        os.makedirs('docs')

    def tearDown(self):
        # Change back to old cwd and remove temp dir
        os.chdir(self.old_cwd)
        shutil.rmtree(self.test_dir)

    def test_generate_index_with_single_app(self):
        # Create a mock app JSON
        app_data = {
            "name": "Test App",
            "root_path": "/test-app/",
            "docs_path": "/test-app/docs/",
            "description": "This is a test description."
        }
        with open('apps/test_app.json', 'w') as f:
            json.dump(app_data, f)

        # Run the generation
        generate_index()

        # Verify output
        output_path = 'docs/index.md'
        self.assertTrue(os.path.exists(output_path))
        
        with open(output_path, 'r') as f:
            content = f.read()
            
        self.assertIn("### [Test App](/test-app/)", content)
        self.assertIn("This is a test description.", content)
        self.assertIn("[**Live SPA**](/test-app/)", content)
        self.assertIn("[**Documentation**](/test-app/docs/)", content)

    def test_generate_index_sorting(self):
        # Create two mock apps out of order
        apps = [
            {"name": "Zebra", "root_path": "/z/"},
            {"name": "Alpha", "root_path": "/a/"}
        ]
        
        for app in apps:
            with open(f"apps/{app['name'].lower()}.json", 'w') as f:
                json.dump(app, f)

        # Run the generation
        generate_index()

        with open('docs/index.md', 'r') as f:
            content = f.read()
            
        # Check that Alpha appears before Zebra
        alpha_pos = content.find("Alpha")
        zebra_pos = content.find("Zebra")
        self.assertTrue(alpha_pos < zebra_pos)

    def test_generate_index_missing_docs_path(self):
        # Create an app without a docs_path
        app_data = {
            "name": "No Docs App",
            "root_path": "/no-docs/",
            "description": "No docs here."
        }
        with open('apps/no_docs.json', 'w') as f:
            json.dump(app_data, f)

        # Run the generation
        generate_index()

        with open('docs/index.md', 'r') as f:
            content = f.read()
            
        self.assertIn("No Docs App", content)
        self.assertNotIn("[**Documentation**]", content.split("### [No Docs App]")[1].split("---")[0])

if __name__ == '__main__':
    unittest.main()
