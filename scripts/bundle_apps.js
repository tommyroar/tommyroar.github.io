import fs from 'fs';
import path from 'path';

const appsDir = './apps';
const publicThumbnailsDir = './public/thumbnails';
const outputFile = './src/data/projects.json';

if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data', { recursive: true });
}

if (!fs.existsSync(publicThumbnailsDir)) {
  fs.mkdirSync(publicThumbnailsDir, { recursive: true });
}

const projects = [];
if (fs.existsSync(appsDir)) {
  const files = fs.readdirSync(appsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const baseName = path.basename(file, '.json');
      const data = JSON.parse(fs.readFileSync(path.join(appsDir, file), 'utf8'));
      
      // Check for matching png thumbnail
      const thumbFile = `${baseName}.png`;
      if (files.includes(thumbFile)) {
        fs.copyFileSync(path.join(appsDir, thumbFile), path.join(publicThumbnailsDir, thumbFile));
        data.thumbnail = `/thumbnails/${thumbFile}`;
      }
      
      projects.push(data);
    }
  }
}

projects.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outputFile, JSON.stringify(projects, null, 2));
console.log(`Successfully bundled ${projects.length} projects to ${outputFile}`);
