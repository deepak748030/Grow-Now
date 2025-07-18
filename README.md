
# Grow Now 

This project is a full-stack eccomerce platform for users and vendors. It includes a customer-facing web dashboard, a vendor portal, and a Node.js backend API for order, vendor, and product management.

## 🔥 Project Repositories

- **Fal-Bites Dashboard** (Frontend): `Fal-Bites-dashboard`
- **Grow Now Vendor Panel**: `grow-now-vender`
- **Backend Server**: `server`

---

## 📦 Tech Stack

### 🌐 Frontend (Fal-Bites Dashboard)

- React.js
- React Router DOM
- Axios
- Bootstrap / Tailwind (if applicable)
- JWT-based authentication

### 🧑‍🍳 Vendor Panel (Grow-Now-Vender)

- React.js with vendor-specific UI
- Order status updates and management
- Real-time updates (optional with Socket.IO)

### 🔗 Backend (Server)

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT Auth (User & Admin)
- REST APIs for:
  - Tiffin / Thali products
  - Orders
  - Vendors
  - Users
  - Pincodes
- Role-based access (admin / user / vendor)
- Image Upload (optional)

---

## ⚙️ Installation & Setup

1. **Clone the repositories**
   ```bash
   git clone https://github.com/yourusername/Fal-Bites-dashboard
   git clone https://github.com/yourusername/grow-now-vender
   git clone https://github.com/yourusername/server
````

2. **Install dependencies**

   In all three folders:

   ```bash
   cd <folder-name>
   npm install
   ```

3. **Setup environment variables**

   Create `.env` in `server` folder:

   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the apps**

   * **Frontend (Fal-Bites-dashboard)**

     ```bash
     npm start
     ```

   * **Vendor Panel**

     ```bash
     npm start
     ```

   * **Backend**

     ```bash
     npm run dev
     ```

---

## 🧪 Features

### ✅ User Side (Fal-Bites)

* View daily tiffin & thali menu
* Place order by selecting tiffin/thali
* Checkout with address & delivery time
* Order history
* Profile management

### ✅ Vendor Panel

* See all assigned orders
* Change order status (Pending → Cooking → Out for delivery → Delivered)
* Dashboard overview (earnings, today’s orders)

### ✅ Admin Capabilities

* Add/Edit/Delete Tiffins or Thalis
* Manage vendors
* See user & vendor orders
* Assign tiffins to vendors
* View analytics

---

## 📂 Folder Structure

```
📁 Fal-Bites-dashboard/
📁 grow-now-vender/
📁 server/
```

---

## 📌 API Endpoints Overview

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| GET    | /api/orders/\:userId   | Fetch user orders       |
| POST   | /api/order             | Place new order         |
| GET    | /api/tiffins           | List tiffin/thali items |
| POST   | /api/vendor/assign     | Assign vendor           |
| PATCH  | /api/order/\:id/status | Change order status     |

(Full API documentation coming soon…)

---

## 🧑‍💻 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Contact

For support or business queries, reach out at **[growhelp@support.com](mailto:growhelp@support.com)** or raise an issue on GitHub.

---

## 🚀 Author

Developed by **Deepak Kushwah**
MERN Stack Developer
India 🇮🇳


