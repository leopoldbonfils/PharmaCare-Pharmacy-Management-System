# PharmaCare Frontend

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory with:
```
VITE_API_URL=https://localhost:7001/api
VITE_APP_NAME=PharmaCare
```

### 3. Start Development Server
```bash
npm start
```

The app will run on: **http://localhost:3000**

### 4. Make Sure Backend is Running
The backend should be running on: **https://localhost:7001**

Start it in Visual Studio by pressing **F5**

---

## 📝 Important Notes

- **Frontend runs on:** http://localhost:3000
- **Backend runs on:** https://localhost:7001
- **API calls are automatically proxied** from `/api/*` to the backend

---

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

---

## 🐛 Troubleshooting

If you see errors:
1. Check browser console (F12)
2. Make sure backend is running
3. Check that `.env` file exists
4. Clear browser cache (Ctrl+Shift+R)

