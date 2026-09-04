/*
 * =========================================================
 * STATIC CAMPAIGNS
 * =========================================================
 *
 * No AI
 * No API
 * No evidence research
 * No database
 */

const kropCampaigns = {

  krop: {

    id: 'krop',
    brand: 'KROP Chef knives',
    productName: 'Handmade Damascus Chef’s Knife',

    // Question screen image
    image: '/pirgedamascus-17.jpeg',

    // Final result screen image
    resultImage: '/Krop-last-page.jpg',

    price: '€287.99',
    couponCode: '10% DISCOUNT',

    /*
     * We will replace these later.
     */
    discountText: 'Special test offer',

    /*
     * WhatsApp number:
     * country code + number, digits only
     */
    whatsappNumber: '31621164080',

    whatsappMessage:
      'Hi, I just took the Damascus Chef’s Knife test. I’d like to order using code 10.',


    specs: [
      'Handmade',
      '135-layer Damascus steel',
      '1,500-year-old fossilized oak'
      
    ],


    /*
     * Q1-Q4 determine the result.
     * Q5-Q6 are engagement / product-value questions only.
     */

    questions: [

      {
        id: 'q1',

        text:
          'Have you ever held a handmade chef’s chopper crafted from 135-layer Damascus steel?',

        answers: [
          {
            label:
              'No. Wow, that sounds tempting.',
            score: 2
          },

          {
            label:
              'No. This would be my first. 😏',
            score: 2
          },

          {
            label:
              'Yes. But now I’m curious about this one.',
            score: 2
          }
        ]
      },


      {
        id: 'q2',
        text:
          'A chef uses a great knife almost like an extension of their hand. Is that true for you too?',

        answers: [
          {
            label:
              'Absolutely.',
            score: 2
          },

          {
            label:
              'Well… not quite.',
            score: 0
          },
          {
            label:
              'Knives and kitchens are my thing.',
            score: 2
          }
        ]
      },


      {
        id: 'q3',
        text:
          'The handle of this knife is made from approximately 1,500-year-old fossilized oak. What would you feel holding it?',
        answers: [
          {
            label:
              'A little mesmerized.',
            score: 2
          },

          {
            label:
              '1,500 years? I need to touch it.',
            score: 2
          },

          {
            label:
              'Nice. But it still has to perform.',
            score: 0
          }
        ]
      },

      {
        id: 'q4',

        text:
          'Research suggests that a quality chef’s knife can make cooking more enjoyable. Think they’re right?',

        answers: [
          {
            label:
              'Absolutely.',
            score: 2
          },
          {
            label:
              'It might even get me cooking. 😄',
            score: 1
          },
          {
            label:
              'Let me try it first.',
            score: 0
          }
        ]
      },


      {
        id: 'q5',

        text:
          'What do you think is the most common complaint about handmade knives?',

        answers: [

          {
            label:
              'They’re too sharp. 😏'
          },

          {
            label:
              'They’re too beautiful to use.'
          },

          {
            label:
              'They need some attention.'
          }
        ],

        reveal: {
          title:
            'They do like a little attention.',
          text:
            'Good things usually do. 😉'
        }
      },

      {
        id: 'q6',

        text:
          'How long do you think a well-cared-for Damascus steel knife can last?',

        answers: [

          {
            label:
              '10–20 years'
          },

          {
            label:
              'Long enough for the kids'
          },

          {
            label:
              'Long enough for the grandkids'
          }
        ],

        reveal: {
          title:
            'With proper care, potentially decades.',
          text:
            'So yes… the grandkids may be involved. 😏'
        }
      }
    ]
  }

};
