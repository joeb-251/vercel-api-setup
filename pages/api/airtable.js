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
    // Check for required environment variables
    const requiredEnvVars = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        return res.status(500).json({ error: `Server configuration error: ${envVar} not set` });
      }
    }

    // Configure Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);
    
    const table = base(process.env.AIRTABLE_TABLE_ID);

    // Sanitize sessionId to prevent injection attacks in filterByFormula
    const sanitizedSessionId = sessionId.replace(/'/g, "\\'");

    // Check if record with this sessionId already exists
    console.log(`Checking for existing records with SessionID: ${sanitizedSessionId}`);
    const existingRecords = await table.select({
      filterByFormula: `{SessionID} = '${sanitizedSessionId}'`,
      maxRecords: 1
    }).firstPage();

    // Format the data for Airtable
    const fields = {
      SessionID: sessionId,
      Timestamp: new Date().toISOString(),
      ...formatDataForAirtable(data)
    };

    let result;

    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      console.log(`Updating existing Airtable record (ID: ${existingRecords[0].id}) for session ${sessionId}`);
      result = await table.update(existingRecords[0].id, fields);
    } else {
      // Create new record
      console.log(`Creating new Airtable record for session ${sessionId}`);
      result = await table.create(fields);
    }

    console.log(`Airtable operation successful for session ${sessionId}, record ID: ${result.id}`);
    res.status(200).json({ 
      success: true, 
      recordId: result.id,
      operation: existingRecords && existingRecords.length > 0 ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Error with Airtable:', error);
    
    // Provide more specific error messages based on common Airtable errors
    let errorMessage = 'Failed to log to Airtable';
    if (error.message.includes('Invalid API key')) {
      errorMessage = 'Invalid Airtable API key';
    } else if (error.message.includes('Application not found')) {
      errorMessage = 'Airtable base not found';
    } else if (error.message.includes('Table not found')) {
      errorMessage = 'Airtable table not found';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: error.message,
      config: {
        baseId: process.env.AIRTABLE_BASE_ID ? `${process.env.AIRTABLE_BASE_ID.substring(0, 5)}...` : 'Not set',
        tableId: process.env.AIRTABLE_TABLE_ID ? `✓ Set` : '✗ Missing',
        apiKey: process.env.AIRTABLE_API_KEY ? '✓ Set' : '✗ Missing'
      }
    });
  }
}

// Helper function to format data for Airtable fields
function formatDataForAirtable(data) {
  const formattedData = {};
  
  // Map the fields from our app to Airtable column names
  if (data.initialResponse) {
    // Truncate long text if necessary (Airtable has limits)
    formattedData['InitialResponse'] = truncateIfNeeded(data.initialResponse, 100000);
  }
  
  if (data.refinedResponse) {
    formattedData['RefinedResponse'] = truncateIfNeeded(data.refinedResponse, 100000);
  }
  
  if (data.selectedProfile) formattedData['SelectedProfile'] = data.selectedProfile;
  
  // Ensure ratings are properly formatted as numbers
  if (data.experienceRating !== undefined) {
    const rating = parseInt(data.experienceRating);
    if (!isNaN(rating)) formattedData['ExperienceRating'] = rating;
  }
  
  if (data.recommendRating !== undefined) {
    const rating = parseInt(data.recommendRating);
    if (!isNaN(rating)) formattedData['RecommendRating'] = rating;
  }
  
  if (data.email) formattedData['UserEmail'] = data.email;
  
  return formattedData;
}

// Helper function to truncate text if it exceeds maximum length
function truncateIfNeeded(text, maxLength) {
  if (text && text.length > maxLength) {
    console.warn(`Truncating text from ${text.length} to ${maxLength} characters`);
    return text.substring(0, maxLength) + '... [truncated]';
  }
  return text;
}