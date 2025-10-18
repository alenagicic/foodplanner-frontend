🍽️ Foodplanner — Your Personal Recipe Organizer

Save, search, and share your favorite recipes with powerful filtering, multi-image support, and downloadable PDFs.

📝 About the Project

    Foodplanner is a modern, serverless recipe management platform built for simplicity and personalization.

    Frontend: React

    Backend: Golang (API)

    Infrastructure: AWS Lambda + API Gateway

    Storage: DynamoDB (for articles/comments), S3 (for images)

🔐 Security Features

    API Gateway handles routing with API key protection on routes

    Token-based authentication (JWT stored client-side)

    Dynamically generated pre-signed S3 URLs for secure image uploads

📦 Features Overview

    🧾 Save Recipes	Users can store personal recipes with rich content

    🏷️ Flexible Tagging, Tags can be full sentences or keywords

    🔎 Smart Filtering Recipes can be filtered using complex tag searches

    🖼️ Multi-image Support	Upload several images per recipe

    🖨️ PDF Downloads	Recipes can be downloaded as styled PDFs


🔧 Future Improvements (Ideas)

User accounts with social login (Google, GitHub)

Public recipe sharing / links

Rating system or favorites

Responsive email template support for sharing recipes

Advanced tag suggestion (AI-assisted)