# Strategic Analysis: Perplexity Research for Áquila Pro

Analysis of the research provided on 2026-03-26 regarding the best APIs, LLMs, and Repositories for the Áquila Pro ecosystem.

## 🚀 High-Value Integrations (Immediate/Mid-term)

### 1. Unified Messaging Architecture (WhatsApp)
The recommendation to use a **Notification Microservice** that abstracts the provider (Evolution API, Twilio, or Meta) is the most valuable architectural insight. 
- **Utility:** High. Prevents code duplication in main/renderer and allows schools to choose their own billing model (direct Meta vs. third-party gateway).
- **Action:** Refactor current WhatsApp logic into a standalone `NotificationGatewayService`.

### 2. Weapon Detection (YOLOv8/v10)
The research points to several YOLOv8/v10 repos specifically tuned for CFTV/IP Cameras.
- **Utility:** Critical. Upgrading from standard YOLO to a model pre-trained on "Firearms in CCTV" significantly reduces false positives (essential for schools).
- **Action:** Integrate [JoaoAssalim/Weapons-and-Knives-Detector-with-YOLOv8](https://github.com/JoaoAssalim/Weapons-and-Knives-Detector-with-YOLOv8) logic into our Python `camera_worker.py`.

### 3. Incident Management (TheHive / OneUptime)
Rather than building a custom database for security logs, integrating with **TheHive** (via API) provides enterprise-grade evidence tracking.
- **Utility:** Mid-term. Adds "Evidence Timelines" and "Playbooks" (action plans) to the Unified Command module.
- **Action:** Evaluate `TheHive API` for the "Security Vision" module.

## 🤖 LLM Strategy for Schools

### The "Hybrid Edge‑Cloud" Approach
- **Edge (Local):** Small models (Llama 3 8B or Phi-3) for PII-sensitive summarization (e.g., "Summarize events for Room 4B without sending student names to the cloud").
- **Cloud (Global):** Deep analysis for "Anonymized Pedagogical Reports" or "Weekly Security Audit" where higher reasoning is required.
- **Safety:** Use the **Awesome-LLM-Safety** guidelines to ensure AI-generated messages to parents are empathetic and legally compliant.

## 🛠️ Infrastructure & Observability

### "NOC Digital" (Prometheus + Grafana)
Standardizing on Prometheus permits monitoring the **Desktop Application's health** (Memory leak detection, CPU usage of AI models, Camera reconnect streaks).
- **Benefit:** Allows proactively fixing a camera that "flickers" before the user notices.

## 🧭 Recommendation Summary

| Category | Recommended Tool | Priority | Why |
| :--- | :--- | :--- | :--- |
| **AI Model** | YOLOv8/v10 (Tuned) | **P0** | Higher accuracy specifically for weapons in CCTV. |
| **Messaging** | Evolution API Gateway | **P1** | Flexible, local, and works with current implementation. |
| **Management** | TheHive API | **P2** | Professional incident tracking with evidence timelines. |
| **Analysis** | Hybrid LLM (local/cloud) | **P2** | Deep reporting + privacy-first local summaries. |
