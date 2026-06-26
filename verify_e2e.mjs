// E2E API Verification Script
// Tests agent restrictions, traveler linking, and co-traveler portal access

const BASE = 'http://localhost:3001/api';

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { headers });
  const data = await res.json();
  return { status: res.status, data };
}

async function put(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { method: 'PUT', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  const results = [];
  const log = (test, pass, detail) => {
    results.push({ test, pass, detail });
    console.log(`${pass ? '✅' : '❌'} ${test}: ${detail}`);
  };

  // 1. Admin login
  const adminLogin = await post('/auth/login', { email: 'admin@borderlesstrips.com', password: 'admin123' });
  const adminToken = adminLogin.data.token;
  log('Admin Login', !!adminToken, adminToken ? 'Got token' : 'No token');

  // 2. Create agent staff
  const agentCreate = await post('/auth/create-staff', {
    name: 'Agent Smith', email: 'agentsmith@test.com', password: 'agent123', sub_role: 'agent'
  }, adminToken);
  log('Create Agent Staff', agentCreate.status === 200 || agentCreate.status === 201, 
    `Status: ${agentCreate.status} - ${JSON.stringify(agentCreate.data).substring(0, 100)}`);

  // 3. Get visa apps as admin
  const adminVisas = await get('/visa/applications', adminToken);
  log('Admin sees all visas', adminVisas.status === 200, `Count: ${adminVisas.data?.length || 0}`);

  // 4. Get first visa app and assign to agent
  let visaId = null;
  if (adminVisas.data?.length > 0) {
    visaId = adminVisas.data[0].id;
    
    // Find the agent's user ID
    const staffRes = await get('/auth/staff', adminToken);
    const agentUser = staffRes.data?.find(s => s.email === 'agentsmith@test.com');
    const agentId = agentUser?.id;
    log('Find Agent ID', !!agentId, `Agent ID: ${agentId}`);

    if (agentId) {
      // Assign visa to agent
      const assignRes = await put(`/visa/applications/${visaId}`, { assigned_to: agentId }, adminToken);
      log('Assign Visa to Agent', assignRes.status === 200, `Status: ${assignRes.status}`);

      // Add traveler with email
      const currentVisa = await get(`/visa/applications/${visaId}`, adminToken);
      const currentTravelers = currentVisa.data?.travelers_json || [];
      const newTravelers = [...currentTravelers, { name: 'John Doe', passport: 'AB12345', email: 'johndoe@traveler.com' }];
      const travelerRes = await put(`/visa/applications/${visaId}`, { travelers: newTravelers }, adminToken);
      log('Add Traveler with Email', travelerRes.status === 200, `Status: ${travelerRes.status}`);

      // Verify auto-created account
      const updatedVisa = await get(`/visa/applications/${visaId}`, adminToken);
      const travelers = updatedVisa.data?.travelers_json || [];
      const johnTraveler = travelers.find(t => t.email === 'johndoe@traveler.com');
      log('Auto-Created User Linked', !!johnTraveler?.user_id, `user_id: ${johnTraveler?.user_id || 'NONE'}`);

      // Add requested document assigned to John Doe
      const currentDocs = updatedVisa.data?.documents_json || [];
      const newDocs = [...currentDocs, { 
        id: 'req_test_vacc', name: 'Vaccination Card', is_requested: true, 
        status: 'pending_upload', filename: '', url: '', traveler_name: 'John Doe' 
      }];
      const docRes = await put(`/visa/applications/${visaId}`, { documents: newDocs }, adminToken);
      log('Request Doc for Traveler', docRes.status === 200, `Status: ${docRes.status}`);

      // 5. Login as agent
      const agentLogin = await post('/auth/login', { email: 'agentsmith@test.com', password: 'agent123' });
      const agentToken = agentLogin.data.token;
      log('Agent Login', !!agentToken, agentToken ? 'Got token' : 'FAILED');

      if (agentToken) {
        // Agent should see only assigned visa
        const agentVisas = await get('/visa/applications', agentToken);
        log('Agent sees only assigned visas', agentVisas.data?.length === 1, `Count: ${agentVisas.data?.length || 0}`);

        // Agent should see the assigned visa details
        const agentVisaDetail = await get(`/visa/applications/${visaId}`, agentToken);
        log('Agent can view assigned visa', agentVisaDetail.status === 200, `Status: ${agentVisaDetail.status}`);

        // Agent should be blocked from settings
        const settingsRes = await get('/analytics/settings', agentToken);
        log('Agent blocked from settings', settingsRes.status === 403, `Status: ${settingsRes.status}`);

        // Agent's dashboard should be filtered
        const agentDash = await get('/analytics/dashboard', agentToken);
        log('Agent dashboard filtered', agentDash.status === 200, `Status: ${agentDash.status}`);
      }

      // 6. Login as auto-created traveler
      const travelerLogin = await post('/auth/login', { email: 'johndoe@traveler.com', password: 'welcome123' });
      const travelerToken = travelerLogin.data.token;
      log('Traveler Login (auto-created)', !!travelerToken, travelerToken ? 'Got token' : 'FAILED');

      if (travelerToken) {
        // Traveler should see the shared visa application
        const travelerVisas = await get('/visa/applications', travelerToken);
        log('Co-Traveler sees shared visa', travelerVisas.data?.length >= 1, `Count: ${travelerVisas.data?.length || 0}`);

        // Verify the traveler sees the document checklist with their name
        if (travelerVisas.data?.length > 0) {
          const sharedVisa = travelerVisas.data.find(v => v.id === visaId);
          log('Shared visa is the correct one', !!sharedVisa, sharedVisa ? `ID: ${sharedVisa.id}` : 'NOT FOUND');
          
          if (sharedVisa) {
            const docs = sharedVisa.documents_json || [];
            const vaccCard = docs.find(d => d.name === 'Vaccination Card');
            log('Vaccination Card in docs', !!vaccCard, vaccCard ? `traveler_name: ${vaccCard.traveler_name}` : 'NOT FOUND');
            log('Traveler tag correct', vaccCard?.traveler_name === 'John Doe', `Tag: ${vaccCard?.traveler_name || 'NONE'}`);
          }
        }
      }
    }
  } else {
    log('No visa apps to test with', false, 'Create a visa application first');
  }

  // Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);
  results.filter(r => !r.pass).forEach(r => console.log(`  FAILED: ${r.test} — ${r.detail}`));
}

run().catch(err => console.error('Script error:', err));
