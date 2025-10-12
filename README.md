🍽️ Matabas — Your Personal Recipe Organizer

www.matabas.se

Save, search, and share your favorite recipes with powerful filtering, multi-image support, and downloadable PDFs.

🚀 Try It Out

Username: test@gmail.com

Password: Verysecurepassword123!

📝 About the Project

Matabas is a modern, serverless recipe management platform built for simplicity and personalization.

It allows users to:

🔖 Save and organize personal recipes

🏷️ Add multiple custom tags (even full sentences!)

🖼️ Upload multiple images per recipe

🔍 Filter recipes flexibly by tags or text

📄 Download recipes as pre-designed, print-ready PDFs

🧰 Tech Stack

Frontend: React + TailwindCSS

Backend: Golang (API)

Infrastructure: AWS Lambda + API Gateway

Storage: DynamoDB (for articles/comments), S3 (for images)

Authentication: Token-based (JWT stored in localStorage)

Security: Most API endpoints protected with an API key

🔐 Security Features

API Gateway handles routing with API key protection on most routes

Token-based authentication (JWT stored client-side)

Dynamically generated pre-signed S3 URLs for secure image uploads

📦 Features Overview
Feature	Description
🧾 Save Recipes	Users can store personal recipes with rich content
🏷️ Flexible Tagging	Tags can be full sentences or keywords
🔎 Smart Filtering	Recipes can be filtered using complex tag searches
🖼️ Multi-image Support	Upload several images per recipe
🖨️ PDF Downloads	Recipes can be downloaded as styled PDFs
🧠 Nested Comments	Support for threaded discussions (optional)
🔧 Future Improvements (Ideas)

User accounts with social login (Google, GitHub)

Public recipe sharing / links

Rating system or favorites

Responsive email template support for sharing recipes

Advanced tag suggestion (AI-assisted)