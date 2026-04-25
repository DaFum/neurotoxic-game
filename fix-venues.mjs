import fs from 'fs';
let content = fs.readFileSync('src/data/venues.ts', 'utf-8');
const newVenue = `  },
  {
    id: 'the_void_stage',
    name: 'venues:the_void_stage.name',
    x: 70,
    y: 80,
    type: 'FESTIVAL',
    capacity: 10000,
    pay: 20000,
    diff: 5,
    price: 60
  }
]`;
content = content.replace('  }\n]', newVenue);
fs.writeFileSync('src/data/venues.ts', content);
