let state = {
  vehicleId:'',
  step:0,
  answers:[],
  priceAnswer:null,
  showWhy:false,
  selectedIndex:null,
  transitioning:false,
  researchStatus:'idle',
  researchError:'',
  researchQuery:'',
  selection:{make:'',model:'',generation:'',version:''}
};

const resultCopy = {
  'Ideal':'The conditions that shape real ownership fit you very well.',
  'Suitable':'There are some trade-offs, but no major mismatch dominates the decision.',
  'Not suitable':'One or more important ownership conditions conflict with what you want from the car.'
};

function productMeta(v){
  if(v.id==='bmw-x3-g01-20d') return {make:v.make,model:v.model,generation:'G01 · 2018–2021',version:'20d'};
  if(v.id==='volvo-xc60-d4') return {make:v.make,model:v.model,generation:'II · 2018–2021',version:'D4 AWD'};
  if(v.id==='mercedes-glc-220d') return {make:v.make,model:v.model,generation:'X253 facelift · 2019–2021',version:'220d 4MATIC'};
  if(v.id==='porsche-911-sc-1980') return {make:v.make,model:v.model,generation:'1980',version:'3.0 air-cooled · 915 manual'};
  return {make:v.make,model:v.model,generation:v.variant,version:''};
}

const catalogue = vehicles.map(v => ({...productMeta(v), id:v.id}));

function uniq(arr){ return [...new Set(arr)]; }
function filteredCatalogue(){
  const s = state.selection;
  return catalogue.filter(x =>
    (!s.make || x.make===s.make) &&
    (!s.model || x.model===s.model) &&
    (!s.generation || x.generation===s.generation) &&
    (!s.version || x.version===s.version)
  );
}
function optionsFor(field){
  const s = state.selection;
  return uniq(catalogue.filter(x =>
    (field==='make' || !s.make || x.make===s.make) &&
    (field==='model' || !s.model || x.model===s.model) &&
    (field==='generation' || !s.generation || x.generation===s.generation)
  ).map(x=>x[field]));
}

function getVehicle(){
  return vehicles.find(v => v.id === state.vehicleId);
}

function setSelection(field,value){
  const order = ['make','model','generation','version'];
  const idx = order.indexOf(field);
  state.selection[field] = value;
  order.slice(idx+1).forEach(k => state.selection[k]='');
  render();
}

async function beginSelected(){
  const match = filteredCatalogue();

  if(match.length===1 && state.selection.version){
    const selected = match[0];

    const query = [
      selected.make,
      selected.model,
      selected.generation,
      selected.version
    ]
      .filter(Boolean)
      .join(' ');

    await loadCanonicalVehicle(query);
  }
}

function answer(choice, index){
  if(state.transitioning) return;
  state.selectedIndex = index;
  state.transitioning = true;
  render();
  setTimeout(()=>{
    state.answers[state.step] = choice;
    state.step += 1;
    state.selectedIndex = null;
    state.transitioning = false;
    render();
  }, 320);
}

function backQuestion(){
  if(state.transitioning || state.step===0) return;
  state.step -= 1;
  state.answers = state.answers.slice(0, state.step);
  state.selectedIndex = null;
  render();
}

function reset(){
  state = {
    vehicleId:'',
    step:0,
    answers:[],
    priceAnswer:null,
    showWhy:false,
    selectedIndex:null,
    transitioning:false,
    researchStatus:'idle',
    researchError:'',
    researchQuery:'',
    selection:{make:'',model:'',generation:'',version:''}
  };
  render();
}

function toggleWhy(){
  state.showWhy = !state.showWhy;
  render();
}

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function selector(label, field, placeholder, enabled, opts){
  const value = state.selection[field];
  return `
    <div class="selector ${enabled?'':'disabled'}">
      <label>
        ${esc(label)}
        <span>${value ? 'Selected' : ''}</span>
      </label>
      <select id="${field}" ${enabled?'':'disabled'}>
        <option value="" ${value?'':'selected'} disabled>${esc(placeholder)}</option>
        ${opts.map(o=>`<option value="${esc(o)}" ${o===value?'selected':''}>${esc(o)}</option>`).join('')}
      </select>
    </div>`;
}



function conditionTitle(question, vehicle){
  const q = question.toLowerCase();

  if(q.includes('mostly use this car')) return 'Short-trip diesel use';
  if(q.includes('expensive premium-car repair')) return 'Premium repair-cost exposure';
  if(q.includes('electronic') || q.includes('infotainment') || q.includes('sensor warnings')) return 'Electronic / software friction';
  if(q.includes('driving character')) return 'Driving-character fit';
  if(q.includes('roads you will use')) return 'Ride and wheel suitability';
  if(q.includes('gearbox behaviour')) return 'Low-speed gearbox behaviour';
  if(q.includes('adblue') || q.includes('nox')) return 'Diesel emissions-system tolerance';
  if(q.includes('sounds, smells') || q.includes('small imperfections')) return 'Classic-car imperfection tolerance';
  if(q.includes('regular mechanical attention')) return 'Mechanical-attention tolerance';
  if(q.includes('manual gearbox')) return '915 gearbox character';
  if(q.includes('heavier steering') || q.includes('physical controls')) return 'Physical driving effort';
  if(q.includes('a/c') || q.includes('cabin comfort')) return 'Cabin comfort expectations';
  if(q.includes('judgement near the limit')) return 'Old-school dynamic behaviour';

  return question;
}


function evidenceSummary(vehicle){
  const count = vehicle.evidenceCount ?? 0;
  const unit = vehicle.evidenceUnit || 'owner reviews & discussions';
  return `${count} ${unit} analyzed`;
}

function resultSummary(result, vehicle){
  if(result==='Ideal'){
    return `The conditions that matter most for owning this ${vehicle.model} fit you very well.`;
  }
  if(result==='Suitable'){
    return `This ${vehicle.model} can work well for you, but there are a few ownership trade-offs worth knowing before you buy.`;
  }
  return `Some of the conditions that shape real ownership are a poor fit for what you want from this ${vehicle.model}.`;
}




function upsertVehicle(vehicle){
  const existing = vehicles.findIndex(v => v.id === vehicle.id);

  if(existing >= 0) vehicles[existing] = vehicle;
  else vehicles.push(vehicle);
}


async function loadCanonicalVehicle(query){
  state.researchStatus = 'researching';
  state.researchError = '';
  render();

  try{
    const response = await fetch('/api/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({query})
    });

    const data = await response.json();

    if(!response.ok){
      throw new Error(
        data.error || 'Research failed.'
      );
    }

    const vehicle = data.vehicle;

    upsertVehicle(vehicle);

    state.vehicleId = vehicle.id;
    state.step = 0;
    state.answers = [];
    state.priceAnswer = null;
    state.showWhy = false;
    state.selectedIndex = null;
    state.transitioning = false;
    state.researchStatus = 'idle';
    state.researchError = '';

    render();

  }catch(err){
    state.researchStatus = 'error';
    state.researchError =
      err.message || 'Research failed.';

    render();
  }
}




async function researchUnknownVehicle(){
  const input =
    document.getElementById('unknownVehicle');

  const query =
    (input?.value || '').trim();

  if(!query) return;

  state.researchQuery = query;

  await loadCanonicalVehicle(query);
}


function render(){
  const app = document.getElementById('app');
  const vehicle = getVehicle();

  if(!vehicle){
    const s = state.selection;
    const makes = uniq(catalogue.map(x=>x.make));
    const models = s.make ? uniq(catalogue.filter(x=>x.make===s.make).map(x=>x.model)) : [];
    const generations = (s.make && s.model) ? uniq(catalogue.filter(x=>x.make===s.make && x.model===s.model).map(x=>x.generation)) : [];
    const versions = (s.make && s.model && s.generation) ? uniq(catalogue.filter(x=>x.make===s.make && x.model===s.model && x.generation===s.generation).map(x=>x.version)) : [];
    const ready = !!(s.make && s.model && s.generation && s.version);

    app.innerHTML = `
      <main class="shell">
        <section class="hero">
          <p class="eyebrow">OWNER-EVIDENCE FIT</p>
          <h1>Is this car right for you?</h1>
          <p class="lede">Not the best car. Not a comparison. Just whether this specific car fits the way you will actually own it.</p>
        </section>

        <section class="selectionWrap">
          ${selector('Make','make','Choose make',true,makes)}
          ${selector('Model','model','Choose model',!!s.make,models)}
          ${selector('Year / generation','generation','Choose year or generation',!!s.model,generations)}
          ${selector('Engine / version','version','Choose engine or version',!!s.generation,versions)}
        </section>

        <div class="startRow">
          <p class="micro">MVP dataset · ${vehicles.filter(v=>!v.dynamic).length} prepared vehicle definitions</p>
          <button
            class="primary"
            id="startBtn"
            ${ready && state.researchStatus!=='researching' ? '' : 'disabled'}
          >
            ${state.researchStatus==='researching' ? 'Loading vehicle…' : 'Start questions'}
          </button>
        </div>

        <section class="unknownSection">
          <div class="unknownDivider"><span>OR</span></div>
          <div class="unknownCard">
            <p class="eyebrow">ANY OTHER CAR</p>
            <h2>Can't find your car?</h2>
            <p>Enter the exact vehicle you are considering. We’ll research real owner evidence and build its questions now.</p>
            <div class="unknownInputRow">
              <input
                id="unknownVehicle"
                type="text"
                placeholder="e.g. 2007 Saab 9-3 1.9 TiD"
                value="${esc(state.researchQuery || '')}"
                ${state.researchStatus==='researching'?'disabled':''}
              />
              <button class="primary" id="researchBtn" ${state.researchStatus==='researching'?'disabled':''}>
                ${state.researchStatus==='researching'?'Researching…':'Analyze this car'}
              </button>
            </div>
            ${state.researchStatus==='researching' ? `
              <div class="researchState">
                <div class="researchSpinner"></div>
                <div>
                  <strong>Analyzing owner evidence…</strong>
                  <p>Searching owner reviews and discussions, extracting recurring ownership conditions, then building 5–8 diagnostic questions.</p>
                </div>
              </div>` : ''}
            ${state.researchStatus==='error' ? `
              <div class="researchError">${esc(state.researchError)}</div>` : ''}
            <p class="micro unknownNote">First analysis may take a while. Once researched, the saved model can be reused instantly.</p>
          </div>
        </section>
      </main>`;

    ['make','model','generation','version'].forEach(field=>{
      const el = document.getElementById(field);
      if(el && !el.disabled){
        el.addEventListener('change', e=>setSelection(field,e.target.value));
      }
    });
    document.getElementById('startBtn').addEventListener('click', beginSelected);
    const researchBtn = document.getElementById('researchBtn');
    const unknownVehicle = document.getElementById('unknownVehicle');
    if(researchBtn) researchBtn.addEventListener('click', researchUnknownVehicle);
    if(unknownVehicle){
      unknownVehicle.addEventListener('keydown', e=>{
        if(e.key==='Enter') researchUnknownVehicle();
      });
    }
    return;
  }

  const finished = state.step >= vehicle.questions.length;
  const needsPriceQuestion =
    finished &&
    vehicle.marketPrice &&
    !state.priceAnswer;

  
  if(!finished){
    const q = vehicle.questions[state.step];
    app.innerHTML = `
      <main class="shell compact">
        <div class="questionTop">
          <div class="navRow">
            <button class="textButton" id="changeCar">← Change car</button>
            <button class="textButton" id="backQuestion" ${state.step===0?'disabled':''}>Back</button>
          </div>
          <span class="micro">${state.step+1} / ${vehicle.questions.length}</span>
        </div>

        <div class="progressRow">
          <span>${esc(vehicle.make)} ${esc(vehicle.model)}</span>
          <span>${Math.round(((state.step)/vehicle.questions.length)*100)}%</span>
        </div>
        <div class="progress"><span style="width:${((state.step)/vehicle.questions.length)*100}%"></span></div>

        <section class="questionBlock">
          <p class="variant">${esc(vehicle.variant)}</p>
          <h2>${esc(q.text)}</h2>
          ${q.clarification ? `<p class="questionClarification">${esc(q.clarification)}</p>` : ''}
          <div class="answers">
            ${q.answers.map((a,i)=>{
              const selected = state.selectedIndex===i;
              const dimmed = state.transitioning && !selected;
              return `
              <button class="answer ${selected?'selected':''} ${dimmed?'dimmed':''} ${state.transitioning?'locked':''}" data-answer="${i}">
                <span class="letter">${String.fromCharCode(65+i)}</span>
                <span>${esc(a.label)}</span>
              </button>`;
            }).join('')}
          </div>
          <div class="transitionHint">${state.transitioning?'Got it — next question':''}</div>
        </section>
      </main>`;
    document.getElementById('changeCar').addEventListener('click', reset);
    document.getElementById('backQuestion').addEventListener('click', backQuestion);
    document.querySelectorAll('[data-answer]').forEach(btn=>{
      btn.addEventListener('click', ()=>answer(q.answers[Number(btn.dataset.answer)], Number(btn.dataset.answer)));
    });
    return;
  }

if(needsPriceQuestion){
  const price = vehicle.marketPrice;

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 0
  });

  const priceRange =
    `${formatter.format(price.low)}–${formatter.format(price.high)}`;

  app.innerHTML = `
    <main class="shell compact">
      <div class="questionTop">
        <div class="navRow">
          <button class="textButton" id="changeCar">← Change car</button>
          <button class="textButton" id="backQuestion">Back</button>
        </div>
        <span class="micro">PRICE CONTEXT</span>
      </div>

      <div class="progressRow">
        <span>${esc(vehicle.make)} ${esc(vehicle.model)}</span>
        <span>100%</span>
      </div>

      <div class="progress">
        <span style="width:100%"></span>
      </div>

      <section class="questionBlock">
        <p class="variant">${esc(vehicle.variant)}</p>

        <h2>
          This car typically costs around
          ${esc(priceRange)}
          in today’s market. How does that price level feel to you?
        </h2>

        <p class="questionClarification">
          This reflects typical current asking prices for comparable examples in ${esc(price.market)}.
        </p>

        <div class="answers">
          <button class="answer" data-price-answer="comfortable">
            <span class="letter">A</span>
            <span>Comfortable — that price level feels reasonable for this car.</span>
          </button>

          <button class="answer" data-price-answer="stretch">
            <span class="letter">B</span>
            <span>A stretch — I could consider it, but the price matters.</span>
          </button>

          <button class="answer" data-price-answer="too_high">
            <span class="letter">C</span>
            <span>Too high — at that price level I would probably not choose this car.</span>
          </button>
        </div>
      </section>
    </main>
  `;

  document
    .getElementById('changeCar')
    .addEventListener('click', reset);

  document
    .getElementById('backQuestion')
    .addEventListener('click', ()=>{
      state.step = Math.max(
        0,
        vehicle.questions.length - 1
      );

      state.answers =
        state.answers.slice(0, state.step);

      render();
    });

  document
    .querySelectorAll('[data-price-answer]')
    .forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.priceAnswer =
          btn.dataset.priceAnswer;

        render();
      });
    });

  return;
}


  
const evaluation = evaluateResult(vehicle, state.answers);

const integrityOverride =
  vehicle.productIntegrity?.overrideFit === true;

let result = evaluation.result;

if(state.priceAnswer === 'stretch' && result === 'Ideal'){
  result = 'Suitable';
}

if(state.priceAnswer === 'too_high'){
  result = 'Not suitable';
}

if(integrityOverride){
  result = 'Not suitable';
}

let finalSummary;

if(integrityOverride){
  finalSummary =
    `Recurring owner evidence indicates a serious product-integrity concern that outweighs an otherwise acceptable ownership fit for this ${vehicle.model}.`;
}
else if(state.priceAnswer === 'too_high'){
  finalSummary =
    `The ownership fit may work, but at the current market price this ${vehicle.model} does not make sense for you.`;
}
else{
  finalSummary =
    resultSummary(result, vehicle);
}

  

const reasons = evaluation.mapped.map(a=>({
  ...a,
  level: a.impact === 'positive'
    ? 'fit'
    : (a.impact === 'neutral' ? 'consider' : 'mismatch')
}));

const priceReason =
  state.priceAnswer === 'comfortable'
    ? {
        level: 'fit',
        impact: 'positive',
        condition: 'Price level',
        question: `How does the current ${vehicle.marketPrice.currency} ${vehicle.marketPrice.low.toLocaleString()}–${vehicle.marketPrice.high.toLocaleString()} price range feel to you?`,
        impactReason: 'This price level feels reasonable to you for this specific car.'
      }
    : state.priceAnswer === 'stretch'
      ? {
          level: 'consider',
          impact: 'neutral',
          condition: 'Price level',
          question: `How does the current ${vehicle.marketPrice.currency} ${vehicle.marketPrice.low.toLocaleString()}–${vehicle.marketPrice.high.toLocaleString()} price range feel to you?`,
          impactReason: 'You could still consider the car, but the current market price creates some purchase friction.'
        }
      : {
          level: 'mismatch',
          impact: 'high_negative',
          condition: 'Price level',
          question: `How does the current ${vehicle.marketPrice.currency} ${vehicle.marketPrice.low.toLocaleString()}–${vehicle.marketPrice.high.toLocaleString()} price range feel to you?`,
          impactReason: 'At this price level, you would probably not choose this car.'
        };

const integrityReason =
  vehicle.productIntegrity &&
  vehicle.productIntegrity.level !== 'no_meaningful_signal'
    ? {
        level: vehicle.productIntegrity.overrideFit
          ? 'mismatch'
          : 'consider',

        impact: vehicle.productIntegrity.overrideFit
          ? 'critical_negative'
          : 'neutral',

        condition: 'Product integrity risk',

        question: vehicle.productIntegrity.summary,

        impactReason:
          vehicle.productIntegrity.evidenceReason,

        productIntegrity: true,

        issues:
          Array.isArray(vehicle.productIntegrity.issues)
            ? vehicle.productIntegrity.issues
            : []
      }
    : null;

const orderedReasons = [
  ...(integrityReason?.impact === 'critical_negative'
    ? [integrityReason]
    : []),

  ...reasons.filter(r=>r.impact==='critical_negative'),

  ...(priceReason.level === 'mismatch'
    ? [priceReason]
    : []),

  ...reasons.filter(r=>r.impact==='high_negative'),
  ...reasons.filter(r=>r.impact==='medium_negative'),

  ...(integrityReason?.level === 'consider'
    ? [integrityReason]
    : []),

  ...(priceReason.level === 'consider'
    ? [priceReason]
    : []),

  ...reasons.filter(r=>r.level==='consider'),

  ...(priceReason.level === 'fit'
    ? [priceReason]
    : []),

  ...reasons.filter(r=>r.level==='fit')
];

const labelFor = r => {
  if(r.productIntegrity){
    return r.level === 'mismatch'
      ? 'PRODUCT INTEGRITY CONCERN'
      : 'PRODUCT INTEGRITY SIGNAL';
  }

  return r.level==='fit'
    ? 'WORKS WELL FOR YOU'
    : (
        r.level==='mismatch'
          ? 'POTENTIAL MISMATCH'
          : 'THINGS TO CONSIDER'
      );
};



  


  app.innerHTML = `
    <main class="shell compact resultShell">
      <button class="textButton" id="startAgain">← Start again</button>

      <section class="resultHero">
        <div class="resultKicker">
          <span class="resultCar">${esc(vehicle.make)} ${esc(vehicle.model)}</span>
          <span class="resultMeta">${esc(vehicle.variant)}</span>
        </div>

        <div class="evidenceLine">
          <span class="evidenceDot"></span>
          <span><strong>${esc(evidenceSummary(vehicle))}</strong></span>
          <span class="evidenceUpdated">Updated ${esc(vehicle.evidenceLastUpdated || '')}</span>
        </div>

        <h1 class="result ${result==='Not suitable'?'long':''}">${esc(result)}</h1>
        <p class="lede resultLead">${esc(finalSummary)}</p>

        <div class="resultActions">
          <button class="primary" id="whyBtn">${state.showWhy ? 'Hide why' : 'Why?'}</button>
          <button class="secondary" id="restartBtn">Try another car</button>
        </div>
      </section>

      ${state.showWhy ? `
        <section class="whyPanel">
          <div class="whyIntro">
            <h2>Why this result?</h2>
            <div>
              <p>We are not scoring whether this is a good car. We are checking whether the ownership conditions that repeatedly matter to real owners fit you.</p>
              <button class="evidenceInfoButton" id="evidenceInfoBtn">About the evidence base</button>
              <div class="evidenceInfo" id="evidenceInfo" hidden>
                <p><strong>${esc(evidenceSummary(vehicle))}</strong></p>
                <p>Sources: ${esc((vehicle.evidenceSources || []).join(' · '))}</p>
                <p>${esc(vehicle.evidenceMethod || '')}</p>
              </div>
            </div>
          </div>

          <div class="reasonGrid">
            ${orderedReasons.map((r,idx)=>`
              <article class="reasonCard ${idx===0 && r.level==='mismatch' ? 'strong' : ''}">
                <p class="reasonLabel">${labelFor(r)}</p>
                <h3 class="conditionTitle">${esc(r.condition || conditionTitle(r.question, vehicle))}</h3>
                <p class="reasonQuestion">${esc(r.question)}</p>
              
                <p>${esc(r.impactReason)}</p>

${r.productIntegrity && r.issues?.length ? `
  <div class="integrityIssues">
    <p class="mitigationLabel">RECURRING FAILURE PATTERNS</p>

    ${r.issues.map(issue=>`
      <div class="integrityIssue">
        <h4>${esc(issue.functionAffected)}</h4>

        <p>${esc(issue.failureMode)}</p>

        <div class="evidenceMeta">
          <span>
            ${esc(issue.severity.replaceAll('_',' '))}
            severity
          </span>

          <span>
            ${esc(issue.evidenceStrength.replaceAll('_',' '))}
            evidence
          </span>
        </div>

        <p>
          <strong>Recurrence:</strong>
          ${esc(issue.recurrence)}
        </p>

        <p>
          <strong>Resolution pattern:</strong>
          ${esc(issue.resolutionPattern)}
        </p>

        ${issue.evidenceReason ? `
          <p class="integrityEvidenceReason">
            ${esc(issue.evidenceReason)}
          </p>
        ` : ''}
      </div>
    `).join('')}
  </div>
` : ''}






                ${r.evidenceStrength ? `
                  <div class="evidenceMeta">
                    <span>${esc(r.evidenceStrength.replaceAll('_',' '))} evidence</span>
                    ${r.evidenceReason ? `<p>${esc(r.evidenceReason)}</p>` : ''}
                  </div>
                ` : ''}

                ${r.level==='mismatch' ? `
                  <span class="impactMeta">${esc(r.impact.replaceAll('_',' '))}</span>
                ` : ''}

                ${r.level==='mismatch' && r.mitigation ? `
                <div class="mitigationBlock">
                  <p class="mitigationLabel">WHAT COULD REDUCE THE MISMATCH?</p>
                  <p class="mitigationText">${esc(r.mitigation)}</p>
                </div>
              ` : ''}
              </article>
            `).join('')}
          </div>

          <div class="resultFooter">
            <p>This is a fit assessment for the product definition above, not a condition check of a specific used car.</p>
            <button class="secondary" id="footerRestart">Try another car</button>
          </div>
        </section>` : ''}
    </main>`;

  document.getElementById('startAgain').addEventListener('click', reset);
  document.getElementById('restartBtn').addEventListener('click', reset);
  document.getElementById('whyBtn').addEventListener('click', toggleWhy);
  const footerRestart = document.getElementById('footerRestart');
  if(footerRestart) footerRestart.addEventListener('click', reset);

  const evidenceInfoBtn = document.getElementById('evidenceInfoBtn');
  const evidenceInfo = document.getElementById('evidenceInfo');
  if(evidenceInfoBtn && evidenceInfo){
    evidenceInfoBtn.addEventListener('click', ()=>{
      evidenceInfo.hidden = !evidenceInfo.hidden;
      evidenceInfoBtn.textContent = evidenceInfo.hidden ? 'About the evidence base' : 'Hide evidence details';
    });
  }
}

render();
