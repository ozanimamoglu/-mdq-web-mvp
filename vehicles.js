const vehicles = [
  {
    id:'bmw-x3-g01-20d', make:'BMW', model:'X3', variant:'G01 · 2018–2021 · 20d',
    evidenceCount:8,
    evidenceUnit:'owner reviews & discussions',
    evidenceLastUpdated:'20 Aug 2026',
    evidenceSources:['Owner reviews','Owner forums','Reddit'],
    evidenceMethod:'Unique evidence documents reviewed for this exact product definition; individual comments inside the same thread are not counted separately.',
    questions:[
      {
        id:'usage_pattern',
        condition:'Short-trip diesel use',
        weight:'high',
        dealBreakerCapable:true,
        text:'How will you mostly use this car?',
        answers:[
          {label:'Mostly longer drives / motorway',impact:'positive',note:'This usage pattern suits the diesel powertrain well.'},
          {label:'A mix of short and long trips',impact:'neutral',note:'A balanced pattern is generally compatible.'},
          {label:'Mostly short city trips',impact:'critical_negative',note:'Frequent short trips can create meaningful diesel-system friction.'}
        ]
      },
      {
        id:'repair_cost',
        condition:'Premium repair-cost exposure',
        weight:'high',
        dealBreakerCapable:true,
        text:'How would you feel about an occasional expensive premium-car repair?',
        answers:[
          {label:'Acceptable if the car is otherwise right',impact:'positive',note:'You have a healthy tolerance for premium ownership costs.'},
          {label:'Okay occasionally, but not repeatedly',impact:'neutral',note:'This is workable, but recurring costs would matter.'},
          {label:'That would quickly put me off the car',impact:'high_negative',note:'Premium repair exposure may become a meaningful mismatch.'}
        ]
      },
      {
        id:'driving_character',
        condition:'Driving-character fit',
        weight:'high',
        dealBreakerCapable:false,
        text:'Which driving character sounds most like what you want?',
        answers:[
          {label:'Balanced, composed and still engaging',impact:'positive',note:'This is close to the X3’s core appeal.'},
          {label:'Comfort first, with some driver feel',impact:'neutral',note:'The X3 can still work well for this preference.'},
          {label:'Very soft, isolated and relaxed',impact:'medium_negative',note:'The X3 may feel firmer and more driver-focused than ideal.'}
        ]
      },
      {
        id:'electronics',
        condition:'Electronic / software friction',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How tolerant are you of occasional electronic or infotainment quirks?',
        answers:[
          {label:'Fine if they are minor and fixable',impact:'positive',note:'Minor electronic friction is unlikely to spoil ownership for you.'},
          {label:'I can tolerate some, but not repeated issues',impact:'neutral',note:'Repeated glitches could affect your satisfaction.'},
          {label:'I strongly dislike intermittent electronic problems',impact:'medium_negative',note:'This raises the ownership-friction risk for you.'}
        ]
      },
      {
        id:'roads',
        condition:'Ride and wheel suitability',
        weight:'medium',
        dealBreakerCapable:false,
        text:'What are the roads you will use most often like?',
        answers:[
          {label:'Mostly smooth roads and motorway',impact:'positive',note:'This reduces ride and wheel-related compromises.'},
          {label:'A typical mix of good and rough roads',impact:'neutral',note:'Wheel and tyre choice will matter.'},
          {label:'Frequently rough, broken or pothole-heavy',impact:'medium_negative',note:'Large wheels and firmer setups may become tiring.'}
        ]
      }
    ]
  },

  {
    id:'volvo-xc60-d4', make:'Volvo', model:'XC60', variant:'II · 2018–2021 · D4 AWD',
    evidenceCount:8,
    evidenceUnit:'owner reviews & discussions',
    evidenceLastUpdated:'20 Aug 2026',
    evidenceSources:['Owner reviews','Owner forums','Reddit'],
    evidenceMethod:'Unique evidence documents reviewed for this exact product definition; individual comments inside the same thread are not counted separately.',
    questions:[
      {
        id:'usage_pattern',
        condition:'Short-trip diesel use',
        weight:'high',
        dealBreakerCapable:true,
        text:'How will you mostly use this car?',
        answers:[
          {label:'Mostly longer drives / motorway',impact:'positive',note:'A strong fit for the D4’s diesel usage profile.'},
          {label:'A mix of short and long trips',impact:'neutral',note:'Generally compatible with the D4.'},
          {label:'Mostly short city trips',impact:'critical_negative',note:'Short-trip-heavy use can create diesel-system friction.'}
        ]
      },
      {
        id:'repair_cost',
        condition:'Premium repair-cost exposure',
        weight:'high',
        dealBreakerCapable:true,
        text:'How would you feel about an occasional expensive premium-car repair?',
        answers:[
          {label:'Acceptable if the car is otherwise right',impact:'positive',note:'You are well aligned with the cost profile of an aging premium SUV.'},
          {label:'Okay occasionally, but not repeatedly',impact:'neutral',note:'This can still work, but repeated bills would matter.'},
          {label:'That would quickly put me off the car',impact:'high_negative',note:'Repair-cost exposure may undermine ownership satisfaction.'}
        ]
      },
      {
        id:'electronics',
        condition:'Electronic / software friction',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How tolerant are you of occasional electronic or infotainment quirks?',
        answers:[
          {label:'Fine if they are minor and fixable',impact:'positive',note:'Minor glitches are unlikely to be decisive for you.'},
          {label:'I can tolerate some, but not repeated issues',impact:'neutral',note:'Repeated quirks could become irritating.'},
          {label:'I strongly dislike intermittent electronic problems',impact:'medium_negative',note:'This is a meaningful ownership-friction risk for you.'}
        ]
      },
      {
        id:'driving_character',
        condition:'Driving-character fit',
        weight:'high',
        dealBreakerCapable:false,
        text:'Which driving character sounds most like what you want?',
        answers:[
          {label:'Quiet, comfortable and relaxing',impact:'positive',note:'This matches one of the XC60’s strongest ownership traits.'},
          {label:'Comfortable, but still somewhat lively',impact:'neutral',note:'This is still a good match.'},
          {label:'Sharp, sporty and driver-focused',impact:'high_negative',note:'This is the clearest mismatch with the XC60’s core character.'}
        ]
      },
      {
        id:'roads',
        condition:'Ride and wheel suitability',
        weight:'medium',
        dealBreakerCapable:false,
        text:'What are the roads you will use most often like?',
        answers:[
          {label:'Mostly smooth roads and motorway',impact:'positive',note:'This suits the XC60 well.'},
          {label:'A typical mix of good and rough roads',impact:'neutral',note:'Wheel and suspension specification will matter.'},
          {label:'Frequently rough, broken or pothole-heavy',impact:'medium_negative',note:'Large-wheel versions can become less comfortable.'}
        ]
      }
    ]
  },

  {
    id:'mercedes-glc-220d', make:'Mercedes-Benz', model:'GLC', variant:'X253 facelift · 2019–2021 · 220d 4MATIC',
    evidenceCount:5,
    evidenceUnit:'owner reviews & discussions',
    evidenceLastUpdated:'20 Aug 2026',
    evidenceSources:['Owner forums','Reddit'],
    evidenceMethod:'Unique evidence documents reviewed for this exact product definition; individual comments inside the same thread are not counted separately.',
    questions:[
      {
        id:'usage_pattern',
        condition:'Short-trip diesel use',
        weight:'high',
        dealBreakerCapable:true,
        text:'How will you mostly use this car?',
        answers:[
          {label:'Mostly longer drives / motorway',impact:'positive',note:'A strong fit for the diesel drivetrain.'},
          {label:'A mix of short and long trips',impact:'neutral',note:'This is generally a compatible usage pattern.'},
          {label:'Mostly short city trips',impact:'critical_negative',note:'Short-trip use can increase diesel and emissions-system friction.'}
        ]
      },
      {
        id:'repair_cost',
        condition:'Premium repair-cost exposure',
        weight:'high',
        dealBreakerCapable:true,
        text:'How would you feel about an occasional expensive premium-car repair?',
        answers:[
          {label:'Acceptable if the car is otherwise right',impact:'positive',note:'Your cost tolerance fits premium SUV ownership.'},
          {label:'Okay occasionally, but not repeatedly',impact:'neutral',note:'This remains workable if issues are not recurrent.'},
          {label:'That would quickly put me off the car',impact:'high_negative',note:'Repair exposure may become a meaningful mismatch.'}
        ]
      },
      {
        id:'gearbox',
        condition:'Low-speed gearbox behaviour',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How important is perfectly smooth low-speed gearbox behaviour to you?',
        answers:[
          {label:'Not very important if the car is good overall',impact:'positive',note:'You are unlikely to be bothered by minor low-speed hesitation.'},
          {label:'Somewhat important',impact:'neutral',note:'Repeated roughness could become annoying.'},
          {label:'Very important; I want it smooth all the time',impact:'medium_negative',note:'Low-speed transmission behaviour may bother you.'}
        ]
      },
      {
        id:'emissions',
        condition:'Diesel emissions-system tolerance',
        weight:'high',
        dealBreakerCapable:true,
        text:'How tolerant are you of an occasional AdBlue / NOx-sensor service issue?',
        answers:[
          {label:'Acceptable if it is fixable',impact:'positive',note:'This risk is unlikely to change your decision.'},
          {label:'Acceptable once, but not repeatedly',impact:'neutral',note:'Repeated emissions-system issues would matter.'},
          {label:'This would seriously reduce my trust in the car',impact:'high_negative',note:'This is a notable mismatch with diesel-system ownership risk.'}
        ]
      },
      {
        id:'driving_character',
        condition:'Driving-character fit',
        weight:'high',
        dealBreakerCapable:false,
        text:'Which driving character sounds most like what you want?',
        answers:[
          {label:'Quiet, soft and relaxing',impact:'positive',note:'This aligns closely with the GLC’s core appeal.'},
          {label:'Comfortable, but still somewhat responsive',impact:'positive',note:'This is a strong fit for the GLC.'},
          {label:'Very sharp and highly driver-focused',impact:'medium_negative',note:'The GLC may feel less engaging than you want.'}
        ]
      },
      {
        id:'electronics',
        condition:'Electronic / software friction',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How tolerant are you of occasional electronic or sensor warnings?',
        answers:[
          {label:'Fine if they are minor and fixable',impact:'positive',note:'Minor electronic friction is unlikely to spoil ownership.'},
          {label:'I can tolerate some, but not repeated issues',impact:'neutral',note:'Repeated warnings could become frustrating.'},
          {label:'I strongly dislike intermittent electronic problems',impact:'medium_negative',note:'This increases your ownership-friction risk.'}
        ]
      }
    ]
  },

  {
    id:'porsche-911-sc-1980', make:'Porsche', model:'911 SC', variant:'1980 · 3.0 air-cooled · 915 manual',
    evidenceCount:9,
    evidenceUnit:'owner reviews & discussions',
    evidenceLastUpdated:'20 Aug 2026',
    evidenceSources:['Porsche owner forums','Long-term owner discussions'],
    evidenceMethod:'Unique evidence documents reviewed for this exact product definition; individual comments inside the same thread are not counted separately.',
    questions:[
      {
        id:'imperfections',
        condition:'Classic-car imperfection tolerance',
        weight:'high',
        dealBreakerCapable:true,
        text:'How do you feel about the sounds, smells and small imperfections of an old car?',
        answers:[
          {label:'They are part of the experience',impact:'positive',note:'Your mindset matches classic 911 ownership very well.'},
          {label:'Some are fine, but I still want predictability',impact:'neutral',note:'You may enjoy the character but dislike recurring friction.'},
          {label:'I expect modern-car refinement and predictability',impact:'critical_negative',note:'This is a fundamental mismatch with a 1980 911.'}
        ]
      },
      {
        id:'mechanical_attention',
        condition:'Mechanical-attention tolerance',
        weight:'high',
        dealBreakerCapable:true,
        text:'How do you feel about regular mechanical attention and age-related repairs?',
        answers:[
          {label:'I see it as part of ownership',impact:'positive',note:'This is a strong fit for classic-car ownership.'},
          {label:'Some is fine, but I do not want constant jobs',impact:'neutral',note:'You may enjoy the car if you buy an exceptionally well-sorted example.'},
          {label:'I want modern levels of low-maintenance ownership',impact:'critical_negative',note:'This is a major mismatch.'}
        ]
      },
      {
        id:'gearbox_character',
        condition:'915 gearbox character',
        weight:'high',
        dealBreakerCapable:false,
        text:'How do you feel about a manual gearbox that rewards patience and technique?',
        answers:[
          {label:'That sounds enjoyable to me',impact:'positive',note:'The 915 gearbox character is likely to add to the experience.'},
          {label:'I can adapt, but I still want it fairly easy',impact:'neutral',note:'You may adapt, but the gearbox could sometimes frustrate you.'},
          {label:'I want quick, light, modern shifts',impact:'high_negative',note:'The 915 gearbox is likely to feel like a compromise.'}
        ]
      },
      {
        id:'physical_effort',
        condition:'Physical driving effort',
        weight:'high',
        dealBreakerCapable:false,
        text:'How do you feel about heavier steering, more physical controls and old-school braking feel?',
        answers:[
          {label:'That physicality is part of the appeal',impact:'positive',note:'This aligns strongly with the car’s analogue character.'},
          {label:'Some is fine, but I do not want it tiring',impact:'neutral',note:'The car may work, but daily usability could become a concern.'},
          {label:'I want light, easy and modern controls',impact:'high_negative',note:'This is a real mismatch with the 911 SC experience.'}
        ]
      },
      {
        id:'cabin_comfort',
        condition:'Cabin comfort expectations',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How important are strong A/C, quietness and modern cabin comfort?',
        answers:[
          {label:'Not very important',impact:'positive',note:'The old-school cabin is unlikely to bother you.'},
          {label:'Somewhat important',impact:'neutral',note:'Longer drives may expose some compromises.'},
          {label:'Very important',impact:'medium_negative',note:'Classic 911 cabin comfort may disappoint you.'}
        ]
      },
      {
        id:'old_school_dynamics',
        condition:'Old-school dynamic behaviour',
        weight:'medium',
        dealBreakerCapable:false,
        text:'How do you feel about a sports car that asks for more judgement near the limit?',
        answers:[
          {label:'I am comfortable adapting my driving',impact:'positive',note:'You are aligned with the car’s old-school dynamics.'},
          {label:'I accept some character, but want predictability',impact:'neutral',note:'This can work if you respect the car’s limits.'},
          {label:'I want modern electronic safety margins',impact:'medium_negative',note:'The lack of modern driver aids may reduce your confidence.'}
        ]
      }
    ]
  }
];

function evaluateResult(vehicle, answers){
  const mapped = answers.map((answer, i) => {
    const q = vehicle.questions[i];

function evaluateResult(vehicle, answers){
  const mapped = answers.map((answer, i) => {
    const q = vehicle.questions[i];

    return {
      ...answer,
      condition: q.condition,
      evidenceStrength: q.evidenceStrength || '',
      evidenceReason: q.evidenceReason || '',
      dealBreakerCapable: q.dealBreakerCapable,
      question: q.text,
      clarification: q.clarification || '',
      impactReason: answer.impactReason || answer.note || '',
      mitigation: answer.mitigation || ''
    };
  });

  const criticals = mapped.filter(x => x.impact === 'critical_negative');
  const highNegatives = mapped.filter(x => x.impact === 'high_negative');
  const mediumNegatives = mapped.filter(x => x.impact === 'medium_negative');
  const positives = mapped.filter(x => x.impact === 'positive');

  if (criticals.some(x => x.dealBreakerCapable)) {
    return { result:'Not suitable', mapped };
  }

  if (highNegatives.length >= 2) {
    return { result:'Not suitable', mapped };
  }

  if (highNegatives.length >= 1 && mediumNegatives.length >= 2) {
    return { result:'Not suitable', mapped };
  }

  if (
    criticals.length === 0 &&
    highNegatives.length === 0 &&
    mediumNegatives.length <= 1
  ) {
    if (positives.length >= Math.ceil(vehicle.questions.length / 2)) {
      return { result:'Ideal', mapped };
    }
  }

  return { result:'Suitable', mapped };
}
