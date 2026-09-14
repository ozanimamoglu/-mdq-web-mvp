/*
 * =========================================================
 * ANALYTICS
 * =========================================================
 */

function getCampaignSessionId(){

  let sessionId =
    sessionStorage.getItem(
      'campaign_session_id'
    );

  if(
    !sessionId
  ){

    sessionId =
      crypto.randomUUID();

    sessionStorage.setItem(
      'campaign_session_id',
      sessionId
    );
  }

  return sessionId;
}


function trackEvent(name, data = {}) {
  fetch('/api/campaign-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      campaignId:
        data.campaign || 'krop',
      eventName:
        name,
      questionNumber:
        data.question || null,
      result:
        data.result || null,
      sessionId:
        getCampaignSessionId(),
      referrer:
        document.referrer || null,
      utmSource:
        new URLSearchParams(
          window.location.search
        ).get('utm_source'),

      utmMedium:
        new URLSearchParams(
          window.location.search
        ).get('utm_medium'),
      utmCampaign:
        new URLSearchParams(
          window.location.search
        ).get('utm_campaign')

    })

  }).catch(
    error =>
      console.error(
        'Campaign analytics error:',
        error
      )
  );
}


/*
 * =========================================================
 * APP STATE
 * =========================================================
 */

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


/*
 * =========================================================
 * STATIC CAMPAIGN STATE
 * =========================================================
 */

let campaignState = {
  step: 0,
  answers: [],
  selectedIndex: null,
  transitioning: false,
  reveal: null,
  finished: false,
  analyticsStarted: false,
  kropPage: 'intro'
};


/*
 * =========================================================
 * CAMPAIGN ROUTING
 * =========================================================
 */

function getActiveCampaign(){

  const params =
    new URLSearchParams(
      window.location.search
    );

const queryCampaign =
  params.get('campaign');

if(
  queryCampaign &&
  kropCampaigns?.[queryCampaign]
){
  return kropCampaigns[
    queryCampaign
  ];
}

const path =
  window.location.pathname
    .replace(/\/+$/, '')
    .toLowerCase();

if(
  path === '/krop-chef-knives'

){
  return kropCampaigns.krop;
}
return null;
}




  
/*
 * =========================================================
 * CAMPAIGN RESULT
 * =========================================================
 */

function evaluateCampaign(){

  const score =
    campaignState.answers
      .slice(0, 4)
      .reduce(
        (total, answer) =>
          total +
          (
            Number(
              answer?.score
            ) || 0
          ),
        0
      );


  /*
   * No Not Suitable result.
   *
   * 5–8 = Ideal
   * 0–4 = Suitable
   */

  return score >= 5
    ? 'Ideal'
    : 'Suitable';
}



/*
 * =========================================================
 * CAMPAIGN ANSWER
 * =========================================================
 */

function answerCampaign(
  answer,
  index
){

  if(
    campaignState.transitioning
  ){
    return;
  }

  const campaign =
    getActiveCampaign();

  if(
    !campaign
  ){
    return;
  }

const question =
  campaign.questions[
    campaignState.step
  ];

trackEvent(
  'question_answered',
  {
    campaign: campaign.id,
    question:
      campaignState.step + 1
  }
);

campaignState.selectedIndex =
  index;
  campaignState.transitioning =
    true;

  render();



  /*
   * QUESTIONS 5–6
   * answer -> reveal -> next
   */

  if(
    question.reveal
  ){
    setTimeout(
      () => {

        campaignState.answers[
          campaignState.step
        ] = answer;

        campaignState.reveal =
          question.reveal;

        campaignState.selectedIndex =
          null;

        render();

        setTimeout(
          () => {

            campaignState.reveal =
              null;

            campaignState.step +=
              1;

            campaignState.transitioning =
              false;

           if(
  campaignState.step >=
    campaign.questions.length
){

  campaignState.finished =
    true;

  trackEvent(
    'campaign_completed',
    {
      campaign: campaign.id,
      result:
        evaluateCampaign()
    }
  );
}

render();
          },
          4000
        );
      },
      250
    );
    return;
  }



  /*
   * QUESTIONS 1–4
   * fast transition
   */

  setTimeout(
    () => {

      campaignState.answers[
        campaignState.step
      ] = answer;
      campaignState.step +=
        1;
      campaignState.selectedIndex =
        null;
      campaignState.transitioning =
        false;

      render();
    },
    320
  );
}



/*
 * =========================================================
 * CAMPAIGN BACK
 * =========================================================
 */

function backCampaignQuestion(){

  if(
    campaignState.transitioning ||
    campaignState.step === 0 ||
    campaignState.finished
  ){
    return;
  }
  campaignState.step -=
    1;
  campaignState.answers =
    campaignState.answers.slice(
      0,
      campaignState.step
    );
  campaignState.selectedIndex =
    null;
  campaignState.reveal =
    null;

  render();
}


/*
 * =========================================================
 * KROP CAMPAIGN RENDERER
 * =========================================================
 */


function renderCampaign(
  app,
  campaign
){

  if(
    !campaignState.analyticsStarted
  ){
    campaignState.analyticsStarted =
      true;

    trackEvent(
      'campaign_started',
      {
        campaign: campaign.id
      }
    );
  }


  /*
   * =========================================================
   * KROP VERSION C — DIRECT PRODUCT LANDING PAGE
   * =========================================================
   */


if(
  campaign.id === 'krop'
){

  const cleanNumber =
    String(
      campaign.whatsappNumber ||
      ''
    ).replace(
      /\D/g,
      ''
    );

  const whatsappUrl =
    cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
          campaign.whatsappMessage
        )}`
      : '';


  /*
   * =========================================================
   * PAGE 1 — AD / CURIOSITY
   * =========================================================
   */

  if(
    campaignState.kropPage ===
    'intro'
  ){

    app.innerHTML = `

      <main class="kropAd">

        <section class="kropAdHero">

          <img
            class="kropAdHeroImage"
            src="/KROP-chopper-AI.jpg"
            alt="KROP Handmade Damascus Chef's Chopper"
          />

          <div
            class="kropAdShade"
          ></div>


          <div
            class="kropAdBrand"
          >

            <strong>
              KROP
            </strong>

            <span>
              CHEF KNIVES
            </span>

          </div>


          <div
            class="kropAdHook"
          >

            <h1>

              Why on earth<br>
              you pay €249.99<br>
              <em>
                for a chopper?
              </em>

            </h1>


            <p>
              Let’s look at the real reasons.
            </p>


            <button
              class="kropAdFindOut"
              id="kropFindOut"
              type="button"
            >

              <span>
                FIND OUT
              </span>

              <span
                aria-hidden="true"
              >
                →
              </span>
            </button>
          </div>

          <div
            class="kropAdFooter"
          >

            <span>
              KROP CHEF KNIVES
            </span>

            <span>
              MORE THAN A KNIFE
            </span>
          </div>
        </section>
      </main>
    `;


    document
      .getElementById(
        'kropFindOut'
      )
      ?.addEventListener(
        'click',
        () => {

          trackEvent(
            'reasons_viewed',
            {
              campaign:
                campaign.id
            }
          );

          campaignState.kropPage =
            'reasons';

          window.scrollTo(
            0,
            0
          );

          render();
        }
      );

    return;
  }



  /*
   * =========================================================
   * PAGE 2 — REASONS / STORY / PRODUCT
   * =========================================================
   */


app.innerHTML = `

  <main class="kropReasonsPage">


    <!-- HERO -->

    <section class="kropCraftHero">

      <img
        src="/sinan-tansal.jpg"
        alt="Sinan Tansal crafting a handmade knife"
      />

      <div class="kropCraftShade"></div>


      <div class="kropCraftBrand">

        <strong>
          KROP
        </strong>

        <span>
          CHEF KNIVES
        </span>

      </div>


      <div class="kropCraftQuote">

        <p>
          “A knife is not just a tool.<br>
          It becomes part of the way you cook.”
        </p>

        <strong>
          SINAN TANSAL
        </strong>

        <span>
          CRAFTSMAN
        </span>

      </div>

    </section>



    <!-- MAIN SHEET -->

    <section class="kropReasonsContent">


      <header class="kropReasonsIntro">

        <h1>
          More than a chopper.
          <em>
            A piece of art.
          </em>
        </h1>

        <p>
          Handcrafted by Turkish master craftsman Sinan Tansal,
          this chopper brings together tradition, nature and
          extraordinary craftsmanship — to make your cooking
          experience truly special.
        </p>

      </header>



      <!-- SIX REASONS -->

      <div class="kropReasonGrid">


        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="M7 11V5a1 1 0 0 1 2 0v5-5a1 1 0 0 1 2 0v5-4a1 1 0 0 1 2 0v4-3a1 1 0 0 1 2 0v7c0 4-2.5 7-6.5 7S3 18.5 3 15v-3a1 1 0 0 1 2 0v2"/>
            </svg>

          </div>

          <h2>
            Handmade
          </h2>

          <p>
            Crafted by a Turkish master artisan
          </p>

        </article>



        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>
            </svg>

          </div>

          <h2>
            135-layer<br>
            Damascus steel
          </h2>

          <p>
            Exceptional beauty and lasting performance
          </p>

        </article>



        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="M12 21V9M12 9 8 5M12 9l4-4M6 21h12M7 11c-3 0-4-2-4-4 3 0 5 1 6 4M17 11c3 0 4-2 4-4-3 0-5 1-6 4"/>
            </svg>

          </div>

          <h2>
            1,500-year-old<br>
            fossilized oak
          </h2>

          <p>
            A unique handle with a story
          </p>

        </article>



        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="M12 21S4 16 4 9a4 4 0 0 1 7-2.6A4 4 0 0 1 18 9c0 7-6 12-6 12Z"/>
            </svg>

          </div>

          <h2>
            More joy in cooking
          </h2>

          <p>
            Turns everyday cooking into a ritual
          </p>

        </article>



        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>
            </svg>

          </div>

          <h2>
            Unique character
          </h2>

          <p>
            No two knives are ever the same
          </p>

        </article>



        <article class="kropReason">

          <div class="kropReasonIcon">

            <svg viewBox="0 0 24 24">
              <path d="M7 9c2.2-2.6 4.1-2.6 5.5 0 1.4-2.6 3.3-2.6 5.5 0 2.1 2.5.7 6-2.1 6-1.5 0-2.6-1-3.4-2.2C11.7 14 10.6 15 9.1 15 6.3 15 4.9 11.5 7 9Z"/>
            </svg>

          </div>

          <h2>
            Built to last
          </h2>

          <p>
            A lifetime companion in your kitchen
          </p>

        </article>


      </div>



      <!-- CLOSING LINE -->

      <div class="kropCompactClose">
        Elevate the everyday.
      </div>



      <!-- OFFER -->

      <div class="kropReasonsOffer">

        <small>
          SPECIAL OFFER
        </small>

        <strong>
          10% DISCOUNT
        </strong>

      </div>



      <!-- WHATSAPP -->

      ${
        whatsappUrl

          ? `

            <a
              class="kropReasonsWhatsapp"
              href="${esc(
                whatsappUrl
              )}"
              target="_blank"
              rel="noopener"
              onclick="
                trackEvent(
                  'whatsapp_clicked',
                  {
                    campaign:
                      '${esc(
                        campaign.id
                      )}'
                  }
                )
              "
            >
              <span class="kropReasonsWhatsappIcon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.5 11.7A8.5 8.5 0 0 1 8 19.2L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z"/>
                  <path d="M8.5 7.5c.3-.7.7-.7 1-.7h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.6 1 1.5 1.8 2.5 2.4.3.2.5.2.7 0l.9-1c.2-.2.4-.3.7-.2l1.9.9"/>

                </svg>
              </span>

              <span>

                <strong>
                  Order NOW with 10% Discount
                </strong>

                <small>
                  on WhatsApp
                </small>

              </span>


              <span class="kropReasonsWhatsappArrow">
                →
              </span>
            </a>

          `
          : ''
      }


      <!-- TRUST -->

      <div class="kropReasonsTrust">

        <div>
          <span class="kropTrustSvg">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/>
            </svg>

          </span>

          <strong>
            Secure & direct ordering
          </strong>
        </div>

        <div>

          <span class="kropTrustSvg">

            <svg viewBox="0 0 24 24">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="18" cy="18" r="2"/>
            </svg>

          </span>

          <strong>
            PostNL registered shipping
          </strong>

          <span>
            NL
          </span>

        </div>



        <div>

          <span class="kropTrustSvg">

            <svg viewBox="0 0 24 24">
              <path d="m4 12 8-8h7l1 1v7l-8 8-8-8Z"/>
              <circle cx="16" cy="8" r="1"/>
            </svg>

          </span>

          <strong>
            Estimated shipping €12
          </strong>

          <span>
            NL
          </span>
        </div>
      </div>


      <!-- FOOTER -->

      <footer class="kropCompactFooter">

        <span>
          KROP CHEF KNIVES
        </span>
        <i></i>

        <span>
          MORE THAN A KNIFE
        </span>

      </footer>
    </section>
  </main>
`;


return;




  
  /*
   * =========================================================
   * REVEAL SCREEN
   * =========================================================
   */

  if(
    campaignState.reveal
  ){

    app.innerHTML = `

      <main
        class="
          campaignShell
          campaignRevealShell
        "
      >
        <section
          class="campaignReveal"
        >

          <div
            class="campaignRevealMark"
          >
            ✦
          </div>

          <h2>
            ${esc(
              campaignState.reveal.title
            )}
          </h2>

          <p>
            ${esc(
              campaignState.reveal.text
            )}
          </p>
        </section>
      </main>
    `;
    return;
  }


  /*
   * =========================================================
   * RESULT SCREEN
   * =========================================================
   */

  if(
    campaignState.finished
  ){

    const result =
      evaluateCampaign();

    const isIdeal =
      result === 'Ideal';

    const resultHeadline =

      isIdeal
        ? 'This knife looks very much like you.'
        : 'We have a feeling this knife would make you happy.';

    const campaignResultCopy =

      isIdeal
        ? 'You seem to appreciate more than just sharpness — craftsmanship, feel and character matter too.'
        : 'You may not be overly romantic about knives, but you know how good it feels to use something beautifully made.';

    const cleanNumber =
      String(
        campaign.whatsappNumber ||
        ''
      ).replace(
        /\D/g,
        ''
      );

    const whatsappUrl =

      cleanNumber
        ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
            campaign.whatsappMessage
          )}`
        : '';

    app.innerHTML = `

      <main
        class="
          campaignShell
          campaignResultShell
        "
      >
        <section
          class="campaignResultIntro"
        >
          <p
            class="campaignEyebrow"
          >
            YOUR RESULT
          </p>

          <h1>
            ${esc(
              result.toUpperCase()
            )}
          </h1>

          <h2>
            ${esc(
              resultHeadline
            )}
          </h2>

          <p
            class="campaignResultCopy"
          >
            ${esc(
              campaignResultCopy
            )}
          </p>

        </section>

 
<section
  class="campaignProductHero"
>

  <img
    src="${esc(
      campaign.resultImage
    )}"

    alt="${esc(
      campaign.productName
    )}"

  />

</section>

        <section
          class="campaignProductDetails"
        >

          <p
            class="campaignArtLine"
          >
            A chef’s knife — and a little piece of art.
          </p>


          <h2>
            ${esc(
              campaign.productName
            )}
          </h2>

          <div
            class="campaignSpecs"
          >

            ${
              campaign.specs
                .map(
                  spec => `
                    <span>
                      ${esc(
                        spec
                      )}
                    </span>
                  `
                )
                .join('')
            }

          </div>



          <div
            class="campaignPriceBlock"
          >

            <p>
              YOUR KNIFE
            </p>


            <strong>
              ${esc(
                campaign.price
              )}
            </strong>

          </div>


          <div
            class="campaignOffer"
          >
            <p
              class="campaignOfferLabel"
            >
              ${esc(
                campaign.discountText
              )}
            </p>


            <div
              class="campaignCoupon"
            >
              ${esc(
                campaign.couponCode
              )}
            </div>

          </div>


          ${
            whatsappUrl

              ? `

<a

  class="campaignWhatsapp"

  href="${esc(
    whatsappUrl
  )}"

  target="_blank"

  rel="noopener"

  onclick="
    trackEvent(
      'whatsapp_clicked',
      {
        campaign: '${esc(
          campaign.id
        )}',
        result: '${esc(
          result
        )}'
      }
    )
  "

>
  Order on WhatsApp →
</a>
              `

              : `

                <button
                  class="
                    campaignWhatsapp
                    campaignWhatsappDisabled
                  "
                  type="button"
                  disabled
                >
                  Order on WhatsApp →
                </button>

              `
          }


          <p
            class="campaignWhatsAppNote"
          >
            Mention your test code when ordering.
          </p>
        </section>
      </main>
    `;
    return;
  }



  /*
   * =========================================================
   * QUESTION SCREEN
   * =========================================================
   */

  const q =
    campaign.questions[
      campaignState.step
    ];


  const progress =
    Math.round(
      (
        campaignState.step /
        campaign.questions.length
      ) * 100
    );



  app.innerHTML = `

    <main
      class="campaignShell"
    >


      <div
        class="campaignTop"
      >


        <span
          class="campaignBrand"
        >
          ${esc(
            campaign.brand
          )}
        </span>


        <span
          class="campaignCounter"
        >
          ${
            campaignState.step + 1
          }
          /
          ${
            campaign.questions.length
          }
        </span>

      </div>


      <div
        class="campaignProgress"
      >

        <span
          style="
            width:${progress}%
          "
        ></span>

      </div>



      <section
        class="campaignQuestion"
      >

<div
  class="campaignQuestionImage"
>
  <img
    src="${esc(
      campaign.image
    )}"
    alt="${esc(
      campaign.productName
    )}"
  />
</div>        <h1>
          ${esc(
            q.text
          )}
        </h1>

        <div
          class="campaignAnswers"
        >

          ${
            q.answers.map(

              (answer,index) => {
                const selected =
                  campaignState.selectedIndex ===
                  index;
                const dimmed =

                  campaignState.transitioning &&
                  !selected;

                return `
                  <button

                    class="
                      campaignAnswer

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
                    "
                    data-campaign-answer="${index}"

                    ${
                      campaignState.transitioning
                        ? 'disabled'
                        : ''
                    }
                  >

                    <span
                      class="campaignLetter"
                    >

                      ${
                        String.fromCharCode(
                          65 + index
                        )
                      }

                    </span>


                    <span>
                      ${esc(
                        answer.label
                      )}
                    </span>

                  </button>
                `;
              }

            ).join('')
          }

        </div>

        <div
          class="campaignBottom"
        >

          <button

            class="campaignBack"

            id="campaignBack"

            ${
              campaignState.step === 0
                ? 'disabled'
                : ''
            }

          >
            Back
          </button>


          <span>
            Handmade · Damascus 
          </span>
        </div>
      </section>
    </main>

  `;


  /*
   * ANSWER EVENTS
   */

  document
    .querySelectorAll(
      '[data-campaign-answer]'
    )
    .forEach(

      button => {


        button.addEventListener(

          'click',

          () => {


            const index =
              Number(
                button.dataset
                  .campaignAnswer
              );


            answerCampaign(
              q.answers[index],
              index
            );
          }
        );
      }
    );


  /*
   * BACK EVENT
   */

  document
    .getElementById(
      'campaignBack'
    )
    ?.addEventListener(
      'click',
      backCampaignQuestion
    );
}



/*
 * =========================================================
 * NORMAL OWNER-EVIDENCE RESULT COPY
 * =========================================================
 */

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


  /*
   * =========================================================
   * KROP STATIC CAMPAIGN ROUTE
   * =========================================================
   */

  const campaign =
    getActiveCampaign();

  if(
    campaign
  ){
    renderCampaign(
      app,
      campaign
    );
    return;
  }


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
  (
    isSunglassesProduct ||
    isWatchProduct
  )
    ? productImageMarkup(
        vehicle,
        'resultProductImage'
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
  (
    isSunglassesProduct ||
    isWatchProduct
  )
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
