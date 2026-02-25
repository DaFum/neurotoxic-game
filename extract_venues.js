import fs from 'fs'

const content = fs.readFileSync('./src/data/chatter.js', 'utf8')

// Use regex to find the VENUE_CHATTER_DB array
const venueMatch = content.match(
  /const VENUE_CHATTER_DB = (\[[\s\S]*?\])\s*?\n\nexport const getRandomChatter/m
)

if (venueMatch) {
  const venueData = `export const VENUE_CHATTER_DB = ${venueMatch[1]};`
  fs.writeFileSync('./src/data/chatter/venueChatter.js', venueData)
  console.log(
    'SUCCESS: Extracted VENUE_CHATTER_DB to ./src/data/chatter/venueChatter.js'
  )
} else {
  console.error('FAILURE: Could not find VENUE_CHATTER_DB in chatter.js')
  process.exit(1)
}
