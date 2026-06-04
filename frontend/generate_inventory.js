const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(Boolean).map(line => line.split('=')));

const supabaseUrl = env['REACT_APP_SUPABASE_URL'];
const supabaseKey = env['REACT_APP_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
"530W Solar PV Module Bifacial Topcon",
"550WP BIFACIAL NON DCR VIKRAM",
"ADANI 575 Solar PV Module Bi-Facial Topcon Perc DCR",
"ADANI MONOPERC HALF CUT BIFACIAL/DCR-540WP",
"Adani Solar 540w BiFacial DCR",
"Adani Solar 545w Mono BiFacial DCR",
"Adani Solar 545w Mono BiFacial DCR 5%",
"Adani Solar 550W BiFacial DCR 12%",
"Adani Solar 550W BiFacial DCR 5%",
"Adani Solar 550W BiFacial Mono Perc DCR",
"Adani Solar 550W BiFacial Mono Perc Non DCR",
"Adani Solar 555w Topcon BiFacial DCR",
"Adani Solar 570w Topcon BiFacial DCR",
"Adani Solar 575w Topcon BiFacial DCR",
"Adani Solar 580w Topcon Bifacial DCR",
"Adani Solar 610W Bifacial Topcon DCR",
"Adani Solar 610W Bifacial Topcon DCR 5%",
"Adani Solar 615 W Topcon DCR 5%",
"Adani Solar 615 W Topcon Non DCR 5%",
"Adani Solar PV Module 545W Bifacial DCR",
"Adani Solar Pv Module 620W Bifacial Topcon Non DCR",
"Adani Solar Pv Module 620W DCR",
"Adani Solar Pv Module 620W Non DCR",
"Amaze 3KW 1PH ON GRID Tie Inverter",
"AMAZE 3KW GTI",
"AMAZE 550 W Solar PV Mod Bifac Mono Perc DCR 5%",
"AMAZE 550 W Solar PV Module Bifacial Mono Perc DCR",
"Amaze 5KW 1PH ON GRID Tie Inverter",
"AMAZE SOLAR AMS545W BIFACIAL DCR LUMINOUS",
"AMAZE SOLAR AMS545W BIFACIAL DCR LUMINOUS 5%",
"AMAZE SOLAR AMS550W BIFACIAL DCR LUMINOUS",
"ANCHOR FASTNER",
"EMMVEE 580w NDCR 12%",
"EmmVee Solar 530w TopCon DCR 5%",
"EmmVee Solar 535w TOPCon DCR",
"EmmVee Solar 540w TopCon DCR 5%",
"EmmVee Solar 550w TopCon DCR",
"EmmVee Solar 600w TopCon DCR 5%",
"GOODWE Solar Inverter GRID TIE GW3000-XS 1PHASE",
"Lum Grid Tie 3kw/1p Nxit130+Dongle 5%",
"Lum S Grid Tie 5kw/3P Nxi 305V3",
"Lum Solar 150HTT + 170w 5%",
"Lum Solar 150HTT 18%",
"Lum Solar 150LTT 18%",
"Lum Solar 200HTT + 170w 5%",
"Lum Solar GTI Nxi130 = DC 4500wp",
"Lum Solar GTI Nxi130 = DC 4500wp 5%",
"Lum Solar GTI Nxi140 = DC 6000wp",
"Lum Solar GTI Nxi140 = DC 6000wp 5%",
"Lum Solar GTI Nxi150 = DC 7500wp",
"Lum Solar GTI Nxi150 = DC 7500wp 5%",
"Lum Solar GTI Nxi305",
"Lum Solar GTI Nxi305 = DC 7500wp",
"Lum Solar GTI Nxi306 = DC 9000wp 5%",
"Lum Solar GTI Nxi310 = DC 15000wp 5%",
"Luminoua Solar Lum545w BiFacial DCR",
"Luminous Solar 610W Bifacial Topcon DCR 5%",
"Luminous Solar Lum540w Bifacial DCR 5%",
"Luminous Solar Lum545w BiFacial DCR 5%",
"Luminous Solar Lum550w BiFacial DCR",
"Luminous Solar Lum550w BiFacial DCR 5%",
"Luminous Solar Lum550wp Mono Perc Half Cut",
"Luminous Solar Lum555w BiFacial DCR",
"Luminous Solar Lum585w TOPCon BiFacial",
"Luminous Solar Lum590w TOPCon BiFacial",
"Luminous Solar Lum595w TOPCon BiFacial 5%",
"LUMINOUS SOLAR PANEL 540W DCR",
"Luminous Solar PE-540w MP Half Cut DCR",
"Luminous Solar PE-550w MP Half Cut",
"Luminous Solar Pv Module 620W Non DCR",
"LUMINOUS SPGS 200H*2+10AMP+595W*1",
"Mc-4 Connector 5%",
"MICROTEK ON GRID SOLAR INVETER 5 KW",
"PREMIER PE 545 BIECIAL",
"Premier PE-540w DCR BiFacial",
"Premier PE-545w MP Half Cut",
"Servotec 3.6 KW Hybrid Inverter 24Volt 18%",
"Servotec 3KW Ongrid Inverter 1 Phase 220V",
"Servotech Hybrid Inverter Sparkle STSP-7548 18%",
"Servotech Ongrid Inverter 5KW 1 Phase",
"Solar Grid Connected On Grid Power Plant",
"Solar Grid TIE Inverter 5KW/3P NXI305 V3",
"Solar Hybrid Inverter",
"Solar Hybride Inv HfNxh 150A-5KW/48v",
"SOLAR MOUNTINGSTRUCTURE (41*41 *2MM21FT)",
"SOLAR MOUNTINGSTRUCTURE (80*40*2MM21FT)",
"Solar Power Generating Off Grid System",
"Solar Power Generating System Set",
"Solar Pv Mod 545m Dcr Bi-Ts Panel 5%",
"Solar Pv Mod 550M BIFACIAL DCR PANEL 5%",
"Solar Pv Mod Lum 595T/24v Panel",
"Solar Set(170w*1+150H*1+Nxg1150/12v*1)",
"Solar Street Light",
"SPG GRID TIE 3.3KWP1PH 560 KIT DCR @5%",
"SPG GRID TIE 3KWP1PH 530WP MONO DCR 5%",
"SPG GRID TIE 3KWP1PH KIT @5%",
"SPG GRID TIE 4KWP1PH 530 WP MONO DCR(Tata)",
"SPG GRID TIE 4KWP1PH 580 WP Bifacial DCR(Tata)",
"SPG GRID TIE 4KWP1PH KIT",
"SPG GRID TIE 4KWP1PH KIT @5%",
"SPG GRID TIE 5KWP1PH 580 WP Bifacial DCR(Tata)",
"Sungrow Inverter 50 KW GTI 5%",
"Tata 575 W DCR Solar Panel",
"Tata 580 W DCR Solar Panel 5%",
"Tata 585 W DCR Solar Panel 5%",
"Tata 590 W DCR Solar Panel 5%",
"Tata 595W (TPREL SPG Grid TIE SYSTEM 3KW KIT) 5%",
"Tata Approved GTI for 3KW Solar Panel Inverter 5%",
"TATA TP Solar Module TP 595W LG 10B (Non DCR) 5%",
"TP Solar Module TP580LG 10B (NON DCR) 5%",
"TP Solar Module TP585LG10B ( Non-DCR)",
"TP Solar Module TP590LG10B (Non-DCR)5%",
"TP Solar Module TP605LG10NB-TOPCON (NON DCR)",
"waaree WS On Grid 1 phase Inverter 3 KVA-Gen-4",
"WAAREE BI-55-540-(DCR)SPGS G-G MODULE 144HC",
"Waaree Bifacial DCR 540wp Mono Module",
"Waaree Bifacial DCR_535wp",
"Waaree Solar 580w Topcon Bifacial DCR",
"Waaree Solar Panel 575W Topcon DCR",
"Waaree Solar Pv Module 555W Top Con DCR 5%",
"Waaree Solar Pv Module 560W Top Con DCR 5%",
"Waaree Solar Pv Module 570W Top Con DCR 5%",
"Waree Solar 535 DCR"
];

function getCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes('inverter') || lower.includes('gti')) return 'Inverter';
  if (lower.includes('battery') || lower.includes('htt') || lower.includes('ltt')) return 'Battery';
  if (lower.includes('structure') || lower.includes('fastner') || lower.includes('connector')) return 'BOS / Structure';
  if (lower.includes('system') || lower.includes('plant')) return 'System Kit';
  return 'Solar Panel'; 
}

async function run() {
  const dataToInsert = items.map(item => ({
    name: item,
    category: getCategory(item),
    unit: 'pcs',
    stock: 100, // Starting stock
    low_stock_threshold: 10,
    is_active: true
  }));

  console.log(`Inserting ${dataToInsert.length} items...`);
  
  const { data, error } = await supabase
    .from('inventory')
    .insert(dataToInsert);

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted all items!');
  }
}

run();
