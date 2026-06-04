// Automated routing and issue detection engine
// Matches keywords in user's text (or voice transcript) to auto-route issues to departments.

export const DEPARTMENTS = {
  1: { id: 1, name: 'Municipal Corporation', icon: 'city', color: '#2e7d32', bg: '#e8f5e9' },
  2: { id: 2, name: 'TANGEDCO', icon: 'zap', color: '#6a1b9a', bg: '#f3e5f5' },
  3: { id: 3, name: 'CMWSSB', icon: 'droplets', color: '#0288d1', bg: '#e0f2f1' },
  4: { id: 4, name: 'Agriculture', icon: 'sprout', color: '#f57f17', bg: '#fff8e1' },
  5: { id: 5, name: 'Health', icon: 'heart-pulse', color: '#1565c0', bg: '#e3f2fd' },
  6: { id: 6, name: 'Education', icon: 'graduation-cap', color: '#7f0000', bg: '#ffebee' },
  7: { id: 7, name: 'Transport', icon: 'bus', color: '#880e4f', bg: '#fce4ec' },
  8: { id: 8, name: 'Police', icon: 'shield', color: '#1a237e', bg: '#e8eaf6' },
  9: { id: 9, name: 'Housing', icon: 'home', color: '#2e7d32', bg: '#e8f5e9' },
  10: { id: 10, name: 'Environment', icon: 'leaf', color: '#2e7d32', bg: '#e8f5e9' },
  11: { id: 11, name: 'Labour', icon: 'hard-hat', color: '#e65100', bg: '#fff3e0' },
  12: { id: 12, name: 'Industries', icon: 'factory', color: '#4a148c', bg: '#f3e5f5' },
  13: { id: 13, name: 'Food & Civil Supplies', icon: 'package', color: '#bf360c', bg: '#fff8e1' },
  14: { id: 14, name: 'Revenue', icon: 'landmark', color: '#5d4037', bg: '#efebe9' },
  15: { id: 15, name: 'Rural Development', icon: 'tree-pine', color: '#1b5e20', bg: '#e8f5e9' },
  16: { id: 16, name: 'Social Welfare', icon: 'users', color: '#d81b60', bg: '#fce4ec' },
  17: { id: 17, name: 'Registration', icon: 'file-check', color: '#37474f', bg: '#eceff1' }
};

const KEYWORD_MAP = {
  1: [ // Municipal Corporation
    'road', 'street', 'pothole', 'garbage', 'trash', 'waste', 'dump', 'dustbin', 
    'bin', 'drainage', 'sewage', 'clog', 'block', 'toilet', 'public toilet', 
    'cleaning', 'clean', 'sweep', 'sanitation', 'park', 'tax', 'property', 
    'municipal', 'corporation', 'ripon', 'sweeper', 'debris', 'encroachment',
    'bad road', 'damaged road', 'broken road', 'road damage', 'rd damage',
    'rd break', 'rd hole', 'street light', 'manhole', 'footpath',
    'சாக்கடை', 'குப்பை', 'சாலை', 'தெரு'
  ],
  2: [ // TANGEDCO (Electricity)
    'electricity', 'power', 'current', 'shock', 'transformer', 'voltage', 'light', 
    'street light', 'bulb', 'eb', 'tneb', 'tangedco', 'meter', 'outage', 'blackout', 
    'wire', 'cable', 'bill', 'line', 'short circuit', 'power cut', 'fuse', 'generator',
    'pwr', 'elec', 'elecric', 'powercut', 'powerfail', 'power outage', 'no power', 'no current',
    'மின்சாரம்', 'மின்', 'கரண்ட்', 'மின்வெட்டு'
  ],
  3: [ // CMWSSB (Water Board)
    'water', 'drinking water', 'borewell', 'sewage', 'drainage', 'leak', 'pipe', 
    'tap', 'well', 'tanker', 'tank', 'chlorine', 'metro water', 'cmwssb', 'pipeline',
    'no water', 'water shortage', 'water supply', 'water problem', 'wtr',
    'குடிநீர்', 'நீர்', 'குழாய்', 'தண்ணீர்'
  ],
  4: [ // Agriculture
    'farmer', 'farming', 'crop', 'seed', 'fertilizer', 'soil', 'harvest', 'agriculture', 
    'subsidy', 'loan', 'irrigation', 'pesticide', 'cultivation', 'monsoon damage',
    'விவசாயி', 'விவசாயம்', 'பயிர்', 'உரம்'
  ],
  5: [ // Health
    'hospital', 'health', 'medicine', 'doctor', 'nurse', 'clinic', 'pharmacy', 
    'vaccine', 'vaccination', 'insurance', 'patient', 'ambulance', 'disease', 
    'medical', 'phc', 'dms', 'gh', 'first aid', 'treatment', 'hosp', 'med',
    'மருத்துவமனை', 'மருந்து', 'சுகாதாரம்', 'டாக்டர்'
  ],
  6: [ // Education
    'school', 'education', 'teacher', 'student', 'class', 'classroom', 'textbook', 
    'exam', 'laptop', 'scholarship', 'admission', 'college', 'tc', 'dpi', 'uniform', 
    'mid-day meal', 'noon meal', 'syllabus',
    'பள்ளி', 'கல்வி', 'மாணவர்', 'ஆசிரியர்'
  ],
  7: [ // Transport
    'bus', 'transport', 'route', 'conductor', 'driver', 'license', 'licence', 
    'rto', 'registration', 'vehicle', 'rc', 'permit', 'traffic', 'bus stand', 
    'depot', 'tnstc', 'bus pass',
    'பேருந்து', 'பஸ்', 'போக்குவரத்து', 'உரிமம்'
  ],
  8: [ // Police
    'police', 'theft', 'crime', 'robbery', 'thief', 'steal', 'rob', 'burglar', 
    'assault', 'violence', 'fir', 'safety', 'fight', 'dispute', 'scam', 'fraud', 
    'cyber', 'extortion', 'threat', 'bribe', 'corruption', 'kavalan', 'cop', 'station',
    'stolen', 'robbed', 'mugging', 'molestation', 'harassment', 'missing person',
    'போலீஸ்', 'திருட்டு', 'பாதுகாப்பு', 'குற்றம்'
  ],
  9: [ // Housing
    'house', 'housing', 'flat', 'building', 'tnhb', 'pmay', 'slum', 'tenement', 
    'allotment', 'rent', 'construction', 'board', 'residential',
    'வீடு', 'வீட்டு வசதி'
  ],
  10: [ // Environment
    'environment', 'pollution', 'tree', 'cutting', 'deforestation', 'forest', 
    'noise', 'air', 'river', 'lake', 'smoke', 'dust', 'plastic', 'wildlife', 
    'wetland', 'eco-friendly',
    'சுற்றுச்சூழல்', 'மாசு', 'மரம்'
  ],
  11: [ // Labour
    'labour', 'salary', 'wage', 'pay', 'worker', 'employee', 'employer', 'pf', 
    'esi', 'exploitation', 'child labour', 'workplace', 'factory', 'union',
    'தொழிலாளர்', 'சம்பளம்', 'வேலை'
  ],
  12: [ // Industries
    'industry', 'industries', 'factory', 'startup', 'msme', 'business', 
    'entrepreneur', 'seed fund', 'sipcot', 'tidco', 'manufacturing',
    'தொழில்', 'தொழிற்சாலை'
  ],
  13: [ // Food & Civil Supplies
    'food', 'ration', 'pds', 'smart card', 'civil supplies', 'sugar', 'rice', 
    'kerosene', 'oil', 'shop', 'dealer', 'tnpdsc',
    'ரேஷன்', 'அரிசி', 'சர்க்கரை', 'அட்டை'
  ],
  14: [ // Revenue
    'revenue', 'land', 'patta', 'chitta', 'vao', 'taluk', 'certificate', 
    'income', 'community', 'boundary', 'stamp', 'survey',
    'வருவாய்', 'நிலம்', 'பட்டா', 'சான்றிதழ்'
  ],
  15: [ // Rural Development
    'village', 'rural', 'panchayat', 'road', 'well', 'mgnrega', 'employment', 
    'rural development', 'block development',
    'கிராமம்', 'பஞ்சாயத்து'
  ],
  16: [ // Social Welfare
    'welfare', 'social', 'pension', 'women', 'child', 'elderly', 'handicapped', 
    'disabled', 'widow', 'marriage grant', 'destitute',
    'சமூக நலன்', 'ஓய்வூதியம்'
  ],
  17: [ // Registration
    'registration', 'register', 'marriage', 'deed', 'land registry', 
    'sub registrar', 'guideline', 'stamp duty', 'document',
    'பதிவு', 'பத்திரம்'
  ]
};

// Returns { deptId: number, deptName: string, confidence: number }
export function detectDepartment(text) {
  if (!text || typeof text !== 'string') {
    return { deptId: 1, name: DEPARTMENTS[1].name, confidence: 0 };
  }

  const normalized = text.toLowerCase();
  let maxScore = 0;
  let bestDeptId = 1; // Default to Municipal Corporation

  Object.entries(KEYWORD_MAP).forEach(([deptIdStr, keywords]) => {
    const deptId = parseInt(deptIdStr, 10);
    let score = 0;

    keywords.forEach(keyword => {
      // Direct substring match
      if (normalized.includes(keyword)) {
        score += 10;
        
        // Exact word match gets extra weight
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(normalized)) {
          score += 15;
        }
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestDeptId = deptId;
    }
  });

  const confidence = Math.min(100, Math.round((maxScore / 40) * 100)); // Normalize confidence to a percentage

  return {
    deptId: bestDeptId,
    name: DEPARTMENTS[bestDeptId].name,
    confidence: maxScore > 0 ? confidence : 0
  };
}

// ============================================================
// HYBRID LLM ROUTING (Keyword Fast-Path + LLM Fallback)
// ============================================================

const DEPARTMENT_DESCRIPTIONS = Object.values(DEPARTMENTS).map(d => `${d.id}. ${d.name}`).join('\n');

const SYSTEM_PROMPT = `You are a Tamil Nadu government grievance routing assistant.
Given a citizen complaint, identify the SINGLE most relevant department from this list:

${DEPARTMENT_DESCRIPTIONS}

IMPORTANT ABBREVIATION RULES:
- "rd" or "road" with damage/pothole/traffic/garbage = Municipal Corporation (ID 1)
- "rd" ONLY when context is about villages/panchayat/employment = Rural Development (ID 15)
- "pwr", "elec", "current", "light", "eb", "transformer" = TANGEDCO (ID 2)
- "wtr", "tap", "pipeline", "borewell" = CMWSSB (ID 3)
- "hosp", "medicine", "doctor" = Health (ID 5)
- "police", "theft", "stolen", "cop" = Police (ID 8)

Respond ONLY with a JSON object: {"deptId": number, "reason": "short explanation"}
Do not include markdown, code fences, or any other text.`;

/**
 * Calls an OpenAI-compatible LLM API to classify a complaint.
 * Works with OpenAI, Anthropic (via adapter), Groq, Fireworks, or any custom endpoint.
 */
export async function detectDepartmentLLM(text, apiKey, model = 'gpt-4o-mini', baseUrl = 'https://api.openai.com/v1') {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Complaint: "${text}"` }
      ],
      temperature: 0.1,
      max_tokens: 80
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content?.trim() || '';

  // Try to extract JSON from the response (handles occasional markdown fences)
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  const deptId = parseInt(parsed.deptId, 10);

  if (!DEPARTMENTS[deptId]) {
    throw new Error(`LLM returned unknown deptId: ${deptId}`);
  }

  return {
    deptId: deptId,
    name: DEPARTMENTS[deptId].name,
    confidence: 95, // LLM results treated as high-confidence
    source: 'llm',
    reason: parsed.reason || 'Classified by AI model'
  };
}

/**
 * Hybrid router:
 * 1. Fast keyword detection (< 10ms, offline)
 * 2. If confidence < threshold AND LLM API key configured → call LLM
 * 3. Fall back to keyword result if LLM fails
 *
 * Returns { deptId, name, confidence, source, reason? }
 */
export async function routeComplaint(text, llmConfig = null, confidenceThreshold = 40) {
  const keywordResult = detectDepartment(text);

  // If keyword confidence is high enough, use it immediately
  if (keywordResult.confidence >= confidenceThreshold) {
    return { ...keywordResult, source: 'keyword', reason: 'Matched keywords' };
  }

  // If LLM not configured or no API key, fall back to keyword
  if (!llmConfig?.apiKey) {
    return { ...keywordResult, source: 'keyword', reason: 'Low confidence; LLM not configured' };
  }

  // Try LLM for ambiguous cases
  try {
    const llmResult = await detectDepartmentLLM(
      text,
      llmConfig.apiKey,
      llmConfig.model || 'gpt-4o-mini',
      llmConfig.baseUrl || 'https://api.openai.com/v1'
    );
    return llmResult;
  } catch (err) {
    console.warn('LLM routing failed, falling back to keyword:', err.message);
    return { ...keywordResult, source: 'keyword', reason: `LLM error: ${err.message}` };
  }
}

// ============================================================
// DEBUG / TEST SUITE
// Run in browser console: window.testRouting()
// ============================================================

const TEST_CASES = [
  // English — clear keyword matches
  { text: 'Water has not been coming for 3 days', expect: 'CMWSSB' },
  { text: 'Pothole is dangerous near Ambattur corner', expect: 'Municipal Corporation' },
  { text: 'Transformer has short circuit and sparks', expect: 'TANGEDCO' },
  { text: 'Someone stole my cycle from school parking', expect: 'Police' },
  { text: 'No power since yesterday night', expect: 'TANGEDCO' },
  { text: 'Garbage is piling up on 4th street', expect: 'Municipal Corporation' },
  { text: 'Hospital has no doctors available', expect: 'Health' },

  // English — abbreviations / slang
  { text: 'pwr cut in area', expect: 'TANGEDCO' },
  { text: 'rd damage', expect: 'Municipal Corporation' },
  { text: 'no wtr since morning', expect: 'CMWSSB' },
  { text: 'stolen mobile phone', expect: 'Police' },
  { text: 'elec bill is too high', expect: 'TANGEDCO' },

  // Tamil
  { text: 'குடிநீர் வரவில்லை மூன்று நாட்களாக', expect: 'CMWSSB' },
  { text: 'எங்கள் தெருவில் மின்சாரம் இல்லை', expect: 'TANGEDCO' },
  { text: 'சாலையில் பள்ளம் ஆபத்தானது', expect: 'Municipal Corporation' },
  { text: 'குப்பை குவிந்துள்ளது', expect: 'Municipal Corporation' },
  { text: 'என் சைக்கிள் திருடப்பட்டது', expect: 'Police' },

  // Ambiguous / complex (needs LLM)
  { text: 'My street has been dark for two nights and garbage is piling up', expect: 'Municipal Corporation' },
  { text: 'The contractor took money and never came back', expect: 'Revenue' },
  { text: 'No electricity and water both are gone since cyclone', expect: 'TANGEDCO' },
];

export function testRouting() {
  console.log('\n========== ROUTING TEST SUITE ==========\n');
  let passed = 0;
  let failed = 0;

  TEST_CASES.forEach(({ text, expect }) => {
    const result = detectDepartment(text);
    const ok = result.name === expect;
    const status = ok ? '✅ PASS' : '❌ FAIL';
    const confidence = result.confidence;
    if (ok) passed++; else failed++;
    console.log(`${status} | "${text}"`);
    console.log(`       → Got: ${result.name} (${confidence}%) | Expected: ${expect}`);
    if (!ok) {
      console.log(`       ⚠️  Keyword-only result. Enable LLM for ambiguous cases.`);
    }
    console.log('');
  });

  console.log(`Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length}`);
  console.log('To test with LLM, call: await window.testRoutingLLM(apiKey, baseUrl, model)');
  console.log('========================================\n');
}

// Async LLM test for browser console
export async function testRoutingLLM(apiKey, baseUrl = 'https://api.groq.com/openai/v1', model = 'llama-3.1-8b-instant') {
  const llmConfig = { apiKey, baseUrl, model };
  console.log('\n========== LLM ROUTING TEST ==========\n');

  for (const { text, expect } of TEST_CASES) {
    const result = await routeComplaint(text, llmConfig, 40);
    const ok = result.name === expect;
    const status = ok ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} [${result.source}] | "${text}"`);
    console.log(`       → Got: ${result.name} (${result.confidence}%) | Expected: ${expect}`);
    if (result.reason) console.log(`       → Reason: ${result.reason}`);
    console.log('');
  }
  console.log('=====================================\n');
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  window.testRouting = testRouting;
  window.testRoutingLLM = testRoutingLLM;
  window.routeComplaint = routeComplaint;
  window.detectDepartment = detectDepartment;
}
