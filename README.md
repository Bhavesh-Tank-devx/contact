# Next.js Contact Management System

## Description/Overview

The **Next.js Contact Management System** is a comprehensive web application designed to help users efficiently organize and manage their personal and professional contacts. Built with modern web technologies, it offers a secure and intuitive environment for storing contact information.

Beyond standard contact management, the system features a robust **Role-Based Access Control (RBAC)** architecture. It distinguishes between regular **Members**, who manage their own private address books, and **Superadmins**, who possess elevated privileges to oversee the entire user base and manage content across the platform.

**Key Features:**

- **Secure Authentication:** JWT-based signup and login system.
- **Contact Management:** Create, read, update, and delete (CRUD) operations for contacts.
- **User Profiles:** Customizable user profiles with avatar uploads.
- **Admin Dashboard:** Specialized tools for administrators to view, edit, and delete registered users and their associated data.
- **Responsive Design:** A polished UI built with Tailwind CSS and Shadcn UI that works seamlessly across devices.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18 or higher recommended)
- **npm** (Node Package Manager)
- **MongoDB** (A running instance or a connection string to a cloud cluster like MongoDB Atlas)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Bhavesh-Tank-devx/contact.git
    cd contact
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    MONGODB_URI=mongodb://localhost:27017/contact-app  # Replace with your MongoDB connection string
    JWT_SECRET=your_super_secret_jwt_key                # Replace with a strong secret key
    ```

4.  **Run the application:**

    ```bash
    npm run dev
    ```

5.  **Access the app:**
    Open your browser and navigate to `http://localhost:3000`.

## Usage

### For Regular Users

1.  **Sign Up/Login:** Create a new account or log in with existing credentials.
2.  **Dashboard:** Upon logging in, you are directed to the dashboard where you can view your contact list.
3.  **Manage Contacts:**
    - Click "Add Contact" to create a new entry.
    - Click on a contact card to view details (Phone, Email, Age).
    - Use the "Edit" or "Delete" buttons on a contact to modify information.
4.  **Profile:** Click your avatar in the top-right corner to edit your username, email, or upload a new profile picture. You can also delete your account (which removes all your data) from this menu.

### For Superadmins

1.  **Registered Users:** Navigate to the `/users` page to see a list of all registered members.
2.  **User Management:**
    - Click the "Edit" (pencil) icon on any user card to modify their details (Role, Email, Username) or delete the user entirely.
    - **Note:** Deleting a user effectively wipes their account and all their associated contacts from the database.
3.  **Global Contact Management:** Click on a user card to open their contact list. As an admin, you can edit or delete contacts belonging to _any_ user directly from this view.
