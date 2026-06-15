/* GlobalEdu Guide - Pure JS */
(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const WA_NUMBER = '15551234567'; // change to your number

  $('#year').textContent = new Date().getFullYear();

  /* ============ ONBOARDING ============ */
  const ob = $('#onboarding');
  const app = $('#app');
  let consultData = null;
  let slot = { date:null, time:null, tz:'Asia/Kolkata', lang:'English' };

  function goStep(n){
    $$('.ob-screen').forEach(s => s.classList.toggle('active', +s.dataset.screen === n));
    $$('.ob-step').forEach(s => {
      const sn = +s.dataset.step;
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    ob.scrollTo({top:0,behavior:'smooth'});
  }
  $$('[data-go]').forEach(b => b.addEventListener('click', () => goStep(+b.dataset.go)));

  function enterApp(){
    ob.style.display='none';
    app.classList.remove('hidden');
    document.body.style.overflow='';
  }
  $('#skipOb').addEventListener('click', enterApp);
  $('#exploreSkip').addEventListener('click', enterApp);
  $('#enterSite').addEventListener('click', enterApp);

  // Validation helpers
  const required = v => v.trim().length > 0;
  const email = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const phone = v => /^[+\d][\d\s\-()]{6,}$/.test(v.trim());
  const number = v => v !== '' && !isNaN(+v);
  function validate(form, rules){
    let ok = true;
    Object.entries(rules).forEach(([name, fn]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const field = input.closest('.field');
      if (!fn(input.value)) { field.classList.add('invalid'); ok = false; }
      else field.classList.remove('invalid');
    });
    return ok;
  }

  // Consultation form
  $('#consultForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#consultMsg');
    const ok = validate(e.target, {
      name: required, email, phone, degree: required,
      cgpa: number, budget: number, country: required, intake: required
    });
    if (!ok) { msg.textContent='Please fill required fields correctly.'; msg.className='form-msg err'; return; }
    consultData = Object.fromEntries(new FormData(e.target));
    try { localStorage.setItem('ge_consult', JSON.stringify(consultData)); } catch {}
    msg.textContent=''; goStep(3); buildCalendar(); buildSlots();
  });

  /* ===== Calendar ===== */
  let calDate = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function buildCalendar(){
    const cal = $('#calendar');
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    let html = `<div class="cal-head">
      <button type="button" id="prevM">‹</button>
      <span>${MONTHS[m]} ${y}</span>
      <button type="button" id="nextM">›</button>
    </div><div class="cal-grid">`;
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<div class="cal-dow">${d}</div>`);
    for (let i=0;i<first;i++) html += `<div class="cal-day muted"></div>`;
    for (let d=1;d<=days;d++){
      const dt = new Date(y,m,d);
      const past = dt < today;
      const isToday = dt.getTime() === today.getTime();
      const sel = slot.date && slot.date.toDateString() === dt.toDateString();
      html += `<button type="button" class="cal-day ${past?'muted':''} ${isToday?'today':''} ${sel?'selected':''}" ${past?'disabled':`data-d="${d}"`}>${d}</button>`;
    }
    html += '</div>';
    cal.innerHTML = html;
    $('#prevM').onclick = () => { calDate = new Date(y, m-1, 1); buildCalendar(); };
    $('#nextM').onclick = () => { calDate = new Date(y, m+1, 1); buildCalendar(); };
    $$('#calendar [data-d]').forEach(b => b.onclick = () => {
      slot.date = new Date(y, m, +b.dataset.d);
      buildCalendar(); updateSummary();
    });
  }

  function buildSlots(){
    const times = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
    $('#slotList').innerHTML = times.map(t =>
      `<button type="button" class="slot-chip ${slot.time===t?'selected':''}" data-t="${t}">${t}</button>`
    ).join('');
    $$('#slotList .slot-chip').forEach(c => c.onclick = () => {
      slot.time = c.dataset.t;
      $$('#slotList .slot-chip').forEach(x => x.classList.toggle('selected', x===c));
      updateSummary();
    });
    $('#tzSelect').onchange = e => { slot.tz = e.target.value; updateSummary(); };
    $('#slotLang').onchange = e => { slot.lang = e.target.value; updateSummary(); };
  }

  function updateSummary(){
    const s = $('#slotSummary');
    if (!slot.date || !slot.time) { s.textContent='Pick a date and time to see your slot.'; return; }
    const [hh,mm] = slot.time.split(':').map(Number);
    const local = new Date(slot.date); local.setHours(hh, mm, 0, 0);
    const tzLabel = $('#tzSelect').selectedOptions[0].text;
    const converted = local.toLocaleString('en-US', { timeZone: slot.tz, weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    s.innerHTML = `<b>Your slot:</b> ${local.toLocaleString('en-US',{weekday:'long',month:'long',day:'numeric'})} at <b>${slot.time}</b> (local) <br/><b>In ${tzLabel}:</b> ${converted} <br/><b>Language:</b> ${slot.lang}`;
  }

  $('#confirmSlot').addEventListener('click', () => {
    if (!slot.date || !slot.time) { alert('Please pick a date and time first.'); return; }
    const local = new Date(slot.date);
    const [hh,mm] = slot.time.split(':').map(Number); local.setHours(hh,mm,0,0);
    const niceDate = local.toLocaleString('en-US',{weekday:'long',month:'long',day:'numeric'});
    const tzLabel = $('#tzSelect').selectedOptions[0].text;
    $('#confirmDetails').innerHTML = `Hi <b>${(consultData?.name)||'there'}</b> — your slot is <b>${niceDate} at ${slot.time}</b> (${tzLabel}) in <b>${slot.lang}</b>.`;
    const text = encodeURIComponent(
      `Hi GlobalEdu Guide! I just booked a free consultation.\n\nName: ${consultData?.name}\nEmail: ${consultData?.email}\nPhone: ${consultData?.phone}\nPreferred Country: ${consultData?.country}\nIntake: ${consultData?.intake}\nSlot: ${niceDate} at ${slot.time} (${tzLabel})\nLanguage: ${slot.lang}`
    );
    $('#waBtn').href = `https://wa.me/${WA_NUMBER}?text=${text}`;
    goStep(4);
  });

  // Restore consult
  try {
    const saved = JSON.parse(localStorage.getItem('ge_consult')||'null');
    if (saved){ Object.entries(saved).forEach(([k,v])=>{ const i=document.querySelector(`#consultForm [name="${k}"]`); if(i) i.value=v; }); }
  } catch {}

  /* ============ THEME ============ */
  const themeBtn = $('#themeBtn');
  const saved = localStorage.getItem('ge_theme');
  if (saved === 'dark') { document.documentElement.dataset.theme='dark'; themeBtn.textContent='☀️'; }
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    if (isDark){ delete document.documentElement.dataset.theme; themeBtn.textContent='🌙'; localStorage.setItem('ge_theme','light'); }
    else { document.documentElement.dataset.theme='dark'; themeBtn.textContent='☀️'; localStorage.setItem('ge_theme','dark'); }
  });

  /* ============ NAVBAR ============ */
  const navbar = $('#navbar');
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 10));
  const hamburger = $('#hamburger'), navLinks = $('#navLinks');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { hamburger.classList.remove('open'); navLinks.classList.remove('open'); }));

  /* ============ Reveal + Counters ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  const countIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, dur = 1400, start = performance.now();
      const step = (t) => {
        const p = Math.min(1,(t-start)/dur);
        const val = Math.floor(target * (1 - Math.pow(1-p,3)));
        el.textContent = val.toLocaleString();
        if (p<1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + (target===98?'':'+');
      };
      requestAnimationFrame(step);
      countIo.unobserve(el);
    });
  }, { threshold: .4 });
  $$('[data-count]').forEach(el => countIo.observe(el));


  /* ============ DATA ============ */
  const countries = {
    USA: { flag:'🇺🇸', name:'United States', tags:['top'], desc:'Top-ranked universities, vast research opportunities, and a thriving tech industry.',
      overview:{ Capital:'Washington D.C.', Language:'English', Currency:'USD ($)', 'Avg Tuition':'$35k–$60k/yr', 'Avg Living':'$12k–$18k/yr' },
      exams:[ ['IELTS','6.5','7.0+'], ['TOEFL','90','100+'], ['GRE','310','325+'], ['GMAT','650','700+'], ['PTE','60','68+'] ],
      universities:{ Public:['UC Berkeley','UCLA','Univ of Michigan','UT Austin'], Private:['MIT','Stanford','Harvard','Carnegie Mellon'], ranking:'Top 50 globally' },
      courses:['Computer Science','Data Science','AI','Business Analytics','Cyber Security'],
      admission:['16-yr education','SOP + 3 LORs','Resume','Transcripts','English proficiency'],
      scholarships:['Fulbright','Merit aid','RA / TA positions'],
      partTime:'On-campus 20 hrs/wk · CPT/OPT off-campus', postStudy:'OPT up to 3 yrs for STEM',
      visa:'F-1 Visa — I-20, SEVIS, DS-160, consulate interview',
      accommodation:'Dorms, shared apts ($600–$1500/mo)', emergency:'911' },
    Canada: { flag:'🇨🇦', name:'Canada', tags:['pr','affordable'], desc:'Affordable tuition, friendly PR pathway, and a multicultural environment.',
      overview:{ Capital:'Ottawa', Language:'English / French', Currency:'CAD ($)', 'Avg Tuition':'CAD 20k–40k/yr', 'Avg Living':'CAD 12k–15k/yr' },
      exams:[ ['IELTS','6.5','7.0+'], ['TOEFL','86','95+'], ['GRE','Optional','315+'], ['GMAT','600','650+'], ['PTE','60','65+'] ],
      universities:{ Public:['Toronto','UBC','McGill','Waterloo'], Private:['Quest','Trinity Western'], ranking:'Top 100 globally' },
      courses:['CS','Data Science','AI','Business Analytics','Cyber Security'],
      admission:['Bachelor degree','SOP + LORs','Transcripts','English proficiency','Proof of funds'],
      scholarships:['Vanier CGS','Trudeau','Entrance scholarships'],
      partTime:'20 hrs/wk on/off campus', postStudy:'PGWP up to 3 yrs',
      visa:'Study Permit — IRCC, biometrics, medical, GIC',
      accommodation:'Residence, homestay, shared apt (CAD 600–1400/mo)', emergency:'911' },
    UK: { flag:'🇬🇧', name:'United Kingdom', tags:['top'], desc:"1-year master's programs and globally respected universities.",
      overview:{ Capital:'London', Language:'English', Currency:'GBP (£)', 'Avg Tuition':'£18k–£35k/yr', 'Avg Living':'£12k–£15k/yr' },
      exams:[ ['IELTS','6.5','7.0+'], ['TOEFL','90','100+'], ['GRE','Optional','315+'], ['GMAT','600','650+'], ['PTE','62','70+'] ],
      universities:{ Public:['Oxford','Cambridge','Imperial','UCL'], Private:['Buckingham','BPP'], ranking:'Top 50 globally' },
      courses:['CS','Data Science','AI','FinTech','Cyber Security'],
      admission:['Bachelor degree','SOP','2 LORs','Transcripts','English proficiency'],
      scholarships:['Chevening','Commonwealth','GREAT'],
      partTime:'20 hrs/wk in term', postStudy:'Graduate Route — 2 yrs',
      visa:'Student Visa — CAS, financial proof, TB test',
      accommodation:'Halls, private student housing (£600–£1500/mo)', emergency:'999 / 112' },
    Australia: { flag:'🇦🇺', name:'Australia', tags:['pr'], desc:'World-class education, sunny lifestyle, and strong PR opportunities.',
      overview:{ Capital:'Canberra', Language:'English', Currency:'AUD ($)', 'Avg Tuition':'AUD 25k–45k/yr', 'Avg Living':'AUD 21k/yr' },
      exams:[ ['IELTS','6.5','7.0+'], ['TOEFL','79','95+'], ['GRE','Optional','310+'], ['GMAT','550','650+'], ['PTE','58','65+'] ],
      universities:{ Public:['Melbourne','ANU','Sydney','UNSW'], Private:['Bond','Torrens'], ranking:'Top 100 globally' },
      courses:['CS','Data Science','AI','Business Analytics','Cyber Security'],
      admission:['Bachelor degree','SOP','Transcripts','English proficiency','GTE'],
      scholarships:['Australia Awards','Destination Australia','Merit'],
      partTime:'48 hrs/fortnight', postStudy:'Temp Graduate Visa 485 — 2–4 yrs',
      visa:'Subclass 500 — CoE, OSHC, GTE, financial proof',
      accommodation:'Student housing, share house (AUD 800–1800/mo)', emergency:'000' },
    Germany: { flag:'🇩🇪', name:'Germany', tags:['affordable'], desc:'Tuition-free public universities and an engineering powerhouse.',
      overview:{ Capital:'Berlin', Language:'German / English', Currency:'EUR (€)', 'Avg Tuition':'€0 – €20k/yr', 'Avg Living':'€10k–€12k/yr' },
      exams:[ ['IELTS','6.5','7.0+'], ['TOEFL','88','95+'], ['GRE','Optional','310+'], ['GMAT','600','650+'], ['PTE','59','65+'] ],
      universities:{ Public:['TU Munich','RWTH Aachen','Heidelberg','LMU'], Private:['Jacobs','EBS'], ranking:'Top 100 globally' },
      courses:['Mechanical Engg','CS','Data Science','AI','Automotive'],
      admission:['Bachelor degree','APS certificate','SOP + LORs','English / German'],
      scholarships:['DAAD','Erasmus+','Deutschlandstipendium'],
      partTime:'120 full / 240 half days/yr', postStudy:'18-month Job Seeker Visa',
      visa:'National Visa (Type D) — blocked account (€11,208), admission letter',
      accommodation:'Studentenwohnheim, WG (€350–€800/mo)', emergency:'112 / 110' },
    'New Zealand': { flag:'🇳🇿', name:'New Zealand', tags:['pr','affordable'], desc:'Safe, beautiful, and a high quality of life with research-focused universities.',
      overview:{ Capital:'Wellington', Language:'English / Māori', Currency:'NZD ($)', 'Avg Tuition':'NZD 22k–35k/yr', 'Avg Living':'NZD 15k/yr' },
      exams:[ ['IELTS','6.0','6.5+'], ['TOEFL','80','90+'], ['GRE','Optional','305+'], ['GMAT','550','620+'], ['PTE','58','64+'] ],
      universities:{ Public:['Auckland','Otago','Victoria','Canterbury'], Private:['Media Design','Yoobee'], ranking:'Top 200 globally' },
      courses:['CS','Data Science','AI','Environmental Science','Agribusiness'],
      admission:['Bachelor degree','SOP','Transcripts','English proficiency'],
      scholarships:['NZ Excellence Awards','University awards'],
      partTime:'20 hrs/wk in term, full-time in holidays', postStudy:'Post-Study Work Visa up to 3 yrs',
      visa:'Fee-paying Student Visa — offer letter, funds, medical',
      accommodation:'Halls, homestay, flatting (NZD 200–400/week)', emergency:'111' }
  };

  /* Country render with filter */
  function renderCountries(filter='all'){
    const cg = $('#countryGrid'); cg.innerHTML='';
    Object.entries(countries).forEach(([key, c]) => {
      const match = filter==='all' || (c.tags||[]).includes(filter);
      if (!match) return;
      const el = document.createElement('div');
      el.className = 'country-card reveal in';
      el.innerHTML = `
        <div class="flag">${c.flag}</div>
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <button class="btn btn-primary" data-c="${key}">Explore →</button>
      `;
      cg.appendChild(el);
    });
  }
  renderCountries();
  $('#countryFilter').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if(!b) return;
    $$('#countryFilter .chip').forEach(x => x.classList.toggle('active', x===b));
    renderCountries(b.dataset.filter);
  });

  const cd = $('#countryDetails');
  $('#countryGrid').addEventListener('click', e => {
    const btn = e.target.closest('[data-c]'); if(!btn) return;
    showCountry(btn.dataset.c);
  });

  function showCountry(key){
    const c = countries[key];
    cd.innerHTML = `
      <div class="cd-head">
        <span class="flag">${c.flag}</span>
        <div><h3>${c.name}</h3><p>${c.desc}</p></div>
        <button class="cd-close" id="cdClose">✕ Close</button>
      </div>
      <div class="cd-grid">
        <div class="cd-block"><h4>Overview</h4><ul>${Object.entries(c.overview).map(([k,v])=>`<li><b>${k}:</b> ${v}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Exams Required</h4><ul>${c.exams.map(([n,mi,re])=>`<li><b>${n}:</b> min ${mi} · recommended ${re}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Top Public Universities</h4><ul>${c.universities.Public.map(x=>`<li>• ${x}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Top Private Universities</h4><ul>${c.universities.Private.map(x=>`<li>• ${x}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Rankings</h4><ul><li>${c.universities.ranking}</li></ul></div>
        <div class="cd-block"><h4>Popular Courses</h4><ul>${c.courses.map(x=>`<li>• ${x}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Admission Requirements</h4><ul>${c.admission.map(x=>`<li>• ${x}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Scholarships</h4><ul>${c.scholarships.map(x=>`<li>• ${x}</li>`).join('')}</ul></div>
        <div class="cd-block"><h4>Part-Time Jobs</h4><ul><li>${c.partTime}</li></ul></div>
        <div class="cd-block"><h4>Post-Study Work</h4><ul><li>${c.postStudy}</li></ul></div>
        <div class="cd-block"><h4>Visa Process</h4><ul><li>${c.visa}</li></ul></div>
        <div class="cd-block"><h4>Accommodation</h4><ul><li>${c.accommodation}</li></ul></div>
        <div class="cd-block"><h4>Emergency Contacts</h4><ul><li>${c.emergency}</li></ul></div>
      </div>
    `;
    cd.classList.remove('hidden');
    $('#cdClose').addEventListener('click', () => cd.classList.add('hidden'));
    cd.scrollIntoView({behavior:'smooth', block:'start'});
  }

  /* Scholarships */
  const scholarships = [
    { icon:'🏆', title:'Merit Scholarships', desc:'Awarded for academic excellence and outstanding test scores.', eligibility:'CGPA 8.5+', benefit:'25–100% tuition', deadline:'Rolling' },
    { icon:'🏛', title:'Government Scholarships', desc:'Fulbright, Chevening, DAAD and other prestigious awards.', eligibility:'Citizenship + merit', benefit:'Full tuition + stipend', deadline:'Aug–Nov' },
    { icon:'🎓', title:'University Scholarships', desc:'Internal scholarships offered by universities to top talent.', eligibility:'Admission offer', benefit:'10–80% tuition', deadline:'With application' },
    { icon:'🔬', title:'Research Assistantships', desc:'Work with professors while earning a monthly stipend.', eligibility:'Strong profile + match', benefit:'Tuition + $1500/mo', deadline:'Pre-semester' },
    { icon:'👩‍🏫', title:'Teaching Assistantships', desc:'Assist faculty in undergrad courses; covers tuition.', eligibility:'Communication skills', benefit:'Tuition + $1200/mo', deadline:'Pre-semester' },
    { icon:'🌍', title:'International Awards', desc:'Country-specific aid like Australia Awards, Vanier CGS.', eligibility:'Varies', benefit:'Full funding', deadline:'Yearly' },
  ];
  $('#scholarshipGrid').innerHTML = scholarships.map(s => `
    <div class="mini-card reveal in">
      <div class="icon">${s.icon}</div><h3>${s.title}</h3><p>${s.desc}</p>
      <div class="meta"><span>Eligibility</span><b>${s.eligibility}</b></div>
      <div class="meta"><span>Benefit</span><b>${s.benefit}</b></div>
      <div class="meta"><span>Deadline</span><b>${s.deadline}</b></div>
    </div>`).join('');

  /* Accommodation */
  const accom = [
    { icon:'🏫', title:'University Hostels', cost:'$400–$900/mo', pros:'Safe, on-campus, social', cons:'Limited privacy, waitlists' },
    { icon:'🏘', title:'Shared Apartments', cost:'$500–$1100/mo', pros:'Affordable, social, flexible', cons:'Roommate dependent' },
    { icon:'🏢', title:'Private Apartments', cost:'$900–$2000/mo', pros:'Full privacy, independence', cons:'Expensive, all bills on you' },
    { icon:'🏡', title:'Homestays', cost:'$700–$1300/mo', pros:'Meals + cultural immersion', cons:'House rules, less freedom' },
  ];
  $('#accomGrid').innerHTML = accom.map(a => `
    <div class="mini-card reveal in">
      <div class="icon">${a.icon}</div><h3>${a.title}</h3>
      <div class="meta"><span>Cost</span><b>${a.cost}</b></div>
      <div class="meta"><span>Pros</span><b>${a.pros}</b></div>
      <div class="meta"><span>Cons</span><b>${a.cons}</b></div>
    </div>`).join('');

  /* Visa Roadmap */
  const steps = [
    ['Step 1','Choose Country','Shortlist destinations matching your goals & budget.'],
    ['Step 2','Prepare Exams','Build a study plan for IELTS/TOEFL/GRE/GMAT.'],
    ['Step 3','Apply Universities','Submit SOPs, LORs, transcripts.'],
    ['Step 4','Receive Admit','Compare offers and pick your best fit.'],
    ['Step 5','Apply Scholarships','Submit scholarship & financial aid forms.'],
    ['Step 6','Visa Application','Gather documents and attend interview.'],
    ['Step 7','Accommodation Booking','Confirm on/off-campus housing.'],
    ['Step 8','Travel Planning','Flights, forex, insurance, packing ✈️'],
  ];
  $('#timeline').innerHTML = steps.map(([m,t,d]) =>
    `<div class="tl-item reveal in"><div class="dot"></div><div class="tl-card"><div class="tl-month">${m}</div><h4>${t}</h4><p>${d}</p></div></div>`
  ).join('');

  /* Warnings */
  const warns = [
    { icon:'⚠️', title:'Fake Visa Guarantees', desc:'No agent can guarantee a visa — only the embassy decides.' },
    { icon:'💸', title:'Fake Scholarships', desc:'Beware scholarships demanding upfront "processing fees".' },
    { icon:'🧾', title:'Hidden Charges', desc:'Always get the full fee breakdown in writing before paying.' },
    { icon:'🚫', title:'Unverified Consultancies', desc:'Verify ICEF, AIRC, or government accreditation before signing.' },
  ];
  $('#warnGrid').innerHTML = warns.map(w =>
    `<div class="mini-card warn-card reveal in"><div class="icon">${w.icon}</div><h3>${w.title}</h3><p>${w.desc}</p></div>`
  ).join('');

  /* FAQ */
  const faqs = [
    ['How much IELTS score is required?','Most universities ask for an overall band of 6.5 with no section below 6.0. Top schools (Oxford, Harvard) may require 7.0+.'],
    ['Is GRE mandatory?','GRE is required by many US universities for MS programs, but increasingly optional. Always check the program page.'],
    ['Can I study without a consultancy?','Absolutely. Many students apply directly. GlobalEdu Guide is designed to help you self-apply confidently.'],
    ['Can I get scholarships?','Yes — merit aid, government scholarships, RAs and TAs are widely available. Strong CGPA, test scores and a great SOP boost your chances.'],
    ['Can I work while studying?','Yes — most countries allow 20 hours/week during term and full-time during breaks. Specific rules vary by visa type.'],
  ];
  const fl = $('#faqList');
  fl.innerHTML = faqs.map(([q,a]) =>
    `<div class="faq-item reveal in">
      <button class="faq-q" type="button">${q}<span class="chev">+</span></button>
      <div class="faq-a"><p>${a}</p></div>
    </div>`).join('');
  fl.addEventListener('click', e => {
    const btn = e.target.closest('.faq-q'); if(!btn) return;
    const item = btn.parentElement;
    const open = item.classList.contains('open');
    $$('.faq-item', fl).forEach(i => i.classList.remove('open'));
    if (!open) item.classList.add('open');
  });

  /* Recommendation */
  $('#recForm').addEventListener('submit', e => {
    e.preventDefault();
    const cgpa = +$('#recCgpa').value, budget = +$('#recBudget').value, ielts = +$('#recIelts').value;
    const course = $('#recCourse').value, prefCountry = $('#recCountry').value;
    if (!(cgpa>0) || !(budget>0) || !(ielts>0)) return;

    let recCountries = [];
    if (budget < 15000) recCountries.push({n:'Germany', why:'Tuition-free public universities'});
    if (budget >= 15000 && budget < 30000) recCountries.push({n:'Canada', why:'Affordable + PR-friendly'},{n:'New Zealand', why:'Quality + reasonable cost'});
    if (budget >= 25000 && budget < 45000) recCountries.push({n:'UK', why:"1-year master's saves money"},{n:'Australia', why:'Great post-study work'});
    if (budget >= 40000) recCountries.push({n:'USA', why:"World's top universities"});
    if (!recCountries.length) recCountries.push({n:'Germany', why:'Maximize value for your budget'});
    if (prefCountry !== 'Any' && !recCountries.find(x=>x.n===prefCountry)) recCountries.unshift({n:prefCountry, why:'Your preferred destination'});

    const unis = (cgpa>=9&&ielts>=7.5) ? ['MIT','Stanford','Oxford','ETH Zurich']
               : (cgpa>=8&&ielts>=7)   ? ['UC Berkeley','Univ of Toronto','TU Munich','UNSW']
               : (cgpa>=7&&ielts>=6.5) ? ['Arizona State','Concordia','RWTH Aachen','Univ of Auckland']
                                       : ['SUNY Buffalo','Univ of Windsor','Hochschule München','AUT New Zealand'];
    const courses = [course, ...(cgpa>=8.5 ? ['Artificial Intelligence','Data Science'] : ['Business Analytics','Software Engineering'])];
    const schols = (cgpa>=8.5) ? ['Fulbright','Chevening','DAAD','Vanier CGS']
                  : (cgpa>=7.5) ? ['University Merit Aid','Commonwealth','Erasmus+']
                                : ['RA / TA Positions','Country-specific awards'];
    const fit = Math.min(98, Math.round((cgpa/10)*40 + (ielts/9)*30 + (budget>=20000?30:20)));

    $('#recResult').innerHTML = `
      <h3>🎯 Your Personalized Match — <span class="grad-text">${fit}% Fit</span></h3>
      <div class="rec-grid">
        <div class="rec-card"><h4>🌍 Countries</h4><ul>${recCountries.map(c=>`<li><b>${c.n}</b> — ${c.why}</li>`).join('')}</ul></div>
        <div class="rec-card"><h4>🎓 Universities</h4><ul>${unis.map(u=>`<li>${u}</li>`).join('')}</ul></div>
        <div class="rec-card"><h4>📚 Courses</h4><ul>${[...new Set(courses)].map(c=>`<li>${c}</li>`).join('')}</ul></div>
        <div class="rec-card"><h4>💰 Scholarships</h4><ul>${schols.map(s=>`<li>${s}</li>`).join('')}</ul></div>
      </div>`;
    $('#recResult').classList.remove('hidden');
    $('#recResult').scrollIntoView({behavior:'smooth', block:'start'});
  });

  /* Contact */
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#contactMsg');
    const ok = validate(e.target, { cname:required, cemail:email, csubject:required, cmessage:required });
    if (!ok){ msg.textContent='Please fill all required fields correctly.'; msg.className='form-msg err'; return; }
    msg.textContent="✓ Message sent! We'll reply within 24 hours."; msg.className='form-msg ok';
    e.target.reset();
  });

  /* Floating WA */
  $('#floatWa').href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi GlobalEdu Guide! I have a question about studying abroad.')}`;
})();
