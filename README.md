# Email Reminder Application

A web application that allows users to schedule email reminders for important tasks and communications.

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB database (local or MongoDB Atlas)
- Gmail account with App Password

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

## Manual Deployment Instructions

### 1. Prepare Your Application

1. Make sure all your code is committed to a Git repository
2. Ensure your `.env` file is properly configured
3. Test the application locally before deployment

### 2. Choose a Hosting Platform

You can deploy this application on various platforms:

#### Option A: Heroku
1. Create a Heroku account
2. Install Heroku CLI
3. Run these commands:
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set EMAIL_USER=your_gmail
heroku config:set EMAIL_PASS=your_app_password
```

#### Option B: DigitalOcean
1. Create a DigitalOcean account
2. Create a new Droplet (Ubuntu recommended)
3. Connect via SSH
4. Install Node.js and MongoDB:
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y mongodb
```
5. Clone your repository:
```bash
git clone your-repository-url
cd your-app-directory
```
6. Install dependencies:
```bash
npm install
```
7. Set up environment variables:
```bash
nano .env
# Add your environment variables
```
8. Install PM2 for process management:
```bash
sudo npm install -g pm2
pm2 start app.js
pm2 startup
```

#### Option C: AWS EC2
1. Create an AWS account
2. Launch an EC2 instance (Ubuntu recommended)
3. Connect via SSH
4. Install Node.js and MongoDB:
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y mongodb
```
5. Clone and set up your application similar to DigitalOcean instructions

### 3. Set Up MongoDB

#### Local MongoDB
1. Install MongoDB on your server
2. Start MongoDB service:
```bash
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add your server's IP to the IP whitelist

### 4. Set Up Email

1. Use a Gmail account
2. Enable 2-factor authentication
3. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other"
   - Name it "Email Reminder App"
   - Copy the generated password

### 5. Domain and SSL (Optional)

1. Purchase a domain name
2. Point it to your server's IP
3. Set up SSL using Let's Encrypt:
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### 6. Maintenance

1. Monitor your application:
```bash
pm2 monit
```

2. View logs:
```bash
pm2 logs
```

3. Restart application:
```bash
pm2 restart app
```

## Security Considerations

1. Always use environment variables for sensitive data
2. Keep your Node.js and dependencies updated
3. Use HTTPS in production
4. Regularly backup your MongoDB database
5. Monitor your application logs for any issues

## Troubleshooting

1. Check application logs:
```bash
pm2 logs
```

2. Check MongoDB status:
```bash
sudo systemctl status mongodb
```

3. Check Node.js version:
```bash
node -v
```

4. Verify environment variables:
```bash
echo $MONGODB_URI
echo $EMAIL_USER
```

For any issues, check the logs and ensure all environment variables are properly set. 