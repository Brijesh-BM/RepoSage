import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Header - Line and Title
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E3A8A")) # Deep Blue
        self.drawString(54, 750, "REPOSAGE — PRINCIPAL ENGINEER CORE AUDIT & ARCHITECTURE GUIDE")
        self.setStrokeColor(colors.HexColor("#E2E8F0")) # Slate-200 line
        self.setLineWidth(0.75)
        self.line(54, 742, letter[0] - 54, 742)
        
        # Footer - Line and Page Numbers
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B")) # Slate-500 gray
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_text)
        self.drawString(54, 36, "Confidential — Internal Engineering & System Design Documentation")
        self.line(54, 48, letter[0] - 54, 48)
        
        self.restoreState()

def build_pdf():
    # Resolve Downloads path dynamically
    downloads_path = os.path.join(os.path.expanduser("~"), "Downloads")
    output_filename = os.path.join(downloads_path, "RepoSage_Architecture_and_Engineering_Guide.pdf")
    
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=85,
        bottomMargin=65
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette colors
    c_primary = colors.HexColor("#1E3A8A")
    c_text = colors.HexColor("#1E293B")
    c_light_bg = colors.HexColor("#F8FAFC")
    
    # Styles
    styles['Normal'].textColor = c_text
    styles['Normal'].fontSize = 9.5
    styles['Normal'].leading = 14
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=25
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        spaceAfter=6
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )
    
    list_style = ParagraphStyle(
        'ListStyle',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    story = []
    
    # ------------------ COVER HEADER ------------------
    story.append(Paragraph("RepoSage: Project Architecture & Engineering Audit", title_style))
    story.append(Paragraph("A System Architect's Guide to Agentic Repository Analysis, Web APIs, and Database Selections", subtitle_style))
    story.append(Spacer(1, 10))
    
    # ------------------ SECTION 1 ------------------
    story.append(Paragraph("1. RepoSage Overview & Why It Exists", h1_style))
    story.append(Paragraph(
        "RepoSage is a repository security, code quality, and architecture analysis orchestrator designed to operate like an automated "
        "Principal Engineer. It bridges the gap between traditional Static Application Security Testing (SAST) tools and manual code reviews. "
        "Traditional SAST tools suffer from high false-positive rates because they analyze patterns without semantic context. RepoSage, "
        "by contrast, reads and reasons about code, validates candidate paths against the active file tree, fetches source code dynamically "
        "to confirm vulnerability triggers, critiques its own findings to filter out generic developer advice, and outputs specific, "
        "actionable remediation patches.", body_style
    ))
    
    # ------------------ SECTION 2 ------------------
    story.append(Paragraph("2. Technical Stack & Trade-Off Matrix", h1_style))
    story.append(Paragraph(
        "The application leverages an asynchronous FastAPI Python backend combined with Google Gemini's large-context model for processing "
        "complex directory metadata, backed by SQLite for robust, transaction-safe local storage.", body_style
    ))
    
    # Tech Stack Table
    tech_stack_data = [
        [Paragraph("<b>Component</b>", header_style), Paragraph("<b>Technology</b>", header_style), Paragraph("<b>Why Chosen</b>", header_style), Paragraph("<b>Alternatives Rejected</b>", header_style)],
        
        [Paragraph("Backend Framework", body_style), Paragraph("FastAPI (Python)", body_style), 
         Paragraph("High-performance, native async support, automated OpenAPI docs, Pydantic validation.", body_style), 
         Paragraph("Django (bloated/heavy), Flask (lacks async and Pydantic integrations).", body_style)],
         
        [Paragraph("Database", body_style), Paragraph("SQLite + SQLAlchemy Async", body_style), 
         Paragraph("Zero-configuration local DB file. Asynchronous bindings prevent engine IO lockups.", body_style), 
         Paragraph("PostgreSQL (excessive configuration overhead for localized desktop workspaces).", body_style)],
         
        [Paragraph("Orchestration Agent", body_style), Paragraph("Gemini 3.5 Flash", body_style), 
         Paragraph("Massive context window (ideal for file trees) and native JSON schema structured outputs.", body_style), 
         Paragraph("OpenAI GPT-4 (higher latency, cost, and restrictive token constraints).", body_style)],
         
        [Paragraph("GitHub Access", body_style), Paragraph("PyGithub REST API v3", body_style), 
         Paragraph("Stable, type-safe API client wrapper over GitHub REST v3 endpoints.", body_style), 
         Paragraph("Git CLI (requires cloning full repos locally, consuming storage and network IO).", body_style)],
         
        [Paragraph("Frontend", body_style), Paragraph("Next.js + Tailwind", body_style), 
         Paragraph("Dynamic page routing, responsive design utilities, and native WebSocket client support.", body_style), 
         Paragraph("Vanilla JS (too complex to state-manage real-time diff logs and vulnerabilities).", body_style)]
    ]
    
    t_stack = Table(tech_stack_data, colWidths=[75, 85, 185, 155])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 10))
    
    # ------------------ SECTION 3 ------------------
    story.append(Paragraph("3. End-to-End Execution Flow", h1_style))
    story.append(Paragraph("The system runs an asynchronous, pipeline-based flow categorized in 5 sequential steps:", body_style))
    story.append(Paragraph("• <b>Observe (10% - 20%)</b>: Retrieves README, recursive file trees, issues, commits, and PRs via PyGithub; caching results in SQLite to bypass API rate limits.", list_style))
    story.append(Paragraph("• <b>Understand (30% - 40%)</b>: Dynamically detects and prioritizes the top 8 manifest, model, routing, and configuration files; reads their code and extracts the tech stack via LLM.", list_style))
    story.append(Paragraph("• <b>Reason (50% - 60%)</b>: Maps suspected issues to files, verifies paths case-insensitively, calls GitHub for code snippets, runs verification checks, and executes a self-critique pass to remove generic recommendations.", list_style))
    story.append(Paragraph("• <b>Act (75% - 80%)</b>: Formulates copy-pasteable patches and calculates risk vectors, classifying exploitability properties and specific, stack-aware attack vectors.", list_style))
    story.append(Paragraph("• <b>Report (90% - 100%)</b>: Generates positive signals, runs weighted score recalibration, saves report objects to database, and triggers WebSocket job completion.", list_style))
    
    story.append(PageBreak())
    
    # ------------------ SECTION 4 ------------------
    story.append(Paragraph("4. Core Engineering Implementations", h1_style))
    
    story.append(Paragraph("A. 3-Step Verification Pipeline", h2_style))
    story.append(Paragraph(
        "To combat LLM hallucinations, a strict validation funnel was designed: (1) Identify high-level issues using repository metadata; "
        "(2) Verify paths case-insensitively, stripping leading slashes, and fetching raw files from GitHub; (3) Critique validated findings "
        "via a separate senior principal engineer prompt pass to filter out generic suggestions.", body_style
    ))
    
    story.append(Paragraph("B. Recalibrated Health Score Algorithm", h2_style))
    story.append(Paragraph(
        "Unlike generic rules that start at 100, the system initiates calculations from a base score of 60. Positive signal rewards are added: "
        "CI config (+5), tests directory (+5), README > 200 words (+5), commits in last 30 days (+5), TypeScript use (+3), and linter files (+3). "
        "Severity subtractions are subtracted based on finding classes: Critical (-8), High (-5), Medium (-2), and Low (-0.5). "
        "The system rounds to the nearest integer, ceiled at 95 and floored at 10.", body_style
    ))

    # ------------------ SECTION 5 ------------------
    story.append(Paragraph("5. Comprehensive Guide to API Architectures", h1_style))
    story.append(Paragraph(
        "Distributed environments communicate using different formats depending on latency, schema structures, and streaming demands.", body_style
    ))
    
    # API Table
    api_table_data = [
        [Paragraph("<b>API Style</b>", header_style), Paragraph("<b>Description</b>", header_style), Paragraph("<b>Why Use / Strengths</b>", header_style), Paragraph("<b>Use Cases / Context</b>", header_style)],
        
        [Paragraph("REST", body_style), Paragraph("Resource-oriented URLs mapping to standard HTTP verbs (GET, POST, etc.).", body_style), 
         Paragraph("Stateless, natively cacheable, decoupled, universally understood.", body_style), 
         Paragraph("Standard CRUD operations (e.g. submitting jobs/fetching reports).", body_style)],
         
        [Paragraph("GraphQL", body_style), Paragraph("Query language offering client-driven, single-endpoint data fetching.", body_style), 
         Paragraph("Prevents over-fetching and under-fetching, client-controlled.", body_style), 
         Paragraph("Complex, deeply nested records, dashboard UIs with variable widgets.", body_style)],
         
        [Paragraph("WebSockets", body_style), Paragraph("Persistent, bi-directional, full-duplex TCP communication channels.", body_style), 
         Paragraph("Real-time data pushing with minimal network header overhead.", body_style), 
         Paragraph("Live logs (e.g. streaming RepoSage progress steps), chat systems.", body_style)],
         
        [Paragraph("gRPC", body_style), Paragraph("High-performance RPC using HTTP/2 and Protocol Buffers serialization.", body_style), 
         Paragraph("Extremely lightweight binary payloads, type contracts.", body_style), 
         Paragraph("Inter-microservice communication, internal streaming.", body_style)],
         
        [Paragraph("Webhooks", body_style), Paragraph("HTTP POST callbacks triggered by specific events.", body_style), 
         Paragraph("Replaces polling loops, optimizing system workloads.", body_style), 
         Paragraph("Payment receipts (Stripe), git push notifications to CI (GitHub Webhooks).", body_style)]
    ]
    
    t_api = Table(api_table_data, colWidths=[65, 115, 160, 160])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ------------------ SECTION 6 ------------------
    story.append(Paragraph("6. Comprehensive Guide to Database Architectures", h1_style))
    story.append(Paragraph(
        "Storing data effectively depends on consistency guarantees, structures (relational vs. NoSQL), and search requirements.", body_style
    ))
    
    # DB Table
    db_table_data = [
        [Paragraph("<b>DB Category</b>", header_style), Paragraph("<b>Store Model</b>", header_style), Paragraph("<b>Strengths</b>", header_style), Paragraph("<b>Use Cases</b>", header_style)],
        
        [Paragraph("Relational (SQL)", body_style), Paragraph("Tables with schemas, foreign key mappings.", body_style), 
         Paragraph("Strict ACID transactions, robust data integrity, complex relational joins.", body_style), 
         Paragraph("User tables, transactions, financial logs, structured reports.", body_style)],
         
        [Paragraph("NoSQL Document", body_style), Paragraph("Semi-structured collections of JSON-like files.", body_style), 
         Paragraph("Schema-less model, rapid iteration, horizontal scaling.", body_style), 
         Paragraph("Content management systems, catalogs, telemetry logs.", body_style)],
         
        [Paragraph("NoSQL Key-Value", body_style), Paragraph("Dictionary structures, running in-memory.", body_style), 
         Paragraph("Sub-millisecond read/write speeds, highly responsive.", body_style), 
         Paragraph("Caching databases (Redis), active user sessions, API rate-limiting.", body_style)],
         
        [Paragraph("NoSQL Graph", body_style), Paragraph("Nodes, Edges, and Properties representing relations.", body_style), 
         Paragraph("Highly efficient traversal of deeply connected entities.", body_style), 
         Paragraph("Social networks, fraud graphs, search engine indexes.", body_style)],
         
        [Paragraph("NoSQL Vector", body_style), Paragraph("Stores high-dimensional mathematical vectors.", body_style), 
         Paragraph("Semantic similarity search instead of keyword checks.", body_style), 
         Paragraph("RAG contexts, image search, machine learning recommendations.", body_style)]
    ]
    
    t_db = Table(db_table_data, colWidths=[80, 100, 160, 160])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 10))
    
    # ------------------ CONCLUSION ------------------
    story.append(Paragraph("7. Architectural Conclusion", h1_style))
    story.append(Paragraph(
        "By structuring the backend with asynchronous routing (FastAPI) and structured LLM validators (Gemini), "
        "and selecting SQLite for local relational persistence, RepoSage demonstrates how semantic agentic workflows "
        "can be run cleanly and transaction-safely. Choosing the correct communication protocols (REST for commands, "
        "WebSockets for real-time progress) and structural models (SQL tables for strict foreign-key relations) is "
        "paramount to building reliable, high-performance software systems.", body_style
    ))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF built successfully at: {output_filename}")

if __name__ == "__main__":
    build_pdf()
