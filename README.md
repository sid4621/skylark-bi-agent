# Skylark BI Agent

An advanced, AI-powered Business Intelligence dashboard for Skylark, built to provide real-time insights into Sales Pipelines and Operations Work Orders.

## 🚀 Features

### **1. Intelligent Board Switching**
-   **Sales Pipeline Board**: Visualize total pipeline value, weighted revenue, and deal stages.
-   **Operations Board**: Track work orders, execution status, billing status, and project timelines.

### **2. AI-Powered Chat Assistant**
-   Ask natural language questions about your data (e.g., *"Show me critical delays"*, *"What is the total billing pending?"*).
-   **Hybrid Context Awareness**: The AI understands which board you are viewing but can also cross-reference data (e.g., checking delays while in Sales view).
-   **Multi-Model Support**: Automatically falls back between Groq (Llama 3) and HuggingFace (Mistral) for reliability.

### **3. Real-Time KPI Cards**
-   Dynamic top-level metrics that update based on the selected board.
-   Visual indicators for trends and critical alerts.

### **4. Modern UI/UX**
-   Built with **Next.js 14** and **Tailwind CSS**.
-   Glassmorphism design with smooth animations (Framer Motion).
-   Responsive sidebar and chat interface.

---

## 🛠️ Tech Stack

-   **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons.
-   **Backend**: Next.js API Routes.
-   **Data Source**: Monday.com GraphQL API.
-   **AI Engines**: Groq Cloud (Llama 3.3 70B), HuggingFace Inference API (Mistral 7B).

---

## ⚙️ Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/sid4621/skylark-bi-agent.git
    cd skylark-bi-agent
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file in the root directory and add the following keys:
    ```env
    # Monday.com Configuration
    MONDAY_API_KEY=your_monday_api_key
    DEALS_BOARD_ID=your_deals_board_id
    WORK_ORDERS_BOARD_ID=your_work_orders_board_id

    # AI Service Keys
    GROQ_API_KEY=your_groq_api_key
    HF_API_KEY=your_huggingface_key
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```

---

## 🚀 Deployment

The easiest way to deploy is via **Vercel**:

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  **IMPORTANT**: Add the Environment Variables from step 3 into your Vercel Project Settings.
4.  Deploy!
