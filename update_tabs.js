const fs = require('fs');
const file = 'frontend/src/components/CaseDrawerTabs/ItemDetailsTab.jsx';
let content = fs.readFileSync(file, 'utf8');

const t1 = `  if (s.structure && String(s.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: s.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  return rows;`;

const r1 = `  if (s.structure && String(s.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: s.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  rows.push({
    description: "Wiring",
    brand: "",
    capacity: s.wiring || s.wireCoreM || "4 Square MM (Polycab/Havells/KEI) (Copper - Armoured)",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Earthing",
    brand: "",
    capacity: s.earthing ? String(s.earthing) : "2.5",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Earth Cable",
    brand: "",
    capacity: s.earthCable || s.earth_cable || "2.5 sq mm",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Installation and Net Metering",
    brand: "",
    capacity: s.installation || "Added",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "BOS (Balance of System)",
    brand: "",
    capacity: s.bos || "Complete Set",
    quantity: "Set 1",
    warranty: "-",
  });

  return rows;`;

const t2 = `  if (q.structure && String(q.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: q.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  return rows;`;

const r2 = `  if (q.structure && String(q.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: q.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  rows.push({
    description: "Wiring",
    brand: "",
    capacity: q.wiring || "4 Square MM (Polycab/Havells/KEI) (Copper - Armoured)",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Earthing",
    brand: "",
    capacity: q.earthing ? String(q.earthing) : "2.5",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Earth Cable",
    brand: "",
    capacity: q.earthCable || q.earth_cable || "2.5 sq mm",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "Installation and Net Metering",
    brand: "",
    capacity: q.installation || "Added",
    quantity: "-",
    warranty: "-",
  });

  rows.push({
    description: "BOS (Balance of System)",
    brand: "",
    capacity: q.bos || "Complete Set",
    quantity: "Set 1",
    warranty: "-",
  });

  return rows;`;

content = content.replace(t1, r1);
content = content.replace(t2, r2);

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
