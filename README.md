# Vercel API Setup Demo

A Next.js application demonstrating integration with Anthropic Claude AI, SMTP email services, and Airtable database - all deployed on Vercel with serverless API routes.

## 🚀 Live Demo

Generate personalized 90-day objectives for tech managers with AI-powered insights and automated email reports.

## ✨ Features

- **AI-Powered Content Generation**: Uses Anthropic Claude to generate and refine 90-day objectives
- **Multi-Step User Flow**: Progressive experience from generation to personalization to feedback
- **Email Automation**: Send personalized reports with markdown-to-HTML conversion
- **Data Persistence**: Log user sessions and feedback to Airtable
- **Responsive Design**: Mobile-friendly interface with interactive rating scales
- **Serverless Architecture**: Edge functions for optimal performance

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with React 18
- **AI Integration**: [Anthropic Claude API](https://www.anthropic.com/api)
- **Email Service**: [Nodemailer](https://nodemailer.com/) with SMTP
- **Database**: [Airtable](https://airtable.com/) for data logging
- **Deployment**: [Vercel](https://vercel.com/) with edge functions
- **Styling**: CSS Modules with responsive design

## 📁 Project Structure

```
vercel-api-setup/
├── pages/
│   ├── index.js                 # Main application page
│   └── api/
│       ├── claude.js           # Anthropic API integration
│       ├── email.js            # Email service endpoint
│       └── airtable.js         # Database logging
├── styles/
│   └── Home.module.css         # Component styling
├── package.json                # Dependencies and scripts
├── vercel.json                 # Deployment configuration
├── .env.local                  # Environment variables (template)
└── README.md                   # This file
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joeb-251/vercel-api-setup.git
   cd vercel-api-setup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.local` and update with your actual credentials:
   ```bash
   cp .env.local .env.local.example
   ```

   Required environment variables:
   ```env
   # Anthropic API Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # SMTP Email Configuration
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email_username
   SMTP_PASSWORD=your_email_password
   SMTP_FROM_EMAIL=noreply@yourdomain.com

   # Airtable Configuration
   AIRTABLE_API_KEY=your_airtable_api_key_here
   AIRTABLE_BASE_ID=your_base_id_here
   AIRTABLE_TABLE_ID=your_table_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Keys Setup

### Anthropic Claude API
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Add to `ANTHROPIC_API_KEY` environment variable

### SMTP Email Service
Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.):
- **Gmail**: Use app-specific password with 2FA enabled
- **SendGrid**: Use API key as password
- **Custom SMTP**: Use your hosting provider's SMTP settings

### Airtable Database
1. Create an [Airtable](https://airtable.com/) account
2. Create a new base with these fields:
   - `SessionID` (Single line text)
   - `Timestamp` (Date & time)
   - `InitialResponse` (Long text)
   - `RefinedResponse` (Long text)
   - `SelectedProfile` (Single line text)
   - `ExperienceRating` (Number)
   - `RecommendRating` (Number)
   - `UserEmail` (Email)
3. Get your API key from Account settings
4. Copy Base ID and Table ID from the API documentation

## 🚢 Deployment on Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/joeb-251/vercel-api-setup)

### Manual Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add all environment variables from `.env.local`
   - Set for Production, Preview, and Development environments

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api03-...` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use SSL/TLS | `false` |
| `SMTP_USER` | SMTP username | `your@email.com` |
| `SMTP_PASSWORD` | SMTP password | `your_app_password` |
| `SMTP_FROM_EMAIL` | From email address | `noreply@yourdomain.com` |
| `AIRTABLE_API_KEY` | Airtable API key | `keyXXXXXXXXXXXXXX` |
| `AIRTABLE_BASE_ID` | Airtable base ID | `appXXXXXXXXXXXXXX` |
| `AIRTABLE_TABLE_ID` | Airtable table name | `Table 1` |

## 🎯 Usage

### User Flow
1. **Generate Objectives**: Click "Generate Objectives" to get AI-powered 90-day goals
2. **Select Profile**: Choose your role (Startup Tech Lead, Enterprise Manager, Product Manager)
3. **Refine Objectives**: Get personalized objectives based on your selected profile
4. **Rate Experience**: Provide feedback on satisfaction and recommendation likelihood
5. **Receive Report**: Enter email to receive a personalized objectives report

### API Endpoints

#### `/api/claude`
- **Method**: POST
- **Purpose**: Generate and refine objectives using Anthropic Claude
- **Payload**: `{ prompt, sessionId, context? }`
- **Response**: `{ response, model, sessionId }`

#### `/api/email`
- **Method**: POST
- **Purpose**: Send personalized email reports
- **Payload**: `{ email, sessionId, initialResponse, refinedResponse, selectedProfile, experienceRating, recommendRating }`
- **Response**: `{ success, messageId }`

#### `/api/airtable`
- **Method**: POST
- **Purpose**: Log user data and feedback
- **Payload**: `{ sessionId, ...data }`
- **Response**: `{ success, recordId }`

## 🎨 Customization

### Styling
- Modify `styles/Home.module.css` for visual customization
- Responsive design with mobile-first approach
- CSS variables for easy theme customization

### AI Prompts
- Update system prompts in `/api/claude.js`
- Modify objective generation logic
- Add new profile types in `pages/index.js`

### Email Templates
- Customize email content in `/api/email.js`
- Modify markdown-to-HTML conversion
- Add custom email styling

## 🔍 Monitoring and Debugging

### Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Enable "Function Logs" for debugging
3. View real-time logs for API calls

### Error Handling
- All API routes include comprehensive error handling
- Client-side error boundaries for user experience
- Graceful fallbacks for service failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/joeb-251/vercel-api-setup/issues)
- **Documentation**: Check `/docs/eng/` folder for detailed guides
- **Examples**: See implementation examples in the codebase

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI API
- [Vercel](https://vercel.com/) for seamless deployment
- [Next.js](https://nextjs.org/) for the amazing framework
- [Airtable](https://airtable.com/) for easy database management

---

**Built with ❤️ using Next.js, Anthropic Claude, and Vercel**