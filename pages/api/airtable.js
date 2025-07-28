import Airtable from 'airtable';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, ...data } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  console.log(`API: /airtable called for session ${sessionId}`);

  try {
    // Configure Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);
    
    const table = base(process.env.AIRTABLE_TABLE_ID);

    // Check if record with this sessionId already exists
    const existingRecords = await table.select({
      filterByFormula: `{SessionID} = '${sessionId}'`,
      maxRecords: 1
    }).firstPage();

    let result;

    // Format the data for Airtable
    const fields = {
      SessionID: sessionId,
      Timestamp: new Date().toISOString(),
      ...formatDataForAirtable(data)
    };

    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      console.log(`Updating existing Airtable record for session ${sessionId}`);
      result = await table.update(existingRecords[0].id, fields);
    } else {
      // Create new record
      console.log(`Creating new Airtable record for session ${sessionId}`);
      result = await table.create(fields);
    }

    console.log(`Airtable operation successful for session ${sessionId}`);
    res.status(200).json({ success: true, recordId: result.id });

  } catch (error) {
    console.error('Error with Airtable:', error);
    res.status(500).json({ error: 'Failed to log to Airtable', details: error.message });
  }
}

// Helper function to format data for Airtable fields
function formatDataForAirtable(data) {
  const formattedData = {};
  
  // Map the fields from our app to Airtable column names
  if (data.initialResponse) formattedData['InitialResponse'] = data.initialResponse;
  if (data.refinedResponse) formattedData['RefinedResponse'] = data.refinedResponse;
  if (data.selectedProfile) formattedData['SelectedProfile'] = data.selectedProfile;
  if (data.experienceRating) formattedData['ExperienceRating'] = parseInt(data.experienceRating);
  if (data.recommendRating) formattedData['RecommendRating'] = parseInt(data.recommendRating);
  if (data.email) formattedData['UserEmail'] = data.email;
  
  return formattedData;
}