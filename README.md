# 📝 Form Builder Application

A full-stack form builder platform inspired by Google Forms, allowing users to **create, edit, preview, and share forms** with customizable question types like Categorize, Cloze, and Comprehension.  
Built with **React, DaisyUI, Node.js, Express, and MongoDB**.

---

## 🌐 Deployment

- **Live Demo:** [https://your-deployed-url.com](https://form-builder-h7f1.vercel.app/)  
- **Video Walkthrough:** [Google Drive Link](https://drive.google.com/drive/folders/1A3TJ_khBTSInDy_ii2cZTxxy-ZmEjc5A?usp=sharing)

---

## 🚀 Tech Stack

**Frontend**  
- React + TypeScript  
- Tailwind CSS + DaisyUI  
- Axios for API calls  
- Lucide-React for icons  

**Backend**  
- Node.js + Express.js  
- MongoDB + Mongoose  
- Cloudinary for image uploads  
- Multer for file handling  

---

## ⚙️ Features

- 🔹 **Form Creation** — Add multiple questions with different types.  
- 🔹 **Optional Images & Videos** — Add header, question images, or even embed videos.  
- 🔹 **Drag-and-Drop Ordering** — Reorder questions easily (react-beautiful-dnd).  
- 🔹 **Multiple Question Types** — Categorize, Cloze, Comprehension.  
- 🔹 **Live Preview** — See how the form looks before saving.  
- 🔹 **Responses Management** — View total responses and recent responses for each form.  
- 🔹 **Secure User Authentication** — Forms linked to logged-in users.  

---



## 🛠 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/form-builder.git
cd form-builder

```
2️⃣ Backend Setup
```bash
cd backend
npm install

```
Create a .env file in the backend folder:
```bash
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

```
Run the backend server:
```bash
npm run dev
```
2️⃣ Backend Setup
```

cd frontend
npm install
```
Run the frontend:
```bash
http://localhost:5173
```


