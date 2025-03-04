import express from 'express';
import libxml from 'libxmljs';

const app = express();
const PORT = 3001;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.post('/validate', (req, res) => {
  try {
    const { xmlContent, xsdContent } = req.body;
    
    if (!xmlContent || !xsdContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both XML and XSD content are required' 
      });
    }

    console.log('Received validation request');
    console.log('XML length:', xmlContent.length);
    console.log('XSD length:', xsdContent.length);

    // Parse XML and XSD
    let xmlDoc, xsdDoc;
    
    try {
      xmlDoc = libxml.parseXml(xmlContent);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XML format',
        error: error.message
      });
    }
    
    try {
      xsdDoc = libxml.parseXml(xsdContent);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XSD format',
        error: error.message
      });
    }

    // Validate XML against XSD
    try {
      const isValid = xmlDoc.validate(xsdDoc);

      if (isValid) {
        return res.json({ 
          success: true, 
          message: 'XML is valid against XSD.' 
        });
      } else {
        const validationErrors = xmlDoc.validationErrors;
        const errorMessages = validationErrors.map(error => error.message);
        
        return res.json({ 
          success: false, 
          message: 'XML validation failed', 
          errors: errorMessages 
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error during validation process',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during validation', 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});