# MyGPT

A full-stack AI chatbot built with the MERN stack, JWT authentication, and the Gemini API — a ChatGPT-style experience you can self-host.

**[Live Demo →](https://my-jn6y05tol-my-gpt3.vercel.app/)**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=flat&logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Overview

MyGPT is a ChatGPT-style conversational AI application built from scratch using the MERN stack (MongoDB, Express, React, Node.js). It features secure JWT-based authentication and streams responses from Google's Gemini API, giving users a fast, familiar chat interface backed by their own infrastructure.

## Features

- 💬 Real-time conversational chat interface powered by the Gemini API
- 🔐 Secure user authentication and session handling with JWT
- 🗂️ Persistent chat history stored in MongoDB
- ⚛️ Responsive, modern UI built with React
- 🌐 RESTful API backend built with Node.js and Express

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Database | MongoDB |
| Authentication | JWT (JSON Web Tokens) |
| AI Model | Google Gemini API |
| Deployment | Vercel |

## Project Structure

```
MyGPT/
├── backend/         # Express API, auth, and Gemini integration
├── frontend/         # React client application
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Gemini API key](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arpanmallick23/MyGPT.git
   cd MyGPT
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Run the backend**
   ```bash
   cd backend
   npm start
   ```

6. **Run the frontend**
   ```bash
   cd frontend
   npm start
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign up or log in to create an authenticated session.
2. Start a new chat and type your message.
3. Gemini generates a response, and the conversation is saved to your history.
4. Revisit past conversations anytime from your chat sidebar.

## Roadmap

- [ ] Streaming token-by-token responses
- [ ] Conversation search
- [ ] Dark mode
- [ ] Multi-model support

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Author

**Arpan Mallick**
[GitHub](https://github.com/arpanmallick23)
