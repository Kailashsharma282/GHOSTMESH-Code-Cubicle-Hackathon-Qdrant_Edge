"""
GhostMesh Seed Dataset
Narrative: "Shared Autonomous Robotics & Hardware Lab - Floor 3"
Provides 30+ structured memories per device (90+ total) with cross-node semantic duplicates,
factual contradictions (backpack location), privacy-sensitive records (passwords, biometrics, plates),
and environmental telemetry.
"""

from apps.api.models.schemas import MemoryType, PrivacyTier

DEVICE_A_MEMORIES = [
    # Charger story (Canonical merge candidate)
    ("USB-C charger placed on office desk.", MemoryType.OBSERVATION, 0.82, None),
    ("Anker 65W charging brick plugged into wall strip beside desk.", MemoryType.OBSERVATION, 0.89, None),
    ("Braided white USB-C cable running from power adapter to monitor stand.", MemoryType.OBSERVATION, 0.76, None),
    # Backpack story (Conflict test - chair vs floor)
    ("Blue backpack is on chair.", MemoryType.OBSERVATION, 0.85, None),
    ("Dark navy Herschel backpack resting on ergonomic mesh chair in Pod 2.", MemoryType.OBSERVATION, 0.90, None),
    # Laptop & Workstation
    ("Space gray MacBook Pro connected to Dell 32-inch 4K display.", MemoryType.OBSERVATION, 0.94, None),
    ("Mechanical keyboard with teal keycaps placed in front of MacBook.", MemoryType.OBSERVATION, 0.88, None),
    ("Logitech MX Master 3 mouse on gray felt desk pad.", MemoryType.OBSERVATION, 0.92, None),
    # Private / Quarantined items (LOCAL_ONLY)
    ("Hardware Lab master password for root terminal is 'delta-mesh-9921'.", MemoryType.NOTE, 0.99, None),
    ("Government passport and biometric badge scan stored in mobile secure vault.", MemoryType.NOTE, 0.98, None),
    ("Confidential client project proposal notes regarding autonomous inspection swarm.", MemoryType.NOTE, 0.95, None),
    ("Door PIN code 8492# entered at rear loading bay.", MemoryType.NOTE, 0.97, None),
    # Hardware & Tools
    ("Digital multimeter and soldering station powered on at Workbench 1.", MemoryType.OBSERVATION, 0.91, None),
    ("Spool of lead-free solder wire next to wire strippers.", MemoryType.OBSERVATION, 0.83, None),
    ("Component drawer #4 labeled 'Resistors 10k Ohm' left slightly open.", MemoryType.NOTE, 0.79, None),
    ("Arduino Mega microcontroller board connected to USB logic analyzer.", MemoryType.OBSERVATION, 0.93, None),
    ("Oscilloscope probing 50MHz SPI clock line on edge sensor breakout.", MemoryType.OBSERVATION, 0.89, None),
    # Common office items
    ("Kleen Kanteen stainless steel water bottle resting next to laptop stand.", MemoryType.OBSERVATION, 0.87, None),
    ("Ceramic coffee mug with 'Null Pointer' logo sitting on cork coaster.", MemoryType.OBSERVATION, 0.84, None),
    ("Bose noise-canceling headphones hanging on edge of monitor arm.", MemoryType.OBSERVATION, 0.91, None),
    ("Brass keychain with RFID fob and physical office key on corner of desk.", MemoryType.OBSERVATION, 0.86, None),
    ("Moleskine grid notebook open to system architecture diagram.", MemoryType.NOTE, 0.80, None),
    # Environment & Ambient
    ("Conference Room Alpha display showing Qdrant Edge sync metrics.", MemoryType.OBSERVATION, 0.92, None),
    ("Office ambient lighting dimmed to 60% for video call recording.", MemoryType.OBSERVATION, 0.85, PrivacyTier.PUBLIC_SYNC),
    ("Main HVAC set to cooling mode at 21 degrees Celsius.", MemoryType.OBSERVATION, 0.95, PrivacyTier.PUBLIC_SYNC),
    ("Whiteboard notes outline Lamport logical clock synchronization protocol.", MemoryType.NOTE, 0.89, None),
    ("Sticky note on monitor bezel: 'Firmware release cut at 18:00 UTC'.", MemoryType.NOTE, 0.88, None),
    ("Safety goggles placed in sanitization rack by the door.", MemoryType.OBSERVATION, 0.78, None),
    ("3D printer status: Layer 142/320 printing sensor mounting bracket.", MemoryType.OBSERVATION, 0.96, None),
    ("Filament spool PETG Black weighed at approximately 420 grams remaining.", MemoryType.NOTE, 0.82, None),
    ("First aid kit inspected and seal verified intact on west wall.", MemoryType.OBSERVATION, 0.90, None),
    ("Spare CAT6 Ethernet cables organized in cable bin 3.", MemoryType.OBSERVATION, 0.77, None)
]

DEVICE_B_MEMORIES = [
    # Charger story (Canonical merge candidate)
    ("Black charger near laptop.", MemoryType.OBSERVATION, 0.71, None),
    ("High-wattage USB power supply situated on work surface near computer.", MemoryType.OBSERVATION, 0.79, None),
    ("USB-C power lead connected to left Thunderbolt port of workstation.", MemoryType.OBSERVATION, 0.93, None),
    # Backpack story (Conflict test - chair vs floor)
    ("Blue backpack is on the floor.", MemoryType.OBSERVATION, 0.88, None),
    ("Navy backpack sitting upright on carpeted floor next to desk leg.", MemoryType.OBSERVATION, 0.84, None),
    # Workstation & Environment
    ("Apple MacBook Pro workstation running local Docker engine.", MemoryType.OBSERVATION, 0.95, None),
    ("External mechanical keyboard active on primary USB hub.", MemoryType.OBSERVATION, 0.89, None),
    ("Dual display arrangement detected with primary color profile calibrated.", MemoryType.OBSERVATION, 0.91, None),
    # Private / Quarantined items (LOCAL_ONLY)
    ("Private note: personal bank account routing details for payroll reimbursement.", MemoryType.NOTE, 0.99, None),
    ("Confidential employee performance review draft for sensor calibration team.", MemoryType.NOTE, 0.96, None),
    ("Restricted license plate number logged for executive parking stall 12.", MemoryType.NOTE, 0.94, None),
    # Hardware & Tools
    ("Logic analyzer session capture saved to local test directory.", MemoryType.OBSERVATION, 0.89, None),
    ("SMD rework heat gun cooling on safety stand at Workbench 1.", MemoryType.OBSERVATION, 0.86, None),
    ("Precision screwdriver kit with hex bits opened on assembly mat.", MemoryType.OBSERVATION, 0.81, None),
    ("Raspberry Pi 5 board running local embedded Qdrant benchmark.", MemoryType.OBSERVATION, 0.94, None),
    ("Thermal imaging camera recorded 42C peak temperature on voltage regulator.", MemoryType.OBSERVATION, 0.92, None),
    # Common office items
    ("Silver vacuum-insulated bottle positioned on desk edge.", MemoryType.OBSERVATION, 0.83, None),
    ("Espresso cup with small saucer placed beside mousepad.", MemoryType.OBSERVATION, 0.80, None),
    ("Over-ear black wireless headphones resting on desk soundbar.", MemoryType.OBSERVATION, 0.90, None),
    ("Metal ring with 3 brass keys left next to trackpad.", MemoryType.OBSERVATION, 0.85, None),
    ("Black rollerball pen capped and resting on closed engineering notebook.", MemoryType.NOTE, 0.75, None),
    # Ambient & System
    ("Conference room display mirror active on 10Gbps local subnet.", MemoryType.OBSERVATION, 0.88, None),
    ("Ambient room temperature sensor reads 21.8 degrees Celsius.", MemoryType.OBSERVATION, 0.96, PrivacyTier.PUBLIC_SYNC),
    ("Humidity levels measured at 44 percent in clean assembly zone.", MemoryType.OBSERVATION, 0.93, PrivacyTier.PUBLIC_SYNC),
    ("Architecture diagram snapshot: Edge shards sync to cloud via HTTP/2.", MemoryType.NOTE, 0.91, None),
    ("Release checklist marked: vector dimensional check verified.", MemoryType.NOTE, 0.89, None),
    ("Anti-static wrist strap clipped to grounding terminal at bench.", MemoryType.OBSERVATION, 0.92, None),
    ("3D printer enclosure fan running at low RPM.", MemoryType.OBSERVATION, 0.84, None),
    ("Bambu Lab X1 Carbon finish notification received for camera bracket.", MemoryType.OBSERVATION, 0.97, None),
    ("Emergency eye wash station clear of obstructions.", MemoryType.OBSERVATION, 0.89, None),
    ("Label maker tape roll replaced with 12mm black-on-white tape.", MemoryType.OBSERVATION, 0.78, None)
]

DEVICE_C_MEMORIES = [
    # Charger story (Canonical merge candidate)
    ("Charger placed beside MacBook.", MemoryType.OBSERVATION, 0.91, None),
    ("Compact AC power adapter resting on desk surface adjacent to laptop chassis.", MemoryType.OBSERVATION, 0.85, None),
    ("USB cable plugged into power delivery port on desk riser.", MemoryType.OBSERVATION, 0.80, None),
    # Backpack story (Conflict corroboration - near the chair)
    ("Blue backpack was seen near the chair.", MemoryType.OBSERVATION, 0.82, None),
    ("Fabric container identified as blue backpack in Pod 2 desk vicinity.", MemoryType.OBSERVATION, 0.86, None),
    # Workstation optical observations
    ("Laptop computer detected open on main office work table.", MemoryType.OBSERVATION, 0.96, None),
    ("Computer display active showing lines of code and terminal window.", MemoryType.OBSERVATION, 0.92, None),
    ("User desk area cleared with input peripherals aligned.", MemoryType.OBSERVATION, 0.87, None),
    # Optical Privacy / Sensitive detections (LOCAL_ONLY)
    ("Facial recognition camera detected visiting guest face at lobby threshold.", MemoryType.IMAGE, 0.99, None),
    ("License plate image captured at delivery vehicle bay 2.", MemoryType.IMAGE, 0.98, None),
    ("High-resolution camera capture of confidential whiteboard patent sketch.", MemoryType.IMAGE, 0.97, None),
    ("Private security badge barcode scanned during badge enrollment.", MemoryType.IMAGE, 0.96, None),
    # Lab Bench optical tracking
    ("Workbench 1 illuminated by overhead articulating task lamp.", MemoryType.OBSERVATION, 0.90, None),
    ("Soldering iron tip temperature indicator reads ready state.", MemoryType.OBSERVATION, 0.87, None),
    ("Safety goggles detected on worker entering fabrication area.", MemoryType.OBSERVATION, 0.94, None),
    ("Microcontroller test fixture clamped to anti-static work mat.", MemoryType.OBSERVATION, 0.91, None),
    ("Component reel holder loaded with 0805 surface-mount capacitors.", MemoryType.OBSERVATION, 0.83, None),
    # Object detections
    ("Metal drink container present on corner of desk surface.", MemoryType.OBSERVATION, 0.88, None),
    ("Hot beverage container placed safely away from electronics.", MemoryType.OBSERVATION, 0.82, None),
    ("Audio headset located on hook mount near workstation monitor.", MemoryType.OBSERVATION, 0.93, None),
    ("Small reflective metallic objects identified as key ring on desk.", MemoryType.OBSERVATION, 0.84, None),
    ("Bound paper notebook detected on workbench writing surface.", MemoryType.OBSERVATION, 0.81, None),
    # Facility & Environmental
    ("Conference room display active with presentation slides.", MemoryType.OBSERVATION, 0.91, None),
    ("Ceiling LED fixtures operating at standard 4000K color temperature.", MemoryType.OBSERVATION, 0.95, PrivacyTier.PUBLIC_SYNC),
    ("Air quality monitor shows PM2.5 at 4 micrograms per cubic meter.", MemoryType.OBSERVATION, 0.98, PrivacyTier.PUBLIC_SYNC),
    ("Diagram visible on conference room glass partition wall.", MemoryType.NOTE, 0.85, None),
    ("Notice posted on exit door: Building maintenance scheduled Friday 22:00.", MemoryType.NOTE, 0.90, None),
    ("Fire extinguisher pressure gauge indicates normal operational pressure.", MemoryType.OBSERVATION, 0.97, None),
    ("Rapid prototype 3D fabrication chamber door closed and sealed.", MemoryType.OBSERVATION, 0.93, None),
    ("Spool enclosure humidity indicator reads under 15 percent.", MemoryType.OBSERVATION, 0.91, None),
    ("Overhead safety shower inspection tag signed for current month.", MemoryType.OBSERVATION, 0.94, None),
    ("Storage bin rack inventory audit confirms cable bins organized.", MemoryType.OBSERVATION, 0.86, None)
]
