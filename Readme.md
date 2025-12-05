# **Low-Level Design (LLD V1)**

**Project:** AI-driven Client-Centric Codebase Interpreter & Change Impact Estimator

---

## **1\. Core System Objective**

Enable non-technical clients to query a project’s codebase and get:

* Simple explanations of how features work  
* Real-world analogie  
* Architecture diagrams  
* Change impact analysis  
* Edge cases and risks  
* Estimated development effort and timelines

All answers are grounded in project-specific code using **RAG**.

---

## **2\. Key Architectural Principles**

| Component | Behavior |
| :---- | ----- |
| LLM Provider | **Single** — Groq API with llama-3.1-8b-instant |
| Embeddings Provider | **Single** → Local BGE model via @xenova/transformers |
| Vector Store | pgvector inside PostgreSQL |
| Storage | PostgreSQL \+ Prisma ORM |
| Processing | RAG pipeline orchestrated in backend |
| Access | Multi-tenant, project-isolated context |

---

## **3\. System Components**

### **3.1 Frontend (React / Next.js)**

Modules:

* Authentication UI (Google \+ credentials)

* Project Dashboard

* Project File Manager (drag and drop, zip upload, paste code)

* Chat Interface

* Query History Viewer

* Change Request Mode Toggle

* Explanation Viewer (formatted sections, diagrams, effort blocks)

---

### **3.2 Backend (Node.js / Express \+ Prisma)**

#### **Submodules:**

| Module | Responsibility |
| ----- | ----- |
| Auth Service | OAuth \+ Credentials login |
| Project Service | Create/manage projects |
| File Upload Service | Process files & zips |
| Code Chunker | Split files into manageable token chunks |
| Embeddings Service | Generate embeddings using local BGE model |
| Vector DB Service | Insert/query pgvector embeddings |
| Chat/RAG Orchestrator | Retrieve relevant context, prompt Groq API |
| Explanation Formatter | Build structured output |
| Change Impact Analyzer | Detect impacted parts, risks & edge cases |
| Effort Estimation Engine | Produce XS/S/M/L/XL \+ timeline ranges |

---

## **4\. Detailed Functional Flows**

### **4.1 Project Initialization**

User → Create Project  
Project DB row created

---

### **4.2 Code Ingestion Flow**

Developer uploads files (drag-drop / zip / paste)  
↓  
Backend extracts files  
↓  
Code Chunker splits into 200–400 token segments  
↓  
Each chunk → Local BGE embedding model  
↓  
Store embeddings in pgvector \+ metadata in DB

---

### **4.3 Client Query → RAG Flow**

Client asks question on project  
↓  
Embed query via local BGE model  
↓  
Vector similarity search on embeddings (project\_id filtered)  
↓  
Top N chunks retrieved  
↓  
Backend builds structured prompt:  
  \- Simple explanation tone  
  \- Include chunks \+ paths  
  \- Ask for diagrams, analogies, workflows  
↓  
Send to Groq API (llama-3.1-8b-instant)  
↓  
Format output and store response  
↓  
Return final answer to client UI

---

### **4.4 Change Request Mode**

Triggered manually by client:

Client clicks "Request Change"  
↓  
Types request  
↓  
RAG flow retrieves relevant file chunks  
↓  
LLM generates:  
  \- Impact analysis (files/modules affected)  
  \- Edge cases  
  \- Risks  
  \- Performance/security considerations  
  \- Recommended approach  
  \- Estimated timeline (XS/S/M/L/XL)  
  \- Hours/days range  
↓  
Store impact report in DB  
↓  
Show formatted result on frontend

---

## **5\. Database Schema (PostgreSQL \+ Prisma)**

### **5.1 Users**

User {  
  id: UUID  
  name: String  
  email: String  
  authProvider: ENUM(GOOGLE, LOCAL)  
  passwordHash: String?  
  createdAt: DateTime  
}

### **5.2 Projects**

Project {  
  id: UUID  
  name: String  
  description: String?  
  createdBy: User  
  createdAt: DateTime  
}

### **5.3 Files**

File {  
  id: UUID  
  projectId: UUID  
  name: String  
  language: String  
  size: Int  
  content: Text  
  createdAt: DateTime  
}

### **5.4 File Chunks**

FileChunk {  
  id: UUID  
  fileId: UUID  
  projectId: UUID  
  index: Int  
  content: Text  
  tokenCount: Int  
}

### **5.5 Chunk Embeddings**

ChunkEmbedding {  
  id: UUID  
  fileChunkId: UUID  
  projectId: UUID  
  embedding: VECTOR(768)  
  createdAt: DateTime  
}

### **5.6 Conversations & Messages**

Conversation {  
  id: UUID  
  projectId: UUID  
  createdBy: UUID  
  createdAt: DateTime  
}

Message {  
  id: UUID  
  conversationId: UUID  
  sender: ENUM(USER, AI)  
  content: Text  
  rawContext: JSON?  
  createdAt: DateTime  
}

### **5.7 Change Impact Reports**

ImpactReport {  
  id: UUID  
  messageId: UUID  
  effortBucket: ENUM(XS, S, M, L, XL)  
  timeRange: String // e.g., "2–3 days"  
  edgeCases: JSON  
  challenges: JSON  
  affectedFiles: JSON  
  createdAt: DateTime  
}

---

## **6\. Backend Class Diagram (Conceptual)**

\+------------------+  
| AuthService      |  
\+------------------+  
| login()          |  
| googleLogin()    |  
| validateToken()  |  
\+------------------+

\+------------------+  
| ProjectService   |  
\+------------------+  
| createProject()  |  
| setLLMProvider() |  
| getProjects()    |  
\+------------------+

\+---------------------+  
| FileUploadService   |  
\+---------------------+  
| uploadFile()        |  
| uploadZip()         |  
| saveFile()          |  
\+---------------------+

\+-----------------------+  
| ChunkingService       |  
\+-----------------------+  
| splitFileIntoChunks() |  
| tokenize()            |  
\+-----------------------+

\+------------------------+  
| EmbeddingService       |  
\+------------------------+  
| createEmbedding()      |  
| storeEmbedding()       |  
\+------------------------+

\+---------------------------+  
| RAGQueryOrchestrator      |  
\+---------------------------+  
| embedQuery()              |  
| retrieveRelevantChunks()  |  
| generatePrompt()          |  
| callLLM()                 |  
\+---------------------------+

\+-------------------------+  
| ExplanationFormatter    |  
\+-------------------------+  
| formatSimpleExplanation |  
| formatDiagram()         |  
| formatImpactReport()    |  
\+-------------------------+

\+-----------------------------+  
| ChangeImpactAnalyzer        |  
\+-----------------------------+  
| detectModules()             |  
| findEdgeCases()             |  
| estimateEffort()            |  
\+-----------------------------+

---

## **7\. Final Output Format Example**

LLM responses will be structured as:

{  
  "overview": "...",  
  "how\_it\_works": \["step 1", "step 2"\],  
  "real\_world\_analogy": "...",  
  "affected\_files": \["src/utils/otp.js"\],  
  "edge\_cases": \["network failure", "token expiry mismatch"\],  
  "effort\_bucket": "S",  
  "estimated\_time": "1–2 days"  
}

Frontend renders this into a clean UI.

---

## **8\. What Makes This Design Client-Centric**

| Feature | Client Benefit |
| ----- | ----- |
| Simple explanations | Understand functionality without tech terms |
| Diagrams \+ analogies | Faster comprehension |
| Change impact reports | No hidden surprises |
| Timelines \+ effort | Clear expectation setting |
| Project isolation | Personalized experience |

---
