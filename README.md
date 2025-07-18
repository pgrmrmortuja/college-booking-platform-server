# 🎓 College Booking & Review API

A RESTful API built with **Express.js** and **MongoDB** for managing college details, user admissions, and reviews.

## 🚀 Features

✅ User Management (Register, Get, Update)  
✅ College List, Search, and Details  
✅ Admission Form Submission & User Profile Update  
✅ Reviews with Dynamic Average Rating Calculation  
✅ Search colleges by name (case-insensitive)  
✅ CORS & JSON Middleware enabled  

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB Atlas  
- **Environment Variables:** dotenv  
- **Middleware:** cors  

---


---

## 🔗 API Endpoints

### 👤 User APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/users/:email` | Get user details by email |
| **POST** | `/users` | Register a new user (avoids duplicates) |
| **PATCH** | `/users/:id` | Update user fields (college, dob, phone, etc.) |

---

### 🎓 College APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/colleges` | Get all colleges |
| **GET** | `/search-colleges?search=abc` | Search colleges by name |
| **GET** | `/college/:id` | Get single college details |

---

### 📝 Admission APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/my-college/:email` | Get all admissions of a user |
| **POST** | `/admission` | Submit admission form + update user profile |

---

### ⭐ Review APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/reviews` | Get all reviews |
| **POST** | `/review` | Submit review & auto-update college rating |

---

## ⚙️ Environment Variables

Create a `.env` file with the following keys:

```env
PORT=5000
DB_USER=yourMongoUser
DB_PASS=yourMongoPassword
