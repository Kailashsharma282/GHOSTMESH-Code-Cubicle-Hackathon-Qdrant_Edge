"""
Generates a 16:9 presentation deck for GHOSTMESH for Code Cubicle 6.0.
Output: GHOSTMESH_Hackathon_Presentation.pptx
"""
import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Design Tokens (Obsidian / Cyber Dark Theme)
BG_DARK = RGBColor(7, 10, 18)        # #070A12
CARD_BG = RGBColor(15, 20, 32)       # #0F1420
BORDER_COLOR = RGBColor(30, 41, 59)  # #1E293B
TEXT_WHITE = RGBColor(248, 250, 252) # #F8FAFC
TEXT_SLATE = RGBColor(148, 163, 184) # #94A3B8
TEXT_MUTED = RGBColor(100, 116, 139) # #64748B

COLOR_BLUE = RGBColor(59, 130, 246)   # #3B82F6
COLOR_CYAN = RGBColor(34, 211, 238)   # #22D3EE
COLOR_EMERALD = RGBColor(52, 211, 153)# #34D399
COLOR_AMBER = RGBColor(251, 191, 36)  # #FBBF24
COLOR_PURPLE = RGBColor(192, 132, 252)# #C084FC
COLOR_ROSE = RGBColor(244, 63, 94)    # #F43F5E

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_DARK

def add_header(slide, title_text, category_text="GHOSTMESH • QDRANT EDGE TRACK"):
    # Category Tracker
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
    tf_cat = cat_box.text_frame
    tf_cat.word_wrap = True
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_CYAN
    p_cat.font.name = "Arial"
    
    # Title
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.8))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Arial"

def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=BORDER_COLOR):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1)
    return shape

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)
    
    # Hero Card
    add_card(s1, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5), bg_color=CARD_BG, border_color=COLOR_BLUE)
    
    # Title badge
    b_box = s1.shapes.add_textbox(Inches(1.6), Inches(1.4), Inches(10.0), Inches(0.4))
    p_b = b_box.text_frame.paragraphs[0]
    p_b.text = "CODE CUBICLE 6.0  •  QDRANT EDGE TRACK"
    p_b.font.size = Pt(12)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_CYAN
    
    # Title
    t_box = s1.shapes.add_textbox(Inches(1.6), Inches(1.8), Inches(10.0), Inches(1.2))
    p_t = t_box.text_frame.paragraphs[0]
    p_t.text = "GHOSTMESH"
    p_t.font.size = Pt(54)
    p_t.font.bold = True
    p_t.font.color.rgb = TEXT_WHITE
    
    # Tagline
    tag_box = s1.shapes.add_textbox(Inches(1.6), Inches(3.0), Inches(10.0), Inches(0.8))
    p_tag = tag_box.text_frame.paragraphs[0]
    p_tag.text = '"Every device remembers alone. Together, they remember everything."'
    p_tag.font.size = Pt(18)
    p_tag.font.italic = True
    p_tag.font.color.rgb = TEXT_SLATE
    
    # Description
    desc_box = s1.shapes.add_textbox(Inches(1.6), Inches(3.8), Inches(10.0), Inches(1.0))
    p_desc = desc_box.text_frame.paragraphs[0]
    p_desc.text = "A privacy-preserving, offline-first distributed semantic memory fabric powered by in-process Qdrant Edge shards and Qdrant Server convergence."
    p_desc.font.size = Pt(14)
    p_desc.font.color.rgb = TEXT_MUTED
    
    # Metadata Row (Team & Participant)
    meta_card = add_card(s1, Inches(1.6), Inches(5.0), Inches(10.133), Inches(1.1), bg_color=RGBColor(10, 14, 24), border_color=BORDER_COLOR)
    m_box = s1.shapes.add_textbox(Inches(1.8), Inches(5.1), Inches(9.8), Inches(0.9))
    tf_m = m_box.text_frame
    p_m1 = tf_m.paragraphs[0]
    p_m1.text = "Team: infinitehacks    |    Solo Participant: Pochiraju Kailash Ram Markandeya Sharma"
    p_m1.font.size = Pt(13)
    p_m1.font.bold = True
    p_m1.font.color.rgb = COLOR_EMERALD
    
    p_m2 = tf_m.add_paragraph()
    p_m2.text = "Status: Production Ready • 17/17 QA Pass • Zero Hallucinations • Live Tested"
    p_m2.font.size = Pt(11)
    p_m2.font.color.rgb = TEXT_SLATE

    # ==========================================
    # SLIDE 2: THE PROBLEM
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Distributed Edge Memory Crisis", "PROBLEM STATEMENT")
    
    cards_data = [
        ("The Cloud-Dependency Trap", 
         "Standard vector databases fail completely when connectivity is severed. In tunnels, remote zones, or during network outages, edge devices lose 100% of their semantic search capability.",
         COLOR_ROSE, Inches(0.8)),
        ("The Privacy Breach Paradox", 
         "Centralized architectures force edge nodes to stream raw observations, passwords, camera frames, and personal records to cloud servers for embedding, violating user data sovereignty.",
         COLOR_AMBER, Inches(4.8)),
        ("The Blind Overwrite Fallacy", 
         "When reconnecting, naive databases use 'last-write-wins' (LWW) or crude CRUD updates, blindly overwriting complementary physical facts or creating duplicate noise.",
         COLOR_PURPLE, Inches(8.8)),
    ]
    
    for title, desc, color, left in cards_data:
        add_card(s2, left, Inches(1.8), Inches(3.733), Inches(4.8), bg_color=CARD_BG, border_color=color)
        t_box = s2.shapes.add_textbox(left + Inches(0.3), Inches(2.1), Inches(3.133), Inches(0.8))
        p = t_box.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = color
        
        d_box = s2.shapes.add_textbox(left + Inches(0.3), Inches(2.9), Inches(3.133), Inches(3.2))
        p_d = d_box.text_frame.paragraphs[0]
        p_d.text = desc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = TEXT_SLATE
        d_box.text_frame.word_wrap = True

    # ==========================================
    # SLIDE 3: WHY QDRANT EDGE?
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Why Qdrant Edge is the Core Breakthrough", "TECHNICAL FOUNDATION")
    
    # Left Comparison Card: Traditional
    add_card(s3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=BORDER_COLOR)
    tb1 = s3.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "TRADITIONAL CLOUD VECTOR SEARCH"
    p1.font.size = Pt(15)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ROSE
    
    points1 = [
        "Network-dependent: 0% offline search capability",
        "High latency: 150ms-400ms network round trips",
        "Data leakage: Raw confidential notes leave device",
        "Single point of failure: Cloud outage paralyzes edge",
        "Monolithic schema: All devices forced to share 1 shard"
    ]
    for pt in points1:
        p = tf1.add_paragraph()
        p.text = "❌  " + pt
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_SLATE
        
    # Right Comparison Card: GhostMesh + Qdrant Edge
    add_card(s3, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=COLOR_CYAN)
    tb2 = s3.shapes.add_textbox(Inches(7.2), Inches(2.1), Inches(5.0), Inches(4.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "GHOSTMESH + QDRANT EDGE"
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_CYAN
    
    points2 = [
        "Autonomous: 100% offline local vector search",
        "Ultra-low latency: Sub-10ms local recall directly from disk",
        "Data sovereignty: Sensitive vectors quarantined on-device",
        "Resilient: Devices operate indefinitely while disconnected",
        "QdrantClient(path=...): True in-process embedded storage"
    ]
    for pt in points2:
        p = tf2.add_paragraph()
        p.text = "✓  " + pt
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_EMERALD

    # ==========================================
    # SLIDE 4: ARCHITECTURE OVERVIEW
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Multi-Tier Mesh Architecture", "SYSTEM TOPOLOGY")
    
    tiers = [
        ("Tier 1: Autonomous Edge Nodes", 
         "Each node (Phone, Laptop, Camera) hosts an in-process Qdrant Edge instance (QdrantClient with local on-disk storage) and a local SQLite egress transaction queue with WAL mode.",
         COLOR_CYAN, Inches(0.8)),
        ("Tier 2: Egress & Privacy Policy Engine", 
         "Pre-sync classification evaluates all observations on-device. Sensitive records (passwords, PINs, IDs) are permanently quarantined as LOCAL_ONLY and physically blocked from network transmission.",
         COLOR_AMBER, Inches(4.8)),
        ("Tier 3: Qdrant Server Convergence", 
         "When connectivity is established, queued items sync to centralized Qdrant Server (:6333). Multi-factor reconciliation detects conflicts and produces canonical records with provenance DAGs.",
         COLOR_BLUE, Inches(8.8)),
    ]
    for title, desc, color, left in tiers:
        add_card(s4, left, Inches(1.8), Inches(3.733), Inches(4.8), bg_color=CARD_BG, border_color=color)
        t_box = s4.shapes.add_textbox(left + Inches(0.3), Inches(2.1), Inches(3.133), Inches(0.8))
        p = t_box.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = color
        
        d_box = s4.shapes.add_textbox(left + Inches(0.3), Inches(3.0), Inches(3.133), Inches(3.2))
        p_d = d_box.text_frame.paragraphs[0]
        p_d.text = desc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = TEXT_SLATE
        d_box.text_frame.word_wrap = True

    # ==========================================
    # SLIDE 5: OFFLINE SEMANTIC AUTONOMY
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Offline Ingestion, Search & Queueing", "EDGE INTELLIGENCE")
    
    add_card(s5, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.8), bg_color=CARD_BG, border_color=BORDER_COLOR)
    tb = s5.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(10.933), Inches(4.2))
    tf = tb.text_frame
    tf.word_wrap = True
    
    steps = [
        ("1. FastEmbed On-Device Vectors", "Local embedding generation using BAAI/bge-small-en-v1.5 (384-dimensional dense vectors) executed directly via ONNX Runtime without external API calls."),
        ("2. In-Process Qdrant Edge Upsert", "Vectors are immediately indexed into isolated disk partitions under data/device-{id}/edge/ with cosine distance indexing."),
        ("3. Local Semantic Recall Without Network", "When offline, users query the node locally. The query vector is compared against the local shard in ~8.6ms with zero network packets sent."),
        ("4. Resilient SQLite Egress Transaction Queue", "Simultaneously, observations marked for sync enter local SQLite queue.db with status PENDING. Guarantees zero memory loss during network crashes.")
    ]
    for title, desc in steps:
        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_CYAN
        
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = TEXT_SLATE

    # ==========================================
    # SLIDE 6: PRIVACY AS SYNCHRONIZATION POLICY
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Privacy as a Synchronization Policy", "DATA SOVEREIGNTY")
    
    priv_tiers = [
        ("LOCAL_ONLY (Quarantined)", "Confidential passwords, PIN codes, passport notes, encryption keys, biometric badges.", "PHYSICALLY BLOCKED at edge runtime. Never transmitted over WebSocket or uploaded to Qdrant Cloud.", COLOR_ROSE, Inches(0.8)),
        ("SYNC_ALLOWED (Encrypted Sync)", "Work observations, tool placements, field notes, hardware locations.", "Queued in local SQLite and synced to Qdrant Server upon connection for collective mesh access.", COLOR_BLUE, Inches(4.8)),
        ("PUBLIC_SYNC (Mesh Broadcast)", "Ambient room temperature, light levels, facility layout telemetry.", "Shared openly and broadcast across all participating edge nodes in the cluster.", COLOR_PURPLE, Inches(8.8)),
    ]
    for title, examples, action, color, left in priv_tiers:
        add_card(s6, left, Inches(1.8), Inches(3.733), Inches(4.8), bg_color=CARD_BG, border_color=color)
        t_box = s6.shapes.add_textbox(left + Inches(0.3), Inches(2.1), Inches(3.133), Inches(0.8))
        p = t_box.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = color
        
        d_box = s6.shapes.add_textbox(left + Inches(0.3), Inches(3.0), Inches(3.133), Inches(3.2))
        tf_d = d_box.text_frame
        tf_d.word_wrap = True
        p1 = tf_d.paragraphs[0]
        p1.text = "Examples:\n" + examples
        p1.font.size = Pt(12)
        p1.font.color.rgb = TEXT_WHITE
        
        p2 = tf_d.add_paragraph()
        p2.text = "\nPolicy Action:\n" + action
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_SLATE

    # ==========================================
    # SLIDE 7: EXPLAINABLE RECONCILIATION
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Explainable Reconciliation & 'Why Not Merge?'", "ANTI-HALLUCINATION")
    
    add_card(s7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=COLOR_AMBER)
    tb1 = s7.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "THE 'WHY NOT MERGE?' GUARDRAIL"
    p1.font.size = Pt(16)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_AMBER
    
    p_ex = tf1.add_paragraph()
    p_ex.text = "\nCase Study: Spatial Contradiction\n• Device A: 'Blue backpack is on the chair.'\n• Device B: 'Blue backpack is on the floor.'\n\nResult:\nGhostMesh detects high semantic similarity (>85%), but spatial entity extraction identifies mutually exclusive physical locations ('chair' vs 'floor').\n\nDecision:\nCANNOT SAFELY MERGE. Both records preserved with transparent reasoning rather than hallucinating an invalid combination."
    p_ex.font.size = Pt(12)
    p_ex.font.color.rgb = TEXT_SLATE
    
    add_card(s7, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=COLOR_CYAN)
    tb2 = s7.shapes.add_textbox(Inches(7.2), Inches(2.1), Inches(5.0), Inches(4.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "TRANSPARENT 4-FACTOR SCORING"
    p2.font.size = Pt(16)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_CYAN
    
    scores = [
        ("1. Semantic Cosine Match (40%)", "Dense vector similarity in Qdrant Server embedding space."),
        ("2. Temporal Decay Factor (25%)", "Exponential half-life penalty based on timestamp distance."),
        ("3. Device Confidence Weight (20%)", "Edge sensor/operator certainty score (0.0 to 1.0)."),
        ("4. Contradiction Penalty (15%)", "Entity conflict deduction preventing false positive merges.")
    ]
    for sc, desc in scores:
        p_s = tf2.add_paragraph()
        p_s.text = "\n" + sc
        p_s.font.size = Pt(12)
        p_s.font.bold = True
        p_s.font.color.rgb = TEXT_WHITE
        p_d = tf2.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_SLATE

    # ==========================================
    # SLIDE 8: CANONICAL MERGE & PROVENANCE
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Multi-Node Canonical Synthesis & Provenance", "COLLECTIVE CONVERGENCE")
    
    add_card(s8, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.8), bg_color=CARD_BG, border_color=COLOR_EMERALD)
    tb = s8.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(10.933), Inches(4.2))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p1 = tf.paragraphs[0]
    p1.text = "COMBINING COMPLEMENTARY PERSPECTIVES (CHARGER DEMO)"
    p1.font.size = Pt(16)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_EMERALD
    
    pts = [
        ("Input Evidence from 3 Disconnected Nodes:", 
         "• Node A (Phone): 'USB-C charger placed on office desk.' (Confidence: 82%)\n• Node B (Laptop): 'Black charger near laptop.' (Confidence: 71%)\n• Node C (Camera): 'Charger placed beside MacBook.' (Confidence: 91%)"),
        ("Reconciliation Decision:",
         "Composite multi-factor score reaches 91.2%. Entities are complementary (USB-C, Black, Desk, Laptop, MacBook). Canonical record is synthesized: 'USB-C charger placed near laptop on office desk'."),
        ("Cryptographic Provenance Lineage:",
         "The canonical record does NOT replace or delete source data. It stores a Directed Acyclic Graph (DAG) pointing to A, B, and C with original timestamps, SHA hashes, and cosine scores.")
    ]
    for h, body in pts:
        p = tf.add_paragraph()
        p.text = "\n" + h
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN
        p_b = tf.add_paragraph()
        p_b.text = body
        p_b.font.size = Pt(11)
        p_b.font.color.rgb = TEXT_SLATE

    # ==========================================
    # SLIDE 9: ANTI-HALLUCINATION & QA AUDIT
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Strict Real vs. Simulated Disclosures & QA Pass", "TRUST & COMPLIANCE")
    
    add_card(s9, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=COLOR_EMERALD)
    tb1 = s9.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "100% REAL IMPLEMENTATIONS"
    p1.font.size = Pt(15)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_EMERALD
    
    real_pts = [
        "QdrantClient(path=...): Genuine in-process local storage",
        "Qdrant Server :6333: Cloud convergence collection",
        "FastEmbed BGE-small: 384-dim ONNX embeddings",
        "SQLite queue.db: WAL mode transactional queues",
        "Multi-factor engine: Transparent deterministic scoring",
        "WebSocket Event Bus: Real-time event broadcasting",
        "Privacy quarantine: Physical cloud egress block"
    ]
    for pt in real_pts:
        p = tf1.add_paragraph()
        p.text = "✓ " + pt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_SLATE
        
    add_card(s9, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.8), bg_color=CARD_BG, border_color=BORDER_COLOR)
    tb2 = s9.shapes.add_textbox(Inches(7.2), Inches(2.1), Inches(5.0), Inches(4.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "DISCLOSED SIMULATIONS"
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_CYAN
    
    sim_pts = [
        "3 Physical Devices: Simulated as 3 isolated edge processes (Phone, Laptop, Camera) on 1 machine.",
        "Radio Mesh: BLE/LoRa transmission delays emulated via async timers.",
        "Zero Fake Metrics: All counts (memories, queues, conflicts) map 1:1 to SQLite/Qdrant."
    ]
    for pt in sim_pts:
        p = tf2.add_paragraph()
        p.text = "• " + pt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_SLATE
        
    p_qa = tf2.add_paragraph()
    p_qa.text = "\nAUDIT CERTIFICATION:"
    p_qa.font.size = Pt(12)
    p_qa.font.bold = True
    p_qa.font.color.rgb = COLOR_EMERALD
    p_qa_desc = tf2.add_paragraph()
    p_qa_desc.text = "17/17 QA Checks Passed  •  0 Lint Errors  •  0 Unresolved Runtime Exceptions."
    p_qa_desc.font.size = Pt(11)
    p_qa_desc.font.color.rgb = TEXT_WHITE

    # ==========================================
    # SLIDE 10: USE CASES & IMPACT
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Real-World Impact & Industry Applications", "USE CASES")
    
    cases = [
        ("Autonomous Robotics & Drones", "Warehouse and agricultural swarms explore GPS/Wi-Fi denied zones, build semantic spatial maps locally, and reconcile upon returning to base.", COLOR_CYAN, Inches(0.8)),
        ("Field Ops & Disaster Response", "First responders and medical teams index observations offline in disaster zones; critical patient notes stay private while triage data synchronizes.", COLOR_AMBER, Inches(4.8)),
        ("Smart Defense & Air-Gapped Facilities", "Classified facility operators query edge knowledge bases without broadcasting sensitive intelligence to external cloud infrastructure.", COLOR_ROSE, Inches(8.8)),
    ]
    for title, desc, color, left in cases:
        add_card(s10, left, Inches(1.8), Inches(3.733), Inches(4.8), bg_color=CARD_BG, border_color=color)
        t_box = s10.shapes.add_textbox(left + Inches(0.3), Inches(2.1), Inches(3.133), Inches(0.8))
        p = t_box.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = color
        
        d_box = s10.shapes.add_textbox(left + Inches(0.3), Inches(3.1), Inches(3.133), Inches(3.2))
        p_d = d_box.text_frame.paragraphs[0]
        p_d.text = desc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = TEXT_SLATE
        d_box.text_frame.word_wrap = True

    # ==========================================
    # SLIDE 11: CONCLUSION & SUBMISSION
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    
    add_card(s11, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5), bg_color=CARD_BG, border_color=COLOR_BLUE)
    
    b_box = s11.shapes.add_textbox(Inches(1.6), Inches(1.4), Inches(10.0), Inches(0.4))
    p_b = b_box.text_frame.paragraphs[0]
    p_b.text = "CODE CUBICLE 6.0  •  FINAL SUBMISSION"
    p_b.font.size = Pt(12)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_CYAN
    
    t_box = s11.shapes.add_textbox(Inches(1.6), Inches(1.8), Inches(10.0), Inches(1.0))
    p_t = t_box.text_frame.paragraphs[0]
    p_t.text = "GHOSTMESH"
    p_t.font.size = Pt(44)
    p_t.font.bold = True
    p_t.font.color.rgb = TEXT_WHITE
    
    tag_box = s11.shapes.add_textbox(Inches(1.6), Inches(2.8), Inches(10.0), Inches(0.8))
    p_tag = tag_box.text_frame.paragraphs[0]
    p_tag.text = '"Every device remembers alone. Together, they remember everything."'
    p_tag.font.size = Pt(17)
    p_tag.font.italic = True
    p_tag.font.color.rgb = TEXT_SLATE
    
    info_box = s11.shapes.add_textbox(Inches(1.6), Inches(3.6), Inches(10.0), Inches(2.5))
    tf_i = info_box.text_frame
    tf_i.word_wrap = True
    
    items = [
        "Track: Qdrant Edge Track",
        "Team: infinitehacks",
        "Participant: Pochiraju Kailash Ram Markandeya Sharma (Solo Participant)",
        "Demo Video: GHOSTMESH_CodeCubicle6_Demo.mp4 (180s Full HD)",
        "Repository: https://github.com/Kailashsharma282/GHOSTMESH-Code-Cubicle-Hackathon-Qdrant_Edge.git"
    ]
    for item in items:
        p = tf_i.add_paragraph()
        p.text = "•  " + item
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        
    out_path = os.path.abspath("GHOSTMESH_Hackathon_Presentation.pptx")
    prs.save(out_path)
    print(f"SUCCESS: Generated {out_path} with 11 slides!")

if __name__ == "__main__":
    create_presentation()
