const {
  neon
} = require(
  '@neondatabase/serverless'
);


module.exports =
  async function handler(
    req,
    res
  ){

    /*
     * Only accept POST
     */

    if(
      req.method !== 'POST'
    ){
      return res
        .status(405)
        .json({
          error:
            'Method not allowed'
        });
    }


    try{

      const {
        campaignId,
        eventName,
        questionNumber = null,
        result = null,
        sessionId = null,
        referrer = null,
        utmSource = null,
        utmMedium = null,
        utmCampaign = null
      } = req.body || {};


      /*
       * Basic validation
       */

      if(
        !campaignId ||
        !eventName
      ){
        return res
          .status(400)
          .json({
            error:
              'Missing campaignId or eventName'
          });
      }


      /*
       * Only allow known events
       */

      const allowedEvents = [
        'campaign_started',
        'question_answered',
        'campaign_completed',
        'whatsapp_clicked'
      ];


      if(
        !allowedEvents.includes(
          eventName
        )
      ){
        return res
          .status(400)
          .json({
            error:
              'Invalid event'
          });
      }


      const sql =
        neon(
          process.env.DATABASE_URL
        );


      await sql`

        INSERT INTO campaign_events (
          campaign_id,
          event_name,
          question_number,
          result,
          session_id,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign
        )

        VALUES (
          ${campaignId},
          ${eventName},
          ${questionNumber},
          ${result},
          ${sessionId},
          ${referrer},
          ${utmSource},
          ${utmMedium},
          ${utmCampaign}
        )

      `;


      return res
        .status(200)
        .json({
          ok: true
        });

    }
    catch(error){

      console.error(
        'CAMPAIGN_EVENT_ERROR',
        error
      );


      return res
        .status(500)
        .json({
          error:
            'Could not record campaign event'
        });
    }
  };
