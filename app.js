let state = {
  vehicleId:'',
  category:'',
  step:0,
  answers:[],
  priceAnswer:null,
  showWhy:false,
  selectedIndex:null,
  transitioning:false,
  researchStatus:'idle',
  researchError:'',
  researchQuery:'',
  selection:{
    make:'',
    model:'',
    generation:'',
    version:''
  }
};


const resultCopy = {
  'Ideal':
    'The conditions that shape real ownership fit you very well.',

  'Suitable':
    'There are some trade-offs, but no major mismatch dominates the decision.',

  'Not suitable':
    'One or more important ownership conditions conflict with what you want from the product.'
};



/*
 * =========================================================
 * CATEGORY CONFIG
 * =========================================================
 */

const categoryConfig = {

  car: {
    label:'Car',
    noun:'car',
    endpoint:'/api/analyze',
    responseKey:'vehicle'
  },

  sunglasses: {
    label:'Sunglasses',
    noun:'sunglasses',
    endpoint:'/api/analyze-sunglasses',
    responseKey:'sunglasses'
  },

  watch: {
    label:'Watch',
    noun:'watch',
    endpoint:'/api/analyze-watch',
    responseKey:'watch'
  }

};



function currentCategoryConfig(){

  return (
    categoryConfig[state.category] ||
    categoryConfig.car
  );

}



function productNoun(){

  return currentCategoryConfig().noun;

}



/*
 * =========================================================
 * PRODUCT META
 * =========================================================
 */

function productMeta(product){


  /*
   * SUNGLASSES
   */

  if(product.category === 'sunglasses'){

    return {

      make:
        product.brand,

      model:
        product.model,

      generation:[
        product.reference &&
        product.reference !== 'Not specified'
          ? product.reference
          : null,

        product.productionPeriod
      ]
        .filter(Boolean)
        .join(' · '),

      version:[
        product.variant,

        product.size &&
        product.size !== 'Not specified'
          ? product.size
          : null
      ]
        .filter(Boolean)
        .join(' · ')

    };

  }



  /*
   * WATCH
   */

  if(product.category === 'watch'){

    return {

      make:
        product.brand,

      model:
        product.model,

      generation:[
        product.reference &&
        product.reference !== 'Not specified'
          ? product.reference
          : null,

        product.productionPeriod
      ]
        .filter(Boolean)
        .join(' · '),

      version:[
        product.caseSize,
        product.movement
      ]
        .filter(Boolean)
        .join(' · ')

    };

  }



  /*
   * PREPARED CARS
   */

  if(product.id === 'bmw-x3-g01-20d'){

    return {
      make:product.make,
      model:product.model,
      generation:'G01 · 2018–2021',
      version:'20d'
    };

  }


  if(product.id === 'volvo-xc60-d4'){

    return {
      make:product.make,
      model:product.model,
      generation:'II · 2018–2021',
      version:'D4 AWD'
    };

  }


  if(product.id === 'mercedes-glc-220d'){

    return {
      make:product.make,
      model:product.model,
      generation:'X253 facelift · 2019–2021',
      version:'220d 4MATIC'
    };

  }


  if(product.id === 'porsche-911-sc-1980'){

    return {
      make:product.make,
      model:product.model,
      generation:'1980',
      version:'3.0 air-cooled · 915 manual'
    };

  }



  /*
   * DYNAMIC CARS
   */

  return {

    make:
      product.make,

    model:
      product.model,

    generation:
      product.generation ||
      product.variant ||
      '',

    version:
      product.variant ||
      ''

  };

}



/*
 * =========================================================
 * PREPARED CAR CATALOGUE
 * =========================================================
 */

const catalogue = vehicles.map(
  v => ({
    ...productMeta(v),
    id:v.id
  })
);



function uniq(arr){

  return [
    ...new Set(arr)
  ];

}



function filteredCatalogue(){

  const s =
    state.selection;

  return catalogue.filter(
    x =>
      (
        !s.make ||
        x.make === s.make
      ) &&

      (
        !s.model ||
        x.model === s.model
      ) &&

      (
        !s.generation ||
        x.generation === s.generation
      ) &&

      (
        !s.version ||
        x.version === s.version
      )
  );

}



function optionsFor(field){

  const s =
    state.selection;

  return uniq(

    catalogue

      .filter(
        x =>

          (
            field === 'make' ||
            !s.make ||
            x.make === s.make
          ) &&

          (
            field === 'model' ||
            !s.model ||
            x.model === s.model
          ) &&

          (
            field === 'generation' ||
            !s.generation ||
            x.generation === s.generation
          )
      )

      .map(
        x => x[field]
      )

      .filter(Boolean)

  );

}



/*
 * =========================================================
 * CURRENT PRODUCT
 * =========================================================
 */

function getVehicle(){

  return vehicles.find(
    v => v.id === state.vehicleId
  );

}



/*
 * =========================================================
 * PREPARED CAR SELECTION
 * =========================================================
 */

function setSelection(
  field,
  value
){

  const order = [
    'make',
    'model',
    'generation',
    'version'
  ];

  const idx =
    order.indexOf(field);

  state.selection[field] =
    value;

  order
    .slice(idx + 1)
    .forEach(
      k =>
        state.selection[k] = ''
    );

  render();

}



async function beginSelected(){

  if(
    state.category !== 'car'
  ){
    return;
  }

  const match =
    filteredCatalogue();

  if(
    match.length === 1 &&
    state.selection.version
  ){

    const selected =
      match[0];

    const query = [
      selected.make,
      selected.model,
      selected.generation,
      selected.version
    ]
      .filter(Boolean)
      .join(' ');

    await loadCanonicalProduct(
      query
    );

  }

}



/*
 * =========================================================
 * QUESTION NAVIGATION
 * =========================================================
 */

function answer(
  choice,
  index
){

  if(
    state.transitioning
  ){
    return;
  }

  state.selectedIndex =
    index;

  state.transitioning =
    true;

  render();


  setTimeout(
    () => {

      state.answers[
        state.step
      ] = choice;

      state.step += 1;

      state.selectedIndex =
        null;

      state.transitioning =
        false;

      render();

    },
    320
  );

}



function backQuestion(){

  if(
    state.transitioning ||
    state.step === 0
  ){
    return;
  }

  state.step -= 1;

  state.answers =
    state.answers.slice(
      0,
      state.step
    );

  state.selectedIndex =
    null;

  render();

}



/*
 * =========================================================
 * RESET
 * =========================================================
 */

function reset(){

  state = {

    vehicleId:'',

    category:'',

    step:0,

    answers:[],

    priceAnswer:null,

    showWhy:false,

    selectedIndex:null,

    transitioning:false,

    researchStatus:'idle',

    researchError:'',

    researchQuery:'',

    selection:{
      make:'',
      model:'',
      generation:'',
      version:''
    }

  };

  render();

}



/*
 * =========================================================
 * CATEGORY SELECTION
 * =========================================================
 */

function selectCategory(category){

  if(
    category !== 'car' &&
    category !== 'sunglasses' &&
    category !== 'watch'
  ){
    return;
  }


  state.vehicleId =
    '';

  state.category =
    category;

  state.step =
    0;

  state.answers =
    [];

  state.priceAnswer =
    null;

  state.showWhy =
    false;

  state.selectedIndex =
    null;

  state.transitioning =
    false;

  state.researchStatus =
    'idle';

  state.researchError =
    '';

  state.researchQuery =
    '';


  state.selection = {
    make:'',
    model:'',
    generation:'',
    version:''
  };


  render();


  requestAnimationFrame(
    () => {

      document
        .getElementById(
          'unknownVehicle'
        )
        ?.focus();

    }
  );

}



/*
 * =========================================================
 * RESULT DETAILS
 * =========================================================
 */

function toggleWhy(){

  state.showWhy =
    !state.showWhy;

  render();

}



/*
 * =========================================================
 * HTML ESCAPE
 * =========================================================
 */

function esc(s){

  return String(
    s ?? ''
  ).replace(

    /[&<>"']/g,

    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[c])

  );

}



/*
 * =========================================================
 * LEGACY SELECTOR
 * =========================================================
 */

function selector(
  label,
  field,
  placeholder,
  enabled,
  opts
){

  const value =
    state.selection[field];


  return `
    <div
      class="
        selector
        ${enabled ? '' : 'disabled'}
      "
    >

      <label>

        ${esc(label)}

        <span>
          ${value ? 'Selected' : ''}
        </span>

      </label>


      <select
        id="${field}"
        ${enabled ? '' : 'disabled'}
      >

        <option
          value=""
          ${value ? '' : 'selected'}
          disabled
        >
          ${esc(placeholder)}
        </option>


        ${
          opts.map(
            o => `
              <option
                value="${esc(o)}"
                ${o === value ? 'selected' : ''}
              >
                ${esc(o)}
              </option>
            `
          ).join('')
        }

      </select>

    </div>
  `;

}



/*
 * =========================================================
 * LEGACY CONDITION LABEL FALLBACK
 * =========================================================
 */

function conditionTitle(
  question,
  vehicle
){

  const q =
    String(
      question || ''
    ).toLowerCase();


  if(
    q.includes(
      'mostly use this car'
    )
  ){
    return 'Short-trip diesel use';
  }


  if(
    q.includes(
      'expensive premium-car repair'
    )
  ){
    return 'Premium repair-cost exposure';
  }


  if(
    q.includes('electronic') ||
    q.includes('infotainment') ||
    q.includes('sensor warnings')
  ){
    return 'Electronic / software friction';
  }


  if(
    q.includes(
      'driving character'
    )
  ){
    return 'Driving-character fit';
  }


  if(
    q.includes(
      'roads you will use'
    )
  ){
    return 'Ride and wheel suitability';
  }


  if(
    q.includes(
      'gearbox behaviour'
    )
  ){
    return 'Low-speed gearbox behaviour';
  }


  if(
    q.includes('adblue') ||
    q.includes('nox')
  ){
    return 'Diesel emissions-system tolerance';
  }


  if(
    q.includes('sounds, smells') ||
    q.includes('small imperfections')
  ){
    return 'Classic-car imperfection tolerance';
  }


  if(
    q.includes(
      'regular mechanical attention'
    )
  ){
    return 'Mechanical-attention tolerance';
  }


  if(
    q.includes(
      'manual gearbox'
    )
  ){
    return '915 gearbox character';
  }


  if(
    q.includes('heavier steering') ||
    q.includes('physical controls')
  ){
    return 'Physical driving effort';
  }


  if(
    q.includes('a/c') ||
    q.includes('cabin comfort')
  ){
    return 'Cabin comfort expectations';
  }


  if(
    q.includes(
      'judgement near the limit'
    )
  ){
    return 'Old-school dynamic behaviour';
  }


  return question;

}



/*
 * =========================================================
 * EVIDENCE SUMMARY
 * =========================================================
 */

function productImageMarkup(
  product,
  className = ''
){

  const image =
    product?.productImage;


  if(
    !image?.url
  ){
    return '';
  }


  return `
    <div
      class="
        productImageWrap
        ${esc(className)}
      "
    >

      <img
        class="productImage"
        src="${esc(image.url)}"
        alt="${esc(
          image.alt ||
          `${product.brand || product.make || ''} ${product.model || ''}`
        )}"
        loading="eager"
        referrerpolicy="no-referrer"
        onerror="
          this.closest('.productImageWrap').style.display='none'
        "
      />

    </div>
  `;
}





function evidenceSummary(product){

  const count =
    product.evidenceCount ?? 0;

  const unit =
    product.evidenceUnit ||
    'owner reviews & discussions';

  return `${count} ${unit} analyzed`;

}



/*
 * =========================================================
 * RESULT SUMMARY
 * =========================================================
 */

function resultSummary(
  result,
  product
){

  const noun =
    product.category === 'sunglasses'
      ? 'pair'
      : (
          product.category === 'watch'
            ? 'watch'
            : 'car'
        );


  if(
    result === 'Ideal'
  ){

    return product.category === 'sunglasses'

      ? `The conditions that matter most for wearing and owning these ${product.model} sunglasses fit you very well.`

      : `The conditions that matter most for owning this ${product.model} fit you very well.`;

  }


  if(
    result === 'Suitable'
  ){

    return product.category === 'sunglasses'

      ? `These ${product.model} sunglasses can work well for you, but there are a few wearing and ownership trade-offs worth knowing before you buy.`

      : `This ${product.model} can work well for you, but there are a few ownership trade-offs worth knowing before you buy.`;

  }


  return product.category === 'sunglasses'

    ? `Some of the conditions that shape real wearing and ownership are a poor fit for what you want from these ${product.model} sunglasses.`

    : `Some of the conditions that shape real ownership are a poor fit for what you want from this ${product.model}.`;

}



/*
 * =========================================================
 * DYNAMIC PRODUCT STORE
 * =========================================================
 */

function upsertVehicle(product){

  const existing =
    vehicles.findIndex(
      v => v.id === product.id
    );


  if(
    existing >= 0
  ){

    vehicles[existing] =
      product;

  }
  else{

    vehicles.push(
      product
    );

  }

}



/*
 * =========================================================
 * SUNGLASSES -> SHARED UI PRODUCT
 * =========================================================
 */

function sunglassesToUiProduct(
  sunglasses
){

  return {

    ...sunglasses,

    category:
      'sunglasses',


    /*
     * Compatibility aliases for the
     * existing shared UI.
     */

    make:
      sunglasses.brand,


    generation:[
      sunglasses.reference &&
      sunglasses.reference !==
        'Not specified'
        ? sunglasses.reference
        : null,

      sunglasses.productionPeriod
    ]
      .filter(Boolean)
      .join(' · '),


    version:[
      sunglasses.variant,

      sunglasses.size &&
      sunglasses.size !==
        'Not specified'
        ? sunglasses.size
        : null
    ]
      .filter(Boolean)
      .join(' · '),


    engine:
      sunglasses.lens,

    drivetrain:
      sunglasses.frame,


    /*
     * Preserve native sunglasses identity.
     */

    brand:
      sunglasses.brand,

    reference:
      sunglasses.reference,

    frame:
      sunglasses.frame,

    lens:
      sunglasses.lens,

    size:
      sunglasses.size

  };

}



/*
 * =========================================================
 * WATCH -> SHARED UI PRODUCT
 * =========================================================
 */

function watchToUiProduct(
  watch
){

  return {

    ...watch,

    category:
      'watch',


    /*
     * Compatibility aliases for the
     * existing shared UI.
     */

    make:
      watch.brand,


    generation:[
      watch.reference &&
      watch.reference !==
        'Not specified'
        ? watch.reference
        : null,

      watch.productionPeriod
    ]
      .filter(Boolean)
      .join(' · '),


    version:[
      watch.variant,
      watch.caseSize
    ]
      .filter(Boolean)
      .join(' · '),


    engine:
      watch.movement,

    drivetrain:
      '',


    /*
     * Preserve native watch identity.
     */

    brand:
      watch.brand,

    reference:
      watch.reference,

    movement:
      watch.movement,

    caseSize:
      watch.caseSize

  };

}



/*
 * =========================================================
 * CANONICAL PRODUCT RESEARCH
 * =========================================================
 */

async function loadCanonicalProduct(query){

  const config =
    categoryConfig[
      state.category
    ];


  if(
    !config
  ){
    return;
  }


  state.researchStatus =
    'researching';

  state.researchError =
    '';

  render();


  try{


    const response =
      await fetch(

        config.endpoint,

        {

          method:
            'POST',

          headers:{
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              query
            })

        }

      );


    const data =
      await response.json();


    if(
      !response.ok
    ){

      throw new Error(
        data?.error ||
        `${config.label} research failed.`
      );

    }


    let product =
      data[
        config.responseKey
      ];


    if(
      !product
    ){

      throw new Error(
        `${config.label} research returned no product data.`
      );

    }



    /*
     * CATEGORY-SPECIFIC NORMALIZATION
     */

    if(
      state.category === 'watch'
    ){

      product =
        watchToUiProduct(
          product
        );

    }
    else if(
      state.category ===
      'sunglasses'
    ){

      product =
        sunglassesToUiProduct(
          product
        );

    }
    else{

      product = {
        ...product,
        category:'car'
      };

    }



    /*
     * STORE PRODUCT
     */

    upsertVehicle(
      product
    );


    state.vehicleId =
      product.id;

    state.step =
      0;

    state.answers =
      [];

    state.priceAnswer =
      null;

    state.showWhy =
      false;

    state.selectedIndex =
      null;

    state.transitioning =
      false;

    state.researchStatus =
      'idle';

    state.researchError =
      '';


    render();

  }
  catch(err){


    state.researchStatus =
      'error';


    state.researchError =
      err.message ||
      `${config.label} research failed.`;


    render();

  }

}



/*
 * =========================================================
 * SEARCH
 * =========================================================
 */

async function researchUnknownVehicle(){

  const input =
    document.getElementById(
      'unknownVehicle'
    );


  const query =
    (
      input?.value ||
      ''
    ).trim();


  if(
    !query
  ){
    return;
  }


  state.researchQuery =
    query;


  await loadCanonicalProduct(
    query
  );

}



/*
 * =========================================================
 * RENDER
 * =========================================================
 */

function render(){

  const app =
    document.getElementById(
      'app'
    );


  const vehicle =
    getVehicle();



  /*
   * =========================================================
   * HOME / CATEGORY / SEARCH
   * =========================================================
   */

  if(
    !vehicle
  ){


    const config =
      state.category
        ? categoryConfig[
            state.category
          ]
        : null;


    const isCar =
      state.category ===
      'car';


    const isSunglasses =
      state.category ===
      'sunglasses';


    const isWatch =
      state.category ===
      'watch';



    /*
     * SEARCH COPY
     */

    const searchTitle =

      isWatch

        ? 'Which watch are you considering?'

        : isSunglasses

          ? 'Which sunglasses are you considering?'

          : 'Which car are you considering?';



    const searchDescription =

      isWatch

        ? 'Enter the exact model or reference number if you know it.'

        : isSunglasses

          ? 'Enter the exact model or manufacturer reference if you know it.'

          : 'Enter the exact model, year and version if you know them.';



    const searchPlaceholder =

      isWatch

        ? 'e.g. Rolex Submariner 124060'

        : isSunglasses

          ? 'e.g. Ray-Ban Original Wayfarer RB2140 901/58'

          : 'e.g. 2019 Land Rover Discovery Sport 2.0 TD4 180 AWD';



    const searchButtonText =

      state.researchStatus ===
      'researching'

        ? 'Researching…'

        : isWatch

          ? 'Analyze this watch'

          : isSunglasses

            ? 'Analyze these sunglasses'

            : 'Analyze this car';



    /*
     * HOME
     */

    app.innerHTML = `

      <main
        class="
          shell
          productHome
        "
      >


        <section
          class="productHero"
        >

          <h1>
            Is this product right for you?
          </h1>


          <p class="lede">

            Choose what you're considering.

            We’ll use real owner evidence to see
            whether the product fits the way
            you’ll actually use it.

          </p>

        </section>



        <section
          class="categorySection"
        >


          <p class="categoryPrompt">
            Choose a product category
          </p>



          <div class="categoryGrid">



            <!-- CAR -->

            <button

              class="
                categoryCard
                ${isCar ? 'selected' : ''}
              "

              id="categoryCar"

              type="button"
            >


              <span
                class="categoryIcon"
                aria-hidden="true"
              >
                🚗
              </span>


              <span
                class="categoryContent"
              >

                <strong>
                  Car
                </strong>

                <span>
                  Find the exact car you're considering
                </span>

              </span>


              <span
                class="categoryStatus"
              >
                ${
                  isCar
                    ? 'Selected'
                    : 'Choose'
                }
              </span>


            </button>



            <!-- SUNGLASSES -->

            <button

              class="
                categoryCard
                ${isSunglasses ? 'selected' : ''}
              "

              id="categorySunglasses"

              type="button"
            >


              <span
                class="categoryIcon"
                aria-hidden="true"
              >
                🕶️
              </span>


              <span
                class="categoryContent"
              >

                <strong>
                  Sunglasses
                </strong>

                <span>
                  Find the exact sunglasses you're considering
                </span>

              </span>


              <span
                class="categoryStatus"
              >
                ${
                  isSunglasses
                    ? 'Selected'
                    : 'Choose'
                }
              </span>


            </button>



            <!-- WATCH -->

            <button

              class="
                categoryCard
                ${isWatch ? 'selected' : ''}
              "

              id="categoryWatch"

              type="button"
            >


              <span
                class="categoryIcon"
                aria-hidden="true"
              >
                ⌚
              </span>


              <span
                class="categoryContent"
              >

                <strong>
                  Watch
                </strong>

                <span>
                  Watch fit and ownership evidence
                </span>

              </span>


              <span
                class="categoryStatus"
              >
                ${
                  isWatch
                    ? 'Selected'
                    : 'Choose'
                }
              </span>


            </button>


          </div>

        </section>



        ${
          config
            ? `

              <section
                class="productSearch"
              >


                <div
                  class="searchIntro"
                >

                  <h2>
                    ${esc(searchTitle)}
                  </h2>


                  <p>
                    ${esc(searchDescription)}
                  </p>

                </div>



                <div
                  class="productSearchRow"
                >


                  <input

                    id="unknownVehicle"

                    type="text"

                    autocomplete="off"

                    placeholder="${esc(
                      searchPlaceholder
                    )}"

                    value="${esc(
                      state.researchQuery ||
                      ''
                    )}"

                    ${
                      state.researchStatus ===
                      'researching'
                        ? 'disabled'
                        : ''
                    }

                  />


                  <button

                    class="primary"

                    id="researchBtn"

                    ${
                      state.researchStatus ===
                      'researching'
                        ? 'disabled'
                        : ''
                    }

                  >

                    ${esc(
                      searchButtonText
                    )}

                  </button>


                </div>



                ${
                  state.researchStatus ===
                  'researching'

                    ? `

                      <div
                        class="researchState"
                      >


                        <div
                          class="researchSpinner"
                        ></div>


                        <div>

                          <strong>
                            Analyzing owner evidence…
                          </strong>


                          <p>

                            Searching real owner evidence,
                            identifying recurring ownership
                            conditions and building your
                            diagnostic questions.

                          </p>

                        </div>


                      </div>

                    `

                    : ''
                }



                ${
                  state.researchStatus ===
                  'error'

                    ? `

                      <div
                        class="researchError"
                      >

                        ${esc(
                          state.researchError
                        )}

                      </div>

                    `

                    : ''
                }



                <p
                  class="
                    micro
                    searchNote
                  "
                >

                  Previously researched models can load instantly.
                  A new model may take a little longer.

                </p>


              </section>

            `
            : ''
        }


      </main>

    `;



    /*
     * CATEGORY EVENTS
     */

    const categoryCar =
      document.getElementById(
        'categoryCar'
      );


    if(
      categoryCar
    ){

      categoryCar.addEventListener(

        'click',

        () =>
          selectCategory(
            'car'
          )

      );

    }



    const categorySunglasses =
      document.getElementById(
        'categorySunglasses'
      );


    if(
      categorySunglasses
    ){

      categorySunglasses.addEventListener(

        'click',

        () =>
          selectCategory(
            'sunglasses'
          )

      );

    }



    const categoryWatch =
      document.getElementById(
        'categoryWatch'
      );


    if(
      categoryWatch
    ){

      categoryWatch.addEventListener(

        'click',

        () =>
          selectCategory(
            'watch'
          )

      );

    }



    /*
     * SEARCH EVENTS
     */

    const researchBtn =
      document.getElementById(
        'researchBtn'
      );


    const unknownVehicle =
      document.getElementById(
        'unknownVehicle'
      );


    if(
      researchBtn
    ){

      researchBtn.addEventListener(

        'click',

        researchUnknownVehicle

      );

    }


    if(
      unknownVehicle
    ){

      unknownVehicle.addEventListener(

        'keydown',

        e => {

          if(
            e.key === 'Enter'
          ){

            researchUnknownVehicle();

          }

        }

      );

    }


    return;

  }



  /*
   * =========================================================
   * SHARED PRODUCT DATA
   * =========================================================
   */


  const isWatchProduct =
    vehicle.category ===
    'watch';


  const isSunglassesProduct =
    vehicle.category ===
    'sunglasses';



  const noun =

    isWatchProduct

      ? 'watch'

      : isSunglassesProduct

        ? 'sunglasses'

        : 'car';



  const nounTitle =

    isWatchProduct

      ? 'Watch'

      : isSunglassesProduct

        ? 'Sunglasses'

        : 'Car';



  const productIdentity =

    (
      isWatchProduct ||
      isSunglassesProduct
    )

      ? `${vehicle.brand} ${vehicle.model}`

      : `${vehicle.make} ${vehicle.model}`;



const productVariant =

  isWatchProduct

    ? [
        vehicle.reference &&
        vehicle.reference !== 'Not specified'
          ? vehicle.reference
          : null,

        vehicle.variant,

        vehicle.caseSize
      ]
        .filter(Boolean)
        .join(' · ')

    : isSunglassesProduct

      ? [
          vehicle.reference &&
          vehicle.reference !== 'Not specified'
            ? vehicle.reference
            : null,

          vehicle.variant &&
          vehicle.variant !== 'Not specified'
            ? vehicle.variant
            : null,

          vehicle.size &&
          vehicle.size !== 'Not specified'
            ? vehicle.size
            : null
        ]
          .filter(Boolean)
          .join(' · ')

      : vehicle.variant;


  /*
   * =========================================================
   * MDQ QUESTIONS
   * =========================================================
   */


  const finished =
    state.step >=
    vehicle.questions.length;



  const needsPriceQuestion =

    finished &&

    vehicle.marketPrice &&

    !state.priceAnswer;



  if(
    !finished
  ){


    const q =
      vehicle.questions[
        state.step
      ];


    const progressPercent =
      Math.round(

        (
          state.step /
          vehicle.questions.length
        ) * 100

      );



    app.innerHTML = `

      <main
        class="
          shell
          compact
        "
      >


        <div
          class="questionTop"
        >


          <div
            class="navRow"
          >


            <button

              class="textButton"

              id="changeCar"

            >

              ← Change ${esc(noun)}

            </button>



            <button

              class="textButton"

              id="backQuestion"

              ${
                state.step === 0
                  ? 'disabled'
                  : ''
              }

            >

              Back

            </button>


          </div>



          <span class="micro">

            ${
              state.step + 1
            }

            /

            ${
              vehicle.questions.length
            }

          </span>


        </div>



        <div
          class="progressRow"
        >


          <span>
            ${esc(
              productIdentity
            )}
          </span>


          <span>
            ${progressPercent}%
          </span>


        </div>



        <div
          class="questionEvidenceLine"
        >


          <span
            class="evidenceDot"
          ></span>


          <span>

            <strong>
              ${esc(
                evidenceSummary(
                  vehicle
                )
              )}
            </strong>

          </span>


          ${
            vehicle.evidenceLastUpdated

              ? `

                <span
                  class="evidenceUpdated"
                >

                  Updated
                  ${esc(
                    vehicle.evidenceLastUpdated
                  )}

                </span>

              `

              : ''
          }


        </div>



        <div class="progress">

          <span
            style="
              width:${progressPercent}%
            "
          ></span>

        </div>




<section
  class="questionBlock"
>


  ${
    isSunglassesProduct
      ? productImageMarkup(
          vehicle,
          'questionProductImage'
        )
      : ''
  }


  <p class="variant">
    ${esc(
      productVariant
    )}
  </p>



          <h2>
            ${esc(
              q.text
            )}
          </h2>



          ${
            q.clarification

              ? `

                <p
                  class="questionClarification"
                >

                  ${esc(
                    q.clarification
                  )}

                </p>

              `

              : ''
          }



          <div
            class="answers"
          >


            ${
              q.answers.map(

                (a,i) => {


                  const selected =
                    state.selectedIndex ===
                    i;


                  const dimmed =

                    state.transitioning &&
                    !selected;


                  return `

                    <button

                      class="
                        answer
                        ${
                          selected
                            ? 'selected'
                            : ''
                        }
                        ${
                          dimmed
                            ? 'dimmed'
                            : ''
                        }
                        ${
                          state.transitioning
                            ? 'locked'
                            : ''
                        }
                      "

                      data-answer="${i}"

                    >


                      <span
                        class="letter"
                      >
                        ${
                          String.fromCharCode(
                            65 + i
                          )
                        }
                      </span>


                      <span>
                        ${esc(
                          a.label
                        )}
                      </span>


                    </button>

                  `;

                }

              ).join('')
            }


          </div>



          <div
            class="transitionHint"
          >

            ${
              state.transitioning

                ? 'Got it — next question'

                : ''
            }

          </div>


        </section>


      </main>

    `;



    document
      .getElementById(
        'changeCar'
      )
      .addEventListener(

        'click',

        reset

      );



    document
      .getElementById(
        'backQuestion'
      )
      .addEventListener(

        'click',

        backQuestion

      );



    document
      .querySelectorAll(
        '[data-answer]'
      )
      .forEach(

        btn => {


          btn.addEventListener(

            'click',

            () => answer(

              q.answers[
                Number(
                  btn.dataset.answer
                )
              ],

              Number(
                btn.dataset.answer
              )

            )

          );

        }

      );


    return;

  }



  /*
   * =========================================================
   * PRICE CONTEXT
   * =========================================================
   */


  if(
    needsPriceQuestion
  ){


    const price =
      vehicle.marketPrice;



    const formatter =
      new Intl.NumberFormat(

        'en-GB',

        {

          style:
            'currency',

          currency:
            price.currency,

          maximumFractionDigits:
            0

        }

      );



    const priceRange =
      `${formatter.format(
        price.low
      )}–${formatter.format(
        price.high
      )}`;



    const priceProductText =
      isSunglassesProduct
        ? 'These sunglasses'
        : `This ${noun}`;



    app.innerHTML = `

      <main
        class="
          shell
          compact
        "
      >


        <div
          class="questionTop"
        >


          <div
            class="navRow"
          >


            <button

              class="textButton"

              id="changeCar"

            >

              ← Change ${esc(noun)}

            </button>



            <button

              class="textButton"

              id="backQuestion"

            >

              Back

            </button>


          </div>



          <span
            class="micro"
          >

            PRICE CONTEXT

          </span>


        </div>



        <div
          class="progressRow"
        >


          <span>
            ${esc(
              productIdentity
            )}
          </span>


          <span>
            100%
          </span>


        </div>



        <div
          class="progress"
        >

          <span
            style="
              width:100%
            "
          ></span>

        </div>



        <section
          class="questionBlock"
        >


          <p
            class="variant"
          >
            ${esc(
              productVariant
            )}
          </p>



          <h2>

            ${esc(
              priceProductText
            )}

            typically ${
              isSunglassesProduct
                ? 'cost'
                : 'costs'
            }

            around

            ${esc(
              priceRange
            )}

            in today’s market.

            How does that price level feel to you?

          </h2>



          <p
            class="questionClarification"
          >

            This reflects typical current asking prices
            for comparable examples in
            ${esc(
              price.market
            )}.

          </p>



          <div
            class="answers"
          >


            <button

              class="answer"

              data-price-answer="comfortable"

            >


              <span
                class="letter"
              >
                A
              </span>


              <span>

                Comfortable — that price level feels
                reasonable for ${
                  isSunglassesProduct
                    ? 'these sunglasses'
                    : `this ${esc(noun)}`
                }.

              </span>


            </button>



            <button

              class="answer"

              data-price-answer="stretch"

            >


              <span
                class="letter"
              >
                B
              </span>


              <span>

                A stretch — I could consider it,
                but the price matters.

              </span>


            </button>



            <button

              class="answer"

              data-price-answer="too_high"

            >


              <span
                class="letter"
              >
                C
              </span>


              <span>

                Too high — at that price level
                I would probably not choose
                ${
                  isSunglassesProduct
                    ? 'these sunglasses'
                    : `this ${esc(noun)}`
                }.

              </span>


            </button>


          </div>


        </section>


      </main>

    `;



    document
      .getElementById(
        'changeCar'
      )
      .addEventListener(

        'click',

        reset

      );



    document
      .getElementById(
        'backQuestion'
      )
      .addEventListener(

        'click',

        () => {


          state.step =
            Math.max(

              0,

              vehicle.questions.length -
              1

            );


          state.answers =
            state.answers.slice(

              0,

              state.step

            );


          render();

        }

      );



    document
      .querySelectorAll(
        '[data-price-answer]'
      )
      .forEach(

        btn => {


          btn.addEventListener(

            'click',

            () => {


              state.priceAnswer =
                btn.dataset
                  .priceAnswer;


              render();

            }

          );

        }

      );


    return;

  }



  /*
   * =========================================================
   * RESULT EVALUATION
   * =========================================================
   */


  const evaluation =
    evaluateResult(

      vehicle,

      state.answers

    );



  const integrityOverride =

    vehicle.productIntegrity
      ?.overrideFit === true;



  let result =
    evaluation.result;



  /*
   * PRICE EFFECT
   */

  if(

    state.priceAnswer ===
      'stretch' &&

    result ===
      'Ideal'

  ){

    result =
      'Suitable';

  }



  if(
    state.priceAnswer ===
    'too_high'
  ){

    result =
      'Not suitable';

  }



  /*
   * PRODUCT INTEGRITY OVERRIDE
   */

  if(
    integrityOverride
  ){

    result =
      'Not suitable';

  }



  /*
   * FINAL SUMMARY
   */

  let finalSummary;



  if(
    integrityOverride
  ){

    finalSummary =

      isSunglassesProduct

        ? `Recurring owner evidence indicates a serious product-integrity concern that outweighs an otherwise acceptable ownership fit for these ${vehicle.model} sunglasses.`

        : `Recurring owner evidence indicates a serious product-integrity concern that outweighs an otherwise acceptable ownership fit for this ${vehicle.model}.`;

  }


  else if(
    state.priceAnswer ===
    'too_high'
  ){

    finalSummary =

      isSunglassesProduct

        ? `The wearing and ownership fit may work, but at the current market price these ${vehicle.model} sunglasses do not make sense for you.`

        : `The ownership fit may work, but at the current market price this ${vehicle.model} does not make sense for you.`;

  }


  else{

    finalSummary =
      resultSummary(

        result,

        vehicle

      );

  }



  /*
   * =========================================================
   * RESULT REASONS
   * =========================================================
   */


  const reasons =
    evaluation.mapped.map(

      a => ({

        ...a,

        level:

          a.impact ===
            'positive'

            ? 'fit'

            : (

                a.impact ===
                  'neutral'

                  ? 'consider'

                  : 'mismatch'

              )

      })

    );



  const resultPriceFormatter =
    new Intl.NumberFormat(

      'en-GB',

      {

        style:
          'currency',

        currency:
          vehicle.marketPrice.currency,

        maximumFractionDigits:
          0

      }

    );



  const resultPriceRange =
    `${resultPriceFormatter.format(
      vehicle.marketPrice.low
    )}–${resultPriceFormatter.format(
      vehicle.marketPrice.high
    )}`;



  const priceReason =

    state.priceAnswer ===
      'comfortable'

      ? {

          level:
            'fit',

          impact:
            'positive',

          condition:
            'Price level',

          question:
            `How does the current ${resultPriceRange} price range feel to you?`,

          impactReason:

            isSunglassesProduct

              ? 'This price level feels reasonable to you for these specific sunglasses.'

              : `This price level feels reasonable to you for this specific ${noun}.`

        }


      : state.priceAnswer ===
        'stretch'

        ? {

            level:
              'consider',

            impact:
              'neutral',

            condition:
              'Price level',

            question:
              `How does the current ${resultPriceRange} price range feel to you?`,

            impactReason:

              isSunglassesProduct

                ? 'You could still consider these sunglasses, but the current market price creates some purchase friction.'

                : `You could still consider the ${noun}, but the current market price creates some purchase friction.`

          }


        : {

            level:
              'mismatch',

            impact:
              'high_negative',

            condition:
              'Price level',

            question:
              `How does the current ${resultPriceRange} price range feel to you?`,

            impactReason:

              isSunglassesProduct

                ? 'At this price level, you would probably not choose these sunglasses.'

                : `At this price level, you would probably not choose this ${noun}.`

          };



  const integrityReason =

    vehicle.productIntegrity &&

    vehicle.productIntegrity.level !==
      'no_meaningful_signal'

      ? {

          level:

            vehicle.productIntegrity
              .overrideFit

              ? 'mismatch'

              : 'consider',


          impact:

            vehicle.productIntegrity
              .overrideFit

              ? 'critical_negative'

              : 'neutral',


          condition:
            'Product integrity risk',


          question:
            vehicle.productIntegrity
              .summary,


          impactReason:
            vehicle.productIntegrity
              .evidenceReason,


          productIntegrity:
            true,


          issues:

            Array.isArray(
              vehicle.productIntegrity
                .issues
            )

              ? vehicle.productIntegrity
                  .issues

              : []

        }

      : null;



  /*
   * REASON ORDER
   */

  const orderedReasons = [


    ...(

      integrityReason?.impact ===
      'critical_negative'

        ? [
            integrityReason
          ]

        : []

    ),


    ...reasons.filter(

      r =>
        r.impact ===
        'critical_negative'

    ),


    ...(

      priceReason.level ===
      'mismatch'

        ? [
            priceReason
          ]

        : []

    ),


    ...reasons.filter(

      r =>
        r.impact ===
        'high_negative'

    ),


    ...reasons.filter(

      r =>
        r.impact ===
        'medium_negative'

    ),


    ...(

      integrityReason?.level ===
      'consider'

        ? [
            integrityReason
          ]

        : []

    ),


    ...(

      priceReason.level ===
      'consider'

        ? [
            priceReason
          ]

        : []

    ),


    ...reasons.filter(

      r =>
        r.level ===
        'consider'

    ),


    ...(

      priceReason.level ===
      'fit'

        ? [
            priceReason
          ]

        : []

    ),


    ...reasons.filter(

      r =>
        r.level ===
        'fit'

    )

  ];



  /*
   * RESULT LABELS
   */

  const labelFor =
    r => {


      if(
        r.productIntegrity
      ){

        return r.level ===
          'mismatch'

          ? 'PRODUCT INTEGRITY CONCERN'

          : 'PRODUCT INTEGRITY SIGNAL';

      }


      return r.level ===
        'fit'

        ? 'WORKS WELL FOR YOU'

        : (

            r.level ===
              'mismatch'

              ? 'POTENTIAL MISMATCH'

              : 'THINGS TO CONSIDER'

          );

    };



  /*
   * =========================================================
   * RESULT SCREEN
   * =========================================================
   */


  app.innerHTML = `

    <main
      class="
        shell
        compact
        resultShell
      "
    >


      <button

        class="textButton"

        id="startAgain"

      >

        ← Start again

      </button>


<section
  class="resultHero"
>


  ${
    isSunglassesProduct
      ? productImageMarkup(
          vehicle,
          'resultProductImage'
        )
      : ''
  }


  <div
    class="resultKicker"
  >


          <span
            class="resultCar"
          >

            ${esc(
              productIdentity
            )}

          </span>


          <span
            class="resultMeta"
          >

            ${esc(
              productVariant
            )}

          </span>


        </div>



        <div
          class="evidenceLine"
        >


          <span
            class="evidenceDot"
          ></span>


          <span>

            <strong>

              ${esc(
                evidenceSummary(
                  vehicle
                )
              )}

            </strong>

          </span>


          <span
            class="evidenceUpdated"
          >

            Updated

            ${esc(
              vehicle.evidenceLastUpdated ||
              ''
            )}

          </span>


        </div>



        <h1

          class="
            result
            ${
              result ===
              'Not suitable'
                ? 'long'
                : ''
            }
          "

        >

          ${esc(
            result
          )}

        </h1>



        <p
          class="
            lede
            resultLead
          "
        >

          ${esc(
            finalSummary
          )}

        </p>



        <div
          class="resultActions"
        >


          <button

            class="primary"

            id="whyBtn"

          >

            ${
              state.showWhy
                ? 'Hide why'
                : 'Why?'
            }

          </button>



          <button

            class="secondary"

            id="restartBtn"

          >

            ${
              isSunglassesProduct
                ? 'Try other sunglasses'
                : `Try another ${esc(noun)}`
            }

          </button>


        </div>


      </section>



      ${
        state.showWhy

          ? `

            <section
              class="whyPanel"
            >


              <div
                class="whyIntro"
              >


                <h2>
                  Why this result?
                </h2>



                <div>


                  <p>

                    We are not scoring whether this is
                    ${
                      isSunglassesProduct
                        ? 'a good pair of sunglasses'
                        : `a good ${esc(noun)}`
                    }.

                    We are checking whether the ownership
                    ${
                      isSunglassesProduct
                        ? 'and wearing '
                        : ''
                    }
                    conditions that repeatedly matter to
                    real owners fit you.

                  </p>



                  <button

                    class="evidenceInfoButton"

                    id="evidenceInfoBtn"

                  >

                    About the evidence base

                  </button>



                  <div

                    class="evidenceInfo"

                    id="evidenceInfo"

                    hidden

                  >


                    <p>

                      <strong>

                        ${esc(
                          evidenceSummary(
                            vehicle
                          )
                        )}

                      </strong>

                    </p>



                    <p>

                      Sources:

                      ${esc(

                        (
                          vehicle.evidenceSources ||
                          []
                        ).join(
                          ' · '
                        )

                      )}

                    </p>



                    <p>

                      ${esc(
                        vehicle.evidenceMethod ||
                        ''
                      )}

                    </p>


                  </div>


                </div>


              </div>



              <div
                class="reasonGrid"
              >


                ${
                  orderedReasons.map(

                    (r,idx) => `


                      <article

                        class="
                          reasonCard
                          ${
                            idx === 0 &&
                            r.level ===
                              'mismatch'

                              ? 'strong'

                              : ''
                          }
                        "

                      >


                        <p
                          class="reasonLabel"
                        >

                          ${labelFor(r)}

                        </p>



                        <h3
                          class="conditionTitle"
                        >

                          ${esc(

                            r.condition ||

                            conditionTitle(

                              r.question,

                              vehicle

                            )

                          )}

                        </h3>



                        <p
                          class="reasonQuestion"
                        >

                          ${esc(
                            r.question
                          )}

                        </p>



                        <p>

                          ${esc(
                            r.impactReason
                          )}

                        </p>



                        ${
                          r.productIntegrity &&
                          r.issues?.length

                            ? `

                              <div
                                class="integrityIssues"
                              >


                                <p
                                  class="mitigationLabel"
                                >

                                  RECURRING FAILURE PATTERNS

                                </p>



                                ${
                                  r.issues.map(

                                    issue => `


                                      <div
                                        class="integrityIssue"
                                      >


                                        <h4>

                                          ${esc(
                                            issue.functionAffected
                                          )}

                                        </h4>



                                        <p>

                                          ${esc(
                                            issue.failureMode
                                          )}

                                        </p>



                                        <div
                                          class="evidenceMeta"
                                        >


                                          <span>

                                            ${esc(

                                              String(
                                                issue.severity ||
                                                ''
                                              )
                                                .replaceAll(
                                                  '_',
                                                  ' '
                                                )

                                            )}

                                            severity

                                          </span>



                                          <span>

                                            ${esc(

                                              String(
                                                issue.evidenceStrength ||
                                                ''
                                              )
                                                .replaceAll(
                                                  '_',
                                                  ' '
                                                )

                                            )}

                                            evidence

                                          </span>


                                        </div>



                                        <p>

                                          <strong>
                                            Recurrence:
                                          </strong>

                                          ${esc(
                                            issue.recurrence
                                          )}

                                        </p>



                                        <p>

                                          <strong>
                                            Resolution pattern:
                                          </strong>

                                          ${esc(
                                            issue.resolutionPattern
                                          )}

                                        </p>



                                        ${
                                          issue.evidenceReason

                                            ? `

                                              <p
                                                class="integrityEvidenceReason"
                                              >

                                                ${esc(
                                                  issue.evidenceReason
                                                )}

                                              </p>

                                            `

                                            : ''
                                        }


                                      </div>

                                    `

                                  ).join('')
                                }


                              </div>

                            `

                            : ''
                        }



                        ${
                          r.evidenceStrength

                            ? `

                              <div
                                class="evidenceMeta"
                              >


                                <span>

                                  ${esc(

                                    r.evidenceStrength
                                      .replaceAll(
                                        '_',
                                        ' '
                                      )

                                  )}

                                  evidence

                                </span>



                                ${
                                  r.evidenceReason

                                    ? `

                                      <p>

                                        ${esc(
                                          r.evidenceReason
                                        )}

                                      </p>

                                    `

                                    : ''
                                }


                              </div>

                            `

                            : ''
                        }



                        ${
                          r.level ===
                          'mismatch'

                            ? `

                              <span
                                class="impactMeta"
                              >

                                ${esc(

                                  r.impact.replaceAll(
                                    '_',
                                    ' '
                                  )

                                )}

                              </span>

                            `

                            : ''
                        }



                        ${
                          r.level ===
                            'mismatch' &&
                          r.mitigation

                            ? `

                              <div
                                class="mitigationBlock"
                              >


                                <p
                                  class="mitigationLabel"
                                >

                                  WHAT COULD REDUCE THE MISMATCH?

                                </p>


                                <p
                                  class="mitigationText"
                                >

                                  ${esc(
                                    r.mitigation
                                  )}

                                </p>


                              </div>

                            `

                            : ''
                        }


                      </article>

                    `

                  ).join('')
                }


              </div>



              <div
                class="resultFooter"
              >


                <p>

                  This is a fit assessment for the
                  product definition above, not a
                  condition or authenticity check
                  of one specific individual item.

                </p>



                <button

                  class="secondary"

                  id="footerRestart"

                >

                  ${
                    isSunglassesProduct
                      ? 'Try other sunglasses'
                      : `Try another ${esc(noun)}`
                  }

                </button>


              </div>


            </section>

          `

          : ''
      }


    </main>

  `;



  /*
   * =========================================================
   * RESULT EVENTS
   * =========================================================
   */


  document
    .getElementById(
      'startAgain'
    )
    .addEventListener(

      'click',

      reset

    );



  document
    .getElementById(
      'restartBtn'
    )
    .addEventListener(

      'click',

      reset

    );



  document
    .getElementById(
      'whyBtn'
    )
    .addEventListener(

      'click',

      toggleWhy

    );



  const footerRestart =
    document.getElementById(
      'footerRestart'
    );


  if(
    footerRestart
  ){

    footerRestart.addEventListener(

      'click',

      reset

    );

  }



  const evidenceInfoBtn =
    document.getElementById(
      'evidenceInfoBtn'
    );


  const evidenceInfo =
    document.getElementById(
      'evidenceInfo'
    );


  if(
    evidenceInfoBtn &&
    evidenceInfo
  ){

    evidenceInfoBtn.addEventListener(

      'click',

      () => {


        evidenceInfo.hidden =
          !evidenceInfo.hidden;


        evidenceInfoBtn.textContent =

          evidenceInfo.hidden

            ? 'About the evidence base'

            : 'Hide evidence details';

      }

    );

  }

}



/*
 * =========================================================
 * INITIAL RENDER
 * =========================================================
 */

render();
