const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
      content = content.replace(/border-white\/10/g, 'border-foreground/10');
      content = content.replace(/border-white\/5/g, 'border-border');
      content = content.replace(/bg-white\/10/g, 'bg-foreground/10');
      content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-foreground/[0.02]');
      content = content.replace(/bg-white\/\[0\.06\]/g, 'bg-foreground/[0.06]');
      content = content.replace(/border-white\/20/g, 'border-foreground/20');
      
      // Text colors
      content = content.replace(/text-slate-100/g, 'text-foreground');
      content = content.replace(/text-slate-200/g, 'text-foreground');
      content = content.replace(/text-slate-300/g, 'text-foreground\/80');
      content = content.replace(/text-slate-400/g, 'text-muted-foreground');
      content = content.replace(/text-slate-500/g, 'text-muted-foreground\/80');
      content = content.replace(/text-slate-600/g, 'text-muted-foreground\/60');
      content = content.replace(/text-white/g, 'text-foreground');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}
processDir('src/app');
