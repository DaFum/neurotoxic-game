const fs = require('fs');

let cp = fs.readFileSync('src/components/postGig/CompletePhase.jsx', 'utf8');

cp = cp.replace("return (\n     {/* Background Image Watermark */}\n    <div", "return (\n    <>\n     {/* Background Image Watermark */}\n    <div");
cp = cp.replace("  </motion.div>\n    </motion.div>\n  )\n}", "  </motion.div>\n    </motion.div>\n    </>\n  )\n}");

fs.writeFileSync('src/components/postGig/CompletePhase.jsx', cp);
