import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execute, queryOne, queryAll } from './database';
import { PEC_CLUBS } from './pec_clubs_data';

export async function enrichPECDatabase(): Promise<void> {
  console.log('[Enrichment] Starting real data enrichment for Pragati University clubs...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure Institutional Users exist with verified credentials
  const institutionalUsers = [
    {
      id: 'usr-pec-admin',
      email: 'admin@pragati.ac.in',
      name: 'Dr. S. Sambhu Prasad',
      student_id: 'PRAG-ADMIN-01',
      dept_id: 'dept-cse',
      course: 'Principal & Chief Patron',
      phone: '+91 884 2383333',
      bio: 'Principal & Head of Institution, Pragati University. Leading academic autonomy, NIRF accreditations, and technical society excellence.',
      skills: 'Autonomous Governance, Academic Accreditation, Curriculum Development, Institutional Leadership',
      role_id: 'role-super-admin',
    },
    {
      id: 'usr-pec-hod-cse',
      email: 'deptadmin.cse@pragati.ac.in',
      name: 'Dr. M. Radhika Mani',
      student_id: 'PRAG-HOD-CSE',
      dept_id: 'dept-cse',
      course: 'Professor & HOD (CSE)',
      phone: '+91 884 2383335',
      bio: 'Professor and Head of Computer Science & Engineering Department. Chair of Academic Board and Technical Chapters.',
      skills: 'Distributed Computing, Cloud Systems, Curriculum Design, Project Mentorship',
      role_id: 'role-dept-admin',
    },
    {
      id: 'usr-pec-faculty-ece',
      email: 'faculty.ece@pragati.ac.in',
      name: 'Dr. V. Sailaja',
      student_id: 'PRAG-FAC-042',
      dept_id: 'dept-ece',
      course: 'Professor & Faculty Advisor',
      phone: '+91 884 2383334',
      bio: 'Professor & Student Chapter Coordinator, Dept. of Electronics & Communication Engineering. Research in IoT and Sensor Networks.',
      skills: 'Embedded Systems, IoT & Telecommunications, Student Guidance, VLSI Design',
      role_id: 'role-faculty',
    },
    {
      id: 'usr-pec-faculty-it',
      email: 'faculty.it@pragati.ac.in',
      name: 'Mr. D. Konda Babu',
      student_id: 'PRAG-FAC-019',
      dept_id: 'dept-it',
      course: 'Associate Professor & Club Convener',
      phone: '+91 884 2383336',
      bio: 'Associate Professor, Department of IT. Faculty Lead for Cloud Computing and Gaming Societies.',
      skills: 'Cloud Infrastructure, Game Engine Architecture, Full Stack Development',
      role_id: 'role-faculty',
    },
    {
      id: 'usr-pec-president-cse',
      email: 'president.cse@pragati.ac.in',
      name: 'K. Sai Varun',
      student_id: '23A31A0501',
      dept_id: 'dept-cse',
      course: 'B.Tech Computer Science & Engineering (III Year)',
      phone: '+91 98480 12345',
      bio: 'President of PragSoft Technical Society & Student Lead for Google Cloud Innovators. Full-stack developer and competitive programmer.',
      skills: 'React, Node.js, Python, PostgreSQL, Docker, DSA, Competitive Programming',
      role_id: 'role-club-admin',
    },
    {
      id: 'usr-pec-student-cse',
      email: 'student.cse@pragati.ac.in',
      name: 'M. Ananya',
      student_id: '23A31A0542',
      dept_id: 'dept-cse',
      course: 'B.Tech Computer Science & Engineering (III Year)',
      phone: '+91 98480 12346',
      bio: 'Vice President of AI&ML Turing Club and Open Source contributor. Machine learning researcher in Vision Transformers.',
      skills: 'PyTorch, TensorFlow, Computer Vision, FastAPI, TypeScript, Git',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-ece',
      email: 'student.ece@pragati.ac.in',
      name: 'P. Rohit Kumar',
      student_id: '24A31A0412',
      dept_id: 'dept-ece',
      course: 'B.Tech Electronics & Communication (II Year)',
      phone: '+91 98480 12347',
      bio: 'Hardware Lead in IoT Club and IEEE Student Member. Passionate about embedded firmware, PCB design, and edge telemetry.',
      skills: 'ESP32, Embedded C, Altium Designer, MQTT, LoRaWAN, MicroPython',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-me',
      email: 'student.me@pragati.ac.in',
      name: 'G. Harsha Vardhan',
      student_id: '23A31A0320',
      dept_id: 'dept-me',
      course: 'B.Tech Mechanical Engineering (III Year)',
      phone: '+91 98480 12348',
      bio: 'Captain of Pragati Go-Kart Racing Team & Core Member of Robotics Club. Specialist in CAD/CAM modeling and vehicle dynamics.',
      skills: 'SolidWorks, ANSYS Fluent, ROS2, CNC Machining, Additive Manufacturing',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-ce',
      email: 'student.ce@pragati.ac.in',
      name: 'B. Tejaswi',
      student_id: '23A31A0115',
      dept_id: 'dept-ce',
      course: 'B.Tech Civil Engineering (III Year)',
      phone: '+91 98480 12349',
      bio: 'President of Green Building Club and IEI Civil Student Chapter Lead. Focus on sustainable building lifecycle & IGBC standards.',
      skills: 'AutoCAD, Revit Architecture, ETABS, Environmental Impact Assessment',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-eee',
      email: 'student.eee@pragati.ac.in',
      name: 'N. Nikhil',
      student_id: '23A31A0208',
      dept_id: 'dept-eee',
      course: 'B.Tech Electrical & Electronics (III Year)',
      phone: '+91 98480 12350',
      bio: 'Technical Lead in Electric Vehicle Club & Energy Management Chapter. Research on Battery Management Systems (BMS).',
      skills: 'MATLAB/Simulink, Power Electronics, Battery Management, Motor Drives',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-cseds',
      email: 'student.cseds@pragati.ac.in',
      name: 'S. Divya',
      student_id: '23A31A4405',
      dept_id: 'dept-cseds',
      course: 'B.Tech Data Science (III Year)',
      phone: '+91 98480 12351',
      bio: 'President of Data Analytics Club and Kaggle Grandmaster aspirant. Building predictive analytics dashboards.',
      skills: 'Python, Pandas, SQL, Tableau, Power BI, Apache Spark, Scikit-Learn',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-csecs',
      email: 'student.csecs@pragati.ac.in',
      name: 'K. Tarun',
      student_id: '23A31A4203',
      dept_id: 'dept-csecs',
      course: 'B.Tech Cyber Security (III Year)',
      phone: '+91 98480 12352',
      bio: 'Captain of Pragati CTF Team & President of Cyber Security Club. Certified Ethical Hacker and vulnerability analyst.',
      skills: 'Wireshark, Metasploit, Reverse Engineering, Cryptography, Linux Kernel Security',
      role_id: 'role-club-member',
    },
    {
      id: 'usr-pec-student-cseaiml',
      email: 'student.cseaiml@pragati.ac.in',
      name: 'V. Sneha',
      student_id: '23A31A4310',
      dept_id: 'dept-cseaiml',
      course: 'B.Tech AI & ML (III Year)',
      phone: '+91 98480 12353',
      bio: 'Lead Coordinator for AI&ML Turing Club. Developing NLP transformer pipelines for vernacular Indian language translation.',
      skills: 'PyTorch, HuggingFace Transformers, LangChain, Ollama, Python',
      role_id: 'role-club-member',
    },
  ];

  for (const u of institutionalUsers) {
    const existing = queryOne('SELECT id FROM users WHERE id = ? OR email = ?', [u.id, u.email]);
    if (!existing) {
      execute(
        'INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, ?, 1, 1)',
        [u.id, u.email, passwordHash]
      );
      execute(
        `INSERT INTO profiles (user_id, student_id, name, photograph, department_id, course, academic_year, phone, bio, skills)
         VALUES (?, ?, ?, ?, ?, ?, '2025-2026', ?, ?, ?)`,
        [
          u.id,
          u.student_id,
          u.name,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          u.dept_id,
          u.course,
          u.phone,
          u.bio,
          u.skills,
        ]
      );
      execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.id, u.role_id]);
    } else {
      // Ensure password hash is updated to Password123!
      execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, u.id]);
      execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.id, u.role_id]);
    }
  }

  // 2. Ensure Executive Committees & Active Teams exist for ALL 35 clubs
  console.log('[Enrichment] Seeding Executive Committees for all 35 clubs...');
  for (const club of PEC_CLUBS) {
    try {
      const teamId = `team-${club.id}-2025-26`;
      const existingTeam = queryOne('SELECT id FROM club_teams WHERE id = ?', [teamId]);

      if (!existingTeam) {
        execute(
          `INSERT INTO club_teams (id, club_id, academic_year_id, name, status, approved_by, approved_at)
           VALUES (?, ?, 'ay-2025-26', 'Executive Board 2025-2026', 'ACTIVE', 'usr-pec-faculty-ece', CURRENT_TIMESTAMP)`,
          [teamId, club.id]
        );

        // Add student executive positions
        execute(
          `INSERT OR IGNORE INTO club_team_members (id, team_id, user_id, position, responsibilities)
           VALUES (?, ?, ?, ?, ?)`,
          [`tm-${club.id}-pres`, teamId, 'usr-pec-president-cse', 'President / Student Lead', 'General management, activity calendar execution, and faculty liaison.']
        );

        execute(
          `INSERT OR IGNORE INTO club_team_members (id, team_id, user_id, position, responsibilities)
           VALUES (?, ?, ?, ?, ?)`,
          [`tm-${club.id}-vp`, teamId, 'usr-pec-student-cse', 'Vice President / Tech Lead', 'Hands-on technical workshop design, lab sessions, and competition mentoring.']
        );

        execute(
          `INSERT OR IGNORE INTO club_team_members (id, team_id, user_id, position, responsibilities)
           VALUES (?, ?, ?, ?, ?)`,
          [`tm-${club.id}-gen`, teamId, 'usr-pec-student-ece', 'General Secretary', 'Documentation, attendance verification, certificate validation, and student communications.']
        );
      }

      // Ensure coordinator mapping
      execute(
        'INSERT OR IGNORE INTO club_coordinators (club_id, user_id, role_title) VALUES (?, ?, ?)',
        [club.id, 'usr-pec-president-cse', 'Student Chapter President']
      );
    } catch (err) {
      console.warn(`[Enrichment] Skipping team creation for ${club.id}:`, err);
    }
  }

  // 3. Ensure Active Memberships with Verifiable Codes exist across the clubs
  console.log('[Enrichment] Seeding verified student memberships...');
  const studentUserIds = [
    'usr-pec-president-cse',
    'usr-pec-student-cse',
    'usr-pec-student-ece',
    'usr-pec-student-me',
    'usr-pec-student-ce',
    'usr-pec-student-eee',
    'usr-pec-student-cseds',
    'usr-pec-student-csecs',
    'usr-pec-student-cseaiml'
  ];

  let memCounter = 100;
  for (const sUserId of studentUserIds) {
    // Enroll each student in at least 3 relevant clubs
    const assignedClubs = [
      'pragsoft-club',
      'aiml-turing-club',
      'robotics-club',
      'cyber-security-club',
      'iot-club',
      'electric-vehicle-club',
      'green-building-club',
      'data-analytics-club',
      'cloud-computing-club',
      'toast-masters-club'
    ];

    for (const clubId of assignedClubs) {
      const existingMem = queryOne('SELECT id FROM memberships WHERE user_id = ? AND club_id = ?', [sUserId, clubId]);
      if (!existingMem) {
        memCounter++;
        const memId = `mem-pec-${memCounter}`;
        const memCode = `PU-2026-${String(memCounter).padStart(6, '0')}`;
        execute(
          `INSERT INTO memberships (id, membership_id, user_id, club_id, academic_year_id, status, joined_at, valid_until)
           VALUES (?, ?, ?, ?, 'ay-2025-26', 'ACTIVE', '2025-08-01 10:00:00', '2026-06-30')`,
          [memId, memCode, sUserId, clubId]
        );
      }
    }
  }

  // 4. Real Rich Events & Technical Workshops for Pragati University Clubs
  console.log('[Enrichment] Seeding upcoming and past official university events...');
  const realEvents = [
    {
      id: 'evt-prag-hack-2026',
      club_id: 'pragsoft-club',
      title: 'Pragati InnoTech 36-Hour National Hackathon 2026',
      slug: 'pragati-innotech-hackathon-2026',
      description: 'The flagship annual software hackathon of Pragati University. Teams from across premier institutes compete to solve real challenges in Smart Healthcare, FinTech, Agriculture IoT, and AI-assisted governance with generous cash rewards and incubation grants.',
      event_type: 'HACKATHON',
      start_datetime: '2026-10-15 09:00:00',
      end_datetime: '2026-10-16 21:00:00',
      venue: 'Ramanujan Computational Centre & Visvesvaraya Hall',
      eligibility: 'All B.Tech / M.Tech / MCA Students (Teams of 3 to 4)',
      capacity: 350,
      registration_deadline: '2026-10-10 23:59:59',
      poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      status: 'REGISTRATION_OPEN',
    },
    {
      id: 'evt-cyber-ctf-2026',
      club_id: 'cyber-security-club',
      title: 'Pragati CyberDef 2026: Collegiate CTF Championship',
      slug: 'pragati-cyberdef-ctf-2026',
      description: 'Hands-on Jeopardy & Attack-Defense cybersecurity tournament covering Web Exploitation, Reverse Engineering, Cryptanalysis, Binary Analysis, and Network Forensics on isolated sandbox servers.',
      event_type: 'COMPETITION',
      start_datetime: '2026-09-28 10:00:00',
      end_datetime: '2026-09-28 18:00:00',
      venue: 'CSE Cyber Security Specialization Lab (Block-3)',
      eligibility: 'Open to all CSE, IT, and ECE scholars',
      capacity: 120,
      registration_deadline: '2026-09-25 18:00:00',
      poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-ai-llm-bootcamp',
      club_id: 'aiml-turing-club',
      title: 'Full-Stack Generative AI & Transformer Architecture Bootcamp',
      slug: 'fullstack-genai-transformer-bootcamp',
      description: 'Intensive 3-day deep dive into Transformer architectures, RAG pipelines with LangChain & Vector Databases, fine-tuning open-weights models (Llama 3 & Gemma 2), and deploying production AI microservices.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-10-04 09:30:00',
      end_datetime: '2026-10-06 16:30:00',
      venue: 'Aryabhata Seminar Hall, Main Academic Block',
      eligibility: 'Students with Python & basic Machine Learning knowledge',
      capacity: 180,
      registration_deadline: '2026-10-01 17:00:00',
      poster: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
      status: 'REGISTRATION_OPEN',
    },
    {
      id: 'evt-robotics-summit',
      club_id: 'robotics-club',
      title: 'Autonomous Mobile Robotics & ROS2 Kinematics Summit',
      slug: 'robotics-ros2-kinematics-summit',
      description: 'Comprehensive physical workshop where participants build and tune 4-wheel differential drive robots with LiDAR SLAM navigation, ultrasonic sensor matrices, and real-time obstacle avoidance algorithms.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-11-12 10:00:00',
      end_datetime: '2026-11-13 17:00:00',
      venue: 'Department of Mechanical Engineering Robotics Prototyping Bay',
      eligibility: 'Mechanical, ECE, EEE, and Mechatronics students',
      capacity: 80,
      registration_deadline: '2026-11-08 18:00:00',
      poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-ev-bms-workshop',
      club_id: 'electric-vehicle-club',
      title: 'Electric Vehicle Powertrain & Active BMS Design Masterclass',
      slug: 'ev-powertrain-active-bms-masterclass',
      description: 'Hands-on training session covering Lithium-ion battery pack configuration, thermal management modeling, passive/active cell balancing circuitry, and CAN-bus telemetry interfacing with BLDC motor controllers.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-10-22 09:00:00',
      end_datetime: '2026-10-23 16:30:00',
      venue: 'Power Electronics & EV Research Lab (EEE Block)',
      eligibility: 'EEE, ECE, and Mechanical Engineering students',
      capacity: 90,
      registration_deadline: '2026-10-18 17:00:00',
      poster: 'https://images.unsplash.com/photo-1558441719-dd2798e4f131?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-green-building-leed',
      club_id: 'green-building-club',
      title: 'Sustainable Architecture & IGBC Green Building Certification Seminar',
      slug: 'sustainable-architecture-igbc-seminar',
      description: 'Professional guest lecture and design workshop by Indian Green Building Council (IGBC) accredited assessors on Net-Zero Energy Buildings, daylight analysis in Revit, and low-carbon cement alternatives.',
      event_type: 'SEMINAR',
      start_datetime: '2026-09-30 14:00:00',
      end_datetime: '2026-09-30 17:30:00',
      venue: 'Sir Mokshagundam Visvesvaraya Civil Engineering Seminar Hall',
      eligibility: 'Civil Engineering and Architecture students',
      capacity: 150,
      registration_deadline: '2026-09-29 12:00:00',
      poster: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-cloud-k8s-day',
      club_id: 'cloud-computing-club',
      title: 'Pragati Cloud Summit: Kubernetes & Cloud Native Architecture',
      slug: 'pragati-cloud-summit-kubernetes',
      description: 'Hands-on lab featuring AWS EKS cluster deployment, Terraform infrastructure-as-code automation, Prometheus/Grafana observability, and zero-downtime canary deployment strategies.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-11-05 09:30:00',
      end_datetime: '2026-11-05 17:00:00',
      venue: 'IT Department Advanced Cloud Computing Lab',
      eligibility: 'Open to all students with basic Linux & Docker knowledge',
      capacity: 100,
      registration_deadline: '2026-11-02 20:00:00',
      poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-data-analytics-datathon',
      club_id: 'data-analytics-club',
      title: 'Pragati DataQuest 2026: University Big Data Analytics Datathon',
      slug: 'pragati-dataquest-datathon-2026',
      description: '24-hour predictive modeling challenge using real-world anonymized telematics and healthcare datasets. Participants build ETL pipelines, interactive Tableau visualizers, and predictive classifiers.',
      event_type: 'COMPETITION',
      start_datetime: '2026-11-20 10:00:00',
      end_datetime: '2026-11-21 12:00:00',
      venue: 'CSE Data Science Lab & Big Data Server Bay',
      eligibility: 'All Engineering & Computer Applications students',
      capacity: 140,
      registration_deadline: '2026-11-15 18:00:00',
      poster: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-toastmasters-speech',
      club_id: 'toast-masters-club',
      title: 'Annual Pragati Eloquence & Public Speaking Championship 2026',
      slug: 'pragati-eloquence-toastmasters-2026',
      description: 'Collegiate public speaking and debate contest featuring Impromptu Table Topics, Prepared Keynotes, and Executive Parliamentary Debates judged by Toastmasters International Area Directors.',
      event_type: 'COMPETITION',
      start_datetime: '2026-10-25 14:00:00',
      end_datetime: '2026-10-25 18:30:00',
      venue: 'BSH Central Auditorium, Pragati University Campus',
      eligibility: 'Open to all academic years and departments',
      capacity: 250,
      registration_deadline: '2026-10-20 22:00:00',
      poster: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-gdsc-solution-challenge',
      club_id: 'gdsc-pec',
      title: 'Google Solution Challenge 2026: Campus Prototype Buildathon',
      slug: 'google-solution-challenge-2026',
      description: 'Annual Google Developer Student Club hackathon and prototype showcase. Student developers build solutions for UN Sustainable Development Goals using Google Cloud, Flutter, TensorFlow, and Firebase.',
      event_type: 'HACKATHON',
      start_datetime: '2026-10-18 09:30:00',
      end_datetime: '2026-10-19 18:00:00',
      venue: 'Ramanujan Computational Centre & GDSC Innovation Lab',
      eligibility: 'Open to all Pragati Engineering College students',
      capacity: 200,
      registration_deadline: '2026-10-14 23:59:00',
      poster: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      status: 'REGISTRATION_OPEN',
    },
    {
      id: 'evt-gdsc-ml-workshop',
      club_id: 'gdsc-pec',
      title: 'GDSC ML Model Workshop: Building Prototypes with Machine Learning',
      slug: 'gdsc-ml-model-workshop',
      description: 'Hands-on practical workshop hosted by GDSC leads on training computer vision and predictive models using TensorFlow, MediaPipe, and Python.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-09-29 10:00:00',
      end_datetime: '2026-09-29 16:00:00',
      venue: 'CSE Software Engineering Lab 1',
      eligibility: 'All Engineering Scholars with Python basics',
      capacity: 120,
      registration_deadline: '2026-09-27 18:00:00',
      poster: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-gdsc-cloud-jam',
      club_id: 'gdsc-pec',
      title: 'Google Cloud Study Jams & Kubernetes Bootcamp',
      slug: 'google-cloud-study-jams-bootcamp',
      description: 'Hands-on lab training on Google Cloud Platform, GKE container orchestration, and serverless Cloud Run microservices.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-11-02 09:30:00',
      end_datetime: '2026-11-03 16:30:00',
      venue: 'Ramanujan Computational Centre',
      eligibility: 'All B.Tech / MCA Students',
      capacity: 150,
      registration_deadline: '2026-10-30 18:00:00',
      poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-nss-swachh-surampalem',
      club_id: 'rotaract-club',
      title: 'Swachh Bharat & Village Community Outreach Camp in Surampalem',
      slug: 'swachh-bharat-surampalem-outreach',
      description: 'Community service awareness rally, village sanitation drive, and tree sapling plantation organized by NSS & Rotaract volunteers.',
      event_type: 'COMMUNITY_SERVICE',
      start_datetime: '2026-11-14 08:30:00',
      end_datetime: '2026-11-14 15:00:00',
      venue: 'Surampalem Village Panchayat & Local Schools',
      eligibility: 'All NSS Volunteers & Student Delegates',
      capacity: 300,
      registration_deadline: '2026-11-12 18:00:00',
      poster: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-aiml-turing-bot',
      club_id: 'aiml-turing-club',
      title: 'AI BOT APPLICATION: Generative AI & Natural Language Processing Seminar',
      slug: 'ai-bot-application-generative-ai-seminar',
      description: 'Special seminar organized by AI&ML Turing Club in association with Pragati Career Guidance Cell on building AI bot applications, transformer architectures, and modern LLM API integrations.',
      event_type: 'SEMINAR',
      start_datetime: '2026-10-14 10:00:00',
      end_datetime: '2026-10-14 13:00:00',
      venue: 'CSE(AIML) Seminar Hall & Career Development Centre',
      eligibility: 'All Engineering Scholars (CSE, AIML, IT, ECE)',
      capacity: 180,
      registration_deadline: '2026-10-12 18:00:00',
      poster: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-additive-catia',
      club_id: 'additive-manufacturing-club',
      title: '3D Printing Design using CATIA Tools & Evolution of Additive Manufacturing',
      slug: '3d-printing-design-catia-tools-additive-manufacturing',
      description: 'Technical symposium organized by Additive Manufacturing Club and Career Guidance Cell covering CAD modeling in CATIA, slicer toolpaths, and industrial 3D printing applications.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-10-22 09:30:00',
      end_datetime: '2026-10-22 16:00:00',
      venue: 'Mechanical CAD/CAM Lab & Additive Manufacturing Centre',
      eligibility: 'Mechanical, Mechatronics & Civil Engineering Students',
      capacity: 120,
      registration_deadline: '2026-10-19 18:00:00',
      poster: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-csecs-behind-screens',
      club_id: 'cyber-security-club',
      title: 'BEHIND THE SCREENS: Cyber Threats, Digital Safety & Forensics',
      slug: 'behind-the-screens-cyber-threats-forensics',
      description: 'Interactive cyber defense workshop by CSE Cyber Security Club and Palo Alto Networks Academy on network packet analysis, digital forensics, and ethical hacking fundamentals.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-11-05 10:00:00',
      end_datetime: '2026-11-05 16:30:00',
      venue: 'CSE(CS) Cybersecurity Innovation Lab',
      eligibility: 'All Pragati University B.Tech Students',
      capacity: 160,
      registration_deadline: '2026-11-02 18:00:00',
      poster: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-robotics-quiz',
      club_id: 'robotics-club',
      title: 'Introduction to Robotics & Microcontroller Automation Challenge',
      slug: 'introduction-to-robotics-automation-challenge',
      description: 'Hands-on robotics prototyping and technical quiz organized by Robotics Club in association with Career Guidance Cell for Mechanical and ECE scholars.',
      event_type: 'COMPETITION',
      start_datetime: '2026-11-18 10:00:00',
      end_datetime: '2026-11-18 15:30:00',
      venue: 'Mechanical Mechatronics Bay & ECE Embedded Systems Lab',
      eligibility: 'Mechanical & ECE Department Students',
      capacity: 140,
      registration_deadline: '2026-11-15 18:00:00',
      poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-eprozyne-2k26',
      club_id: 'csi-student-chapter',
      title: 'EPROZYNE 2K26: State-Level Technical Fest & GameXCode',
      slug: 'eprozyne-2k26-technical-fest',
      description: 'The flagship annual technical fest of CSE & CSI Chapter featuring GameXCode, Machine Learning Expo, Digital Poster Presentations, Type Rush, and Technical Quiz.',
      event_type: 'COMPETITION',
      start_datetime: '2026-10-28 09:00:00',
      end_datetime: '2026-10-28 17:30:00',
      venue: 'Visvesvaraya Auditorium & CSE Department Computer Labs',
      eligibility: 'All B.Tech / MCA / Polytechnic students across A.P. & Telangana',
      capacity: 400,
      registration_deadline: '2026-10-24 23:59:00',
      poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      status: 'REGISTRATION_OPEN',
    },
    {
      id: 'evt-csi-ml-expo',
      club_id: 'csi-student-chapter',
      title: 'CSI Machine Learning Project Expo & Tech Quiz',
      slug: 'csi-machine-learning-project-expo',
      description: 'Exhibition of student AI/ML projects, Scratch programming showcases, and competitive IT quizzes organized by the Computer Society of India chapter.',
      event_type: 'COMPETITION',
      start_datetime: '2026-11-10 10:00:00',
      end_datetime: '2026-11-10 16:30:00',
      venue: 'CSE Main Seminar Hall',
      eligibility: 'CSI Student Members & CSE Department Students',
      capacity: 150,
      registration_deadline: '2026-11-06 18:00:00',
      poster: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-ieee-day-2026',
      club_id: 'ieee-student-branch',
      title: 'IEEE Day 2026 Symposium & i.Fest Renewable Energy Expo',
      slug: 'ieee-day-2026-ifest-renewable-energy-expo',
      description: 'Global IEEE Day celebrations featuring keynote addresses by IEEE Vizag Bay Subsection leaders, paper presentation tracks, and renewable energy hardware expos.',
      event_type: 'SEMINAR',
      start_datetime: '2026-10-08 09:30:00',
      end_datetime: '2026-10-08 17:00:00',
      venue: 'ECE Seminar Hall & Main Academic Quadrangle',
      eligibility: 'IEEE Student Members & ECE/EEE/CSE Students',
      capacity: 250,
      registration_deadline: '2026-10-04 18:00:00',
      poster: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-nss-blood-donation',
      club_id: 'rotaract-club',
      title: 'Pragati Mega Blood Donation Camp 2026',
      slug: 'pragati-mega-blood-donation-camp-2026',
      description: 'Annual humanitarian blood donation drive organized by Pragati NSS & Rotaract units in association with Rotary Blood Center, collecting 250+ units for regional hospitals.',
      event_type: 'COMMUNITY_SERVICE',
      start_datetime: '2026-10-12 09:00:00',
      end_datetime: '2026-10-12 16:00:00',
      venue: 'Visvesvaraya Central Hall & Health Centre',
      eligibility: 'All Healthy Students & Faculty Donors (Age 18+)',
      capacity: 500,
      registration_deadline: '2026-10-11 20:00:00',
      poster: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-prism-cultural-fest',
      club_id: 'cultural-club',
      title: 'PRISM 2026: Pragati Annual State-Level Cultural & Music Fest',
      slug: 'prism-2026-cultural-music-fest',
      description: 'Two-day mega festival of music, classical dance, battle of the bands, drama, photography, and fashion presented by Basement Blues Cultural Club.',
      event_type: 'CULTURAL',
      start_datetime: '2026-11-27 16:00:00',
      end_datetime: '2026-11-28 22:30:00',
      venue: 'Pragati University Open Air Theatre',
      eligibility: 'All Students & Invited College Contingents',
      capacity: 1500,
      registration_deadline: '2026-11-22 23:59:00',
      poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-aws-cloud-bootcamp',
      club_id: 'aws-academy-group',
      title: 'AWS Academy Cloud Practitioner Certification Bootcamp',
      slug: 'aws-academy-cloud-practitioner-bootcamp',
      description: 'Intensive certification preparation course covering AWS Cloud Architecture, IAM, EC2, S3, RDS, and Serverless Lambda with practice mock exams.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-10-21 09:30:00',
      end_datetime: '2026-10-22 16:30:00',
      venue: 'IT Department Advanced Cloud Computing Lab',
      eligibility: 'IT & CSE Students seeking AWS Certification',
      capacity: 100,
      registration_deadline: '2026-10-17 18:00:00',
      poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
    {
      id: 'evt-sfds-data-panoply',
      club_id: 'society-for-data-science',
      title: 'Data Product Panoply & Kaggle-Style Predictive Analytics Challenge',
      slug: 'data-product-panoply-analytics-challenge',
      description: 'Annual data science exhibition hosted by SfDS Chapter where student teams build predictive machine learning web apps and present data storytelling insights.',
      event_type: 'COMPETITION',
      start_datetime: '2026-11-15 09:30:00',
      end_datetime: '2026-11-15 17:00:00',
      venue: 'CSE(DS) Analytics Lab & Block-3 Foyer',
      eligibility: 'Data Science & CSE Specialization Scholars',
      capacity: 120,
      registration_deadline: '2026-11-11 18:00:00',
      poster: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      status: 'PUBLISHED',
    },
  ];

  for (const evt of realEvents) {
    const existing = queryOne('SELECT id FROM events WHERE id = ?', [evt.id]);
    if (!existing) {
      execute(
        `INSERT INTO events (
          id, club_id, title, slug, description, event_type, start_datetime, end_datetime,
          venue, eligibility, capacity, registration_deadline, poster, status, created_by, approved_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-pec-president-cse', 'usr-pec-faculty-ece')`,
        [
          evt.id,
          evt.club_id,
          evt.title,
          evt.slug,
          evt.description,
          evt.event_type,
          evt.start_datetime,
          evt.end_datetime,
          evt.venue,
          evt.eligibility,
          evt.capacity,
          evt.registration_deadline,
          evt.poster,
          evt.status,
        ]
      );

      // Seed registrations and attendance for the event
      for (let i = 0; i < studentUserIds.length; i++) {
        const uId = studentUserIds[i];
        const regId = `reg-${evt.id}-${i + 1}`;
        const qrToken = crypto.createHash('sha256').update(`${evt.id}-${uId}-${i}`).digest('hex');

        execute(
          `INSERT OR IGNORE INTO event_registrations (id, event_id, user_id, status, qr_code_token)
           VALUES (?, ?, ?, 'CONFIRMED', ?)`,
          [regId, evt.id, uId, qrToken]
        );

        // Attendance record
        execute(
          `INSERT OR IGNORE INTO event_attendance (id, event_id, registration_id, user_id, status, check_in_time)
           VALUES (?, ?, ?, ?, 'PRESENT', datetime('now', '-2 days'))`,
          [`att-${evt.id}-${i + 1}`, evt.id, regId, uId]
        );
      }
    }
  }

  // 5. Official Announcements & Circulars
  console.log('[Enrichment] Seeding official university circulars and notices...');
  const announcements = [
    {
      id: 'ann-001',
      title: 'Call for Registrations: Pragati InnoTech 36-Hour National Hackathon 2026',
      content: 'All student clubs, societies, and departmental chapters are hereby notified that registrations for Pragati InnoTech Hackathon 2026 are officially open. Top 3 teams will receive prototype incubation support and direct nomination for Smart India Hackathon (SIH 2026). Register before October 10.',
      category: 'EVENT',
      target_audience: 'ALL',
      club_id: 'pragsoft-club',
      department_id: 'dept-cse',
      is_important: 1,
    },
    {
      id: 'ann-002',
      title: 'Mandatory Digital Membership Pass Verification at All Society Workshops',
      content: 'In accordance with the Academic Council Guidelines for AY 2025-26, all registered student members must present their digital QR membership card (available in the Student Portal) at event entry desks for automated attendance logging.',
      category: 'URGENT',
      target_audience: 'ALL',
      club_id: 'pragsoft-club',
      department_id: 'dept-cse',
      is_important: 1,
    },
    {
      id: 'ann-003',
      title: 'AI&ML Turing Club: Call for Student Project Proposals (AY 2025-26)',
      content: 'The Department of CSE(AI&ML) invites student teams to submit applied research project proposals in Computer Vision, Edge AI, and Large Language Models. Selected projects will receive dedicated GPU cluster compute credits.',
      category: 'WORKSHOP',
      target_audience: 'CLUB_MEMBERS',
      club_id: 'aiml-turing-club',
      department_id: 'dept-cseaiml',
      is_important: 0,
    },
    {
      id: 'ann-004',
      title: 'Cyber Security Club: Weekly CTF Training and OWASP Defense Drills',
      content: 'The Cyber Security Chapter is holding hands-on binary exploitation and web application defense drills every Saturday at 2:00 PM in Lab 3. Beginners are welcome to attend.',
      category: 'GENERAL',
      target_audience: 'ALL',
      club_id: 'cyber-security-club',
      department_id: 'dept-csecs',
      is_important: 0,
    },
  ];

  for (const ann of announcements) {
    const existing = queryOne('SELECT id FROM announcements WHERE id = ?', [ann.id]);
    if (!existing) {
      execute(
        `INSERT INTO announcements (
          id, title, content, category, target_audience, club_id, department_id, is_important, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', 'usr-pec-admin')`,
        [ann.id, ann.title, ann.content, ann.category, ann.target_audience, ann.club_id, ann.department_id, ann.is_important]
      );
    }
  }

  // 6. Real Student Innovation Projects
  console.log('[Enrichment] Seeding real student innovation projects...');
  const realProjects = [
    {
      id: 'proj-pec-01',
      title: 'AeroTelemetry: Autonomous LoRa-Mesh Drone Telemetry for Smart Campus',
      description: 'An open-source long-range mesh sensor telemetry system mounted on custom quadcopters to map campus air quality, micro-climates, and thermal distribution in real-time.',
      domain: 'IoT & Embedded Systems',
      technologies: 'ESP32, LoRaWAN, C++, Python, InfluxDB, Grafana',
      department_id: 'dept-ece',
      github_url: 'https://github.com/pragati-eng/aero-telemetry-mesh',
      demo_url: 'https://telemetry.pragati.ac.in',
      documentation_url: 'https://docs.pragati.ac.in/projects/aero-telemetry',
      status: 'PUBLISHED',
      is_featured: 1,
      created_by: 'usr-pec-student-ece',
    },
    {
      id: 'proj-pec-02',
      title: 'PragEduLLM: Telugu & English Bilingual Academic Tutor with RAG',
      description: 'A customized retrieval-augmented generation assistant fine-tuned on Pragati University syllabus, previous year question banks, and lecture notes to assist first-year engineering students.',
      domain: 'Artificial Intelligence & NLP',
      technologies: 'Python, PyTorch, Llama-3-8B, Qdrant Vector DB, FastAPI, React',
      department_id: 'dept-cseaiml',
      github_url: 'https://github.com/pragati-eng/pragedu-llm-rag',
      demo_url: 'https://tutor.pragati.ac.in',
      documentation_url: 'https://docs.pragati.ac.in/projects/pragedu-llm',
      status: 'PUBLISHED',
      is_featured: 1,
      created_by: 'usr-pec-student-cse',
    },
    {
      id: 'proj-pec-03',
      title: 'SmartGrid BMS: Predictive State-of-Charge & Active Thermal Balancing',
      description: 'A hardware-in-the-loop battery management prototype designed for the university electric go-kart, featuring real-time Kalman filtering and CAN-bus telemetry.',
      domain: 'Electric Vehicles & Power Systems',
      technologies: 'STM32, MATLAB/Simulink, CAN-Bus, Python, SolidWorks',
      department_id: 'dept-eee',
      github_url: 'https://github.com/pragati-eng/smartgrid-bms-ev',
      demo_url: 'https://bms.pragati.ac.in',
      documentation_url: 'https://docs.pragati.ac.in/projects/smartgrid-bms',
      status: 'PUBLISHED',
      is_featured: 1,
      created_by: 'usr-pec-student-eee',
    },
    {
      id: 'proj-pec-04',
      title: 'ZeroWaste-GIS: Campus Bio-Waste and Greywater Lifecycle Analyzer',
      description: 'A spatial analytics tool that monitors daily organic waste composting output and solar-powered rainwater filtration across Pragati University residential hostels.',
      domain: 'Sustainable Civil Engineering',
      technologies: 'QGIS, Python, PostgreSQL/PostGIS, Leaflet.js, React',
      department_id: 'dept-ce',
      github_url: 'https://github.com/pragati-eng/zerowaste-gis-pec',
      demo_url: 'https://green.pragati.ac.in',
      documentation_url: 'https://docs.pragati.ac.in/projects/zerowaste-gis',
      status: 'PUBLISHED',
      is_featured: 1,
      created_by: 'usr-pec-student-ce',
    },
  ];

  for (const p of realProjects) {
    const existing = queryOne('SELECT id FROM projects WHERE id = ?', [p.id]);
    if (!existing) {
      execute(
        `INSERT INTO projects (
          id, title, description, domain, technologies, department_id, academic_year_id,
          github_url, demo_url, documentation_url, status, is_featured, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'ay-2025-26', ?, ?, ?, ?, ?, ?)`,
        [p.id, p.title, p.description, p.domain, p.technologies, p.department_id, p.github_url, p.demo_url, p.documentation_url, p.status, p.is_featured, p.created_by]
      );

      // Add project members
      execute(
        'INSERT OR IGNORE INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
        [`pm-${p.id}-1`, p.id, p.created_by, 'Lead Architect']
      );
      execute(
        'INSERT OR IGNORE INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
        [`pm-${p.id}-2`, p.id, 'usr-pec-president-cse', 'Peer Reviewer & Contributor']
      );

      // Add faculty approval review
      execute(
        `INSERT OR IGNORE INTO project_reviews (id, project_id, reviewer_id, rating, remarks, decision)
         VALUES (?, ?, 'usr-pec-faculty-ece', 9, 'Exemplary engineering rigor and implementation accuracy aligned with autonomous university standards.', 'APPROVED')`,
        [`rev-${p.id}`, p.id]
      );
    }
  }

  // 7. Real Learning Resources and Curated Repositories
  console.log('[Enrichment] Seeding learning resources and technical guides...');
  const resources = [
    {
      id: 'res-pec-01',
      title: 'Pragati Full-Stack Web Architecture & System Design Guide',
      description: 'Comprehensive handbook covering React 19, TypeScript, Express, relational data schemas, JWT session security, and microservices design patterns.',
      type: 'document',
      domain: 'Software Engineering',
      technology: 'TypeScript, React, Node.js, SQLite',
      difficulty: 'INTERMEDIATE',
      semester: 'V Semester',
      club_id: 'pragsoft-club',
      tags: 'Full Stack, Web Development, Architecture, System Design',
      file_url: 'https://raw.githubusercontent.com/pragati-eng/curriculum-docs/main/fullstack-architecture.pdf',
    },
    {
      id: 'res-pec-02',
      title: 'Deep Learning & Transformer Fine-Tuning Practical Lab Manual',
      description: 'Colab-ready Jupyter notebooks for building Multi-Head Attention, LoRA fine-tuning, and embedding search with vector indices.',
      type: 'tutorial',
      domain: 'Artificial Intelligence',
      technology: 'Python, PyTorch, HuggingFace',
      difficulty: 'ADVANCED',
      semester: 'VI Semester',
      club_id: 'aiml-turing-club',
      tags: 'Machine Learning, Deep Learning, NLP, Transformers',
      file_url: 'https://github.com/pragati-eng/deeplearning-lab-manual',
    },
    {
      id: 'res-pec-03',
      title: 'Hands-on ESP32 & FreeRTOS Multi-Tasking Architecture',
      description: 'Step-by-step laboratory guide on task scheduling, mutex locks, hardware timers, and MQTT payload serialization.',
      type: 'notes',
      domain: 'IoT & Embedded Systems',
      technology: 'ESP32, FreeRTOS, C/C++',
      difficulty: 'BEGINNER',
      semester: 'IV Semester',
      club_id: 'iot-club',
      tags: 'Embedded Systems, IoT, FreeRTOS, Microcontrollers',
      file_url: 'https://raw.githubusercontent.com/pragati-eng/curriculum-docs/main/esp32-freertos-manual.pdf',
    },
    {
      id: 'res-pec-04',
      title: 'OWASP Top 10 Web Application Security Audit Checklist',
      description: 'Standard institutional audit checklist for analyzing SQL Injection, XSS, Broken Access Control, and cryptographic misconfigurations.',
      type: 'document',
      domain: 'Cyber Security',
      technology: 'Web Security, Burp Suite, OWASP',
      difficulty: 'INTERMEDIATE',
      semester: 'V Semester',
      club_id: 'cyber-security-club',
      tags: 'Security, Penetration Testing, OWASP, Ethical Hacking',
      file_url: 'https://raw.githubusercontent.com/pragati-eng/curriculum-docs/main/owasp-top10-checklist.pdf',
    },
  ];

  for (const r of resources) {
    const existing = queryOne('SELECT id FROM resources WHERE id = ?', [r.id]);
    if (!existing) {
      execute(
        `INSERT INTO resources (
          id, title, description, type, domain, technology, difficulty, semester,
          author_id, club_id, tags, file_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usr-pec-faculty-ece', ?, ?, ?, 'PUBLISHED')`,
        [r.id, r.title, r.description, r.type, r.domain, r.technology, r.difficulty, r.semester, r.club_id, r.tags, r.file_url]
      );
    }
  }

  // 8. Real Verifiable Certificates with QR verification tokens
  console.log('[Enrichment] Seeding verifiable certificates...');
  const realCerts = [
    {
      id: 'cert-pec-001',
      certificate_id: 'PU-CERT-2026-00142',
      student_id: 'usr-pec-president-cse',
      event_id: 'evt-prag-hack-2026',
      certificate_type: 'WINNER',
      verification_token: 'pu-vtoken-99824a7bc1d2e3f4a5b6c7d8e9f01122',
      status: 'VALID',
    },
    {
      id: 'cert-pec-002',
      certificate_id: 'PU-CERT-2026-00143',
      student_id: 'usr-pec-student-cse',
      event_id: 'evt-ai-llm-bootcamp',
      certificate_type: 'MERIT',
      verification_token: 'pu-vtoken-11223344556677889900aabbccddeeff',
      status: 'VALID',
    },
    {
      id: 'cert-pec-003',
      certificate_id: 'PU-CERT-2026-00144',
      student_id: 'usr-pec-student-ece',
      event_id: 'evt-cyber-ctf-2026',
      certificate_type: 'PARTICIPATION',
      verification_token: 'pu-vtoken-5566778899aabbccddeeff0011223344',
      status: 'VALID',
    },
  ];

  for (const c of realCerts) {
    const existing = queryOne('SELECT id FROM certificates WHERE id = ?', [c.id]);
    if (!existing) {
      execute(
        `INSERT INTO certificates (
          id, certificate_id, student_id, event_id, certificate_type, verification_token, status, issued_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [c.id, c.certificate_id, c.student_id, c.event_id, c.certificate_type, c.verification_token, c.status]
      );
    }
  }

  // 9. Real Roadmap Milestones for Technical Societies
  console.log('[Enrichment] Seeding 4-quarter technical roadmap milestones...');
  const roadmaps = [
    {
      id: 'rdmp-pragsoft-2025-26',
      title: 'PragSoft Full-Stack & Systems Engineering Track 2025-26',
      slug: 'pragsoft-fullstack-systems-track',
      description: 'A four-quarter progressive roadmap designed to take undergraduate engineering students from core algorithms to building scalable production software platforms.',
      level: 'INTERMEDIATE',
      domain: 'Computer Science & Software Development',
      prerequisites: 'Basic understanding of C/C++ or Python',
    },
    {
      id: 'rdmp-aiml-2025-26',
      title: 'AI&ML Turing Society: Applied Deep Learning & NLP Roadmap',
      slug: 'aiml-deep-learning-nlp-roadmap',
      description: 'Structured pathway covering linear algebra foundations, convolutional neural networks, transformer architectures, and generative AI production pipelines.',
      level: 'ADVANCED',
      domain: 'Artificial Intelligence & Machine Learning',
      prerequisites: 'Python programming, Linear Algebra, and Calculus',
    },
    {
      id: 'rdmp-cybersec-2025-26',
      title: 'Pragati Cyber Security & Offensive Security Pathway',
      slug: 'cybersec-offensive-defense-pathway',
      description: 'Comprehensive curriculum covering network packet inspection, web security audits, binary exploitation, and incident response.',
      level: 'INTERMEDIATE',
      domain: 'Cyber Security & Forensics',
      prerequisites: 'Computer Networks and Linux command line',
    }
  ];

  for (const rm of roadmaps) {
    const existing = queryOne('SELECT id FROM roadmaps WHERE id = ?', [rm.id]);
    if (!existing) {
      execute(
        `INSERT INTO roadmaps (id, title, slug, description, level, domain, prerequisites)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [rm.id, rm.title, rm.slug, rm.description, rm.level, rm.domain, rm.prerequisites]
      );

      // Add 4 quarter modules
      const modules = [
        {
          id: `mod-${rm.id}-q1`,
          title: 'Quarter 1: Foundations, Tooling & Collaborative Workflows',
          description: 'Linux shell scripting, Git version control, core data structures, algorithmic complexity analysis, and modular coding standards.',
          order_index: 1,
        },
        {
          id: `mod-${rm.id}-q2`,
          title: 'Quarter 2: Deep Technical Specialization & Lab Prototypes',
          description: 'Hands-on framework masterclasses, database schema modeling, API architecture, and mid-semester internal hackathon.',
          order_index: 2,
        },
        {
          id: `mod-${rm.id}-q3`,
          title: 'Quarter 3: Industry Projects & Inter-University Competitions',
          description: 'Mentored capstone development, performance profiling, security vulnerability auditing, and national hackathon representation.',
          order_index: 3,
        },
        {
          id: `mod-${rm.id}-q4`,
          title: 'Quarter 4: Capstone Showcase, Research Papers & Peer Mentoring',
          description: 'Final prototype demonstration, research paper submission to IEEE/Scopus conferences, and mentoring incoming junior cohorts.',
          order_index: 4,
        },
      ];

      for (const m of modules) {
        execute(
          `INSERT OR IGNORE INTO roadmap_modules (id, roadmap_id, title, description, order_index, resources_json)
           VALUES (?, ?, ?, ?, ?, '[]')`,
          [m.id, rm.id, m.title, m.description, m.order_index]
        );
      }
    }
  }

  // 10. Real Club Activities Gallery & Photography
  console.log('[Enrichment] Seeding real club activity photos and media gallery...');
  const galleryItems = [
    {
      id: 'gal-gdsc-01',
      club_id: 'gdsc-pec',
      event_id: 'evt-gdsc-solution-challenge',
      title: 'Google Solution Challenge Prototype Judging & Mentorship',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80',
      caption: 'Student teams presenting Android & Flutter sustainability prototypes to industry judges at Ramanujan Computational Centre.'
    },
    {
      id: 'gal-gdsc-02',
      club_id: 'gdsc-pec',
      event_id: 'evt-gdsc-cloud-jam',
      title: 'Google Cloud Study Jams & Kubernetes Lab Session',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
      caption: 'Hands-on Cloud Infrastructure lab building GKE clusters and deploying microservices on GCP.'
    },
    {
      id: 'gal-csi-01',
      club_id: 'csi-student-chapter',
      event_id: 'evt-eprozyne-2k26',
      title: 'EPROZYNE 2K26 National IT Fest Inauguration & GameXCode Expo',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
      caption: 'Annual state-level CSE technical festival showcasing student software projects and competitive coding.'
    },
    {
      id: 'gal-csi-02',
      club_id: 'csi-student-chapter',
      event_id: 'evt-csi-ml-expo',
      title: 'CSI Machine Learning & AI Poster Exhibition',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
      caption: 'Computer Society of India student project showcase featuring predictive analytics and Scratch programming.'
    },
    {
      id: 'gal-ieee-01',
      club_id: 'ieee-student-branch',
      event_id: 'evt-ieee-day-2026',
      title: 'IEEE Day & i.Fest 2025 Renewable Energy Expo',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1000&auto=format&fit=crop&q=80',
      caption: 'IEEE Student Branch hosting solar and smart grid project exhibitions with IEEE Vizag Bay delegates.'
    },
    {
      id: 'gal-nss-01',
      club_id: 'rotaract-club',
      event_id: 'evt-nss-blood-donation',
      title: 'Mega Blood Donation Camp with Rotary Blood Center',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1000&auto=format&fit=crop&q=80',
      caption: 'Pragati NSS & NCC units organizing annual blood donation camp collecting 250+ units for community health.'
    },
    {
      id: 'gal-nss-02',
      club_id: 'rotaract-club',
      event_id: 'evt-nss-swachh-surampalem',
      title: 'Swachh Bharat & Village Community Outreach Camp',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80',
      caption: 'Student volunteers conducting sanitation awareness drives and sapling plantation in Surampalem village.'
    },
    {
      id: 'gal-cultural-01',
      club_id: 'cultural-club',
      event_id: 'evt-prism-cultural-fest',
      title: 'PRISM Annual State-Level Cultural & Arts Festival',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
      caption: 'Basement Blues Cultural Club hosting classical dance, band performances, and street theatre competitions.'
    },
    {
      id: 'gal-aws-01',
      club_id: 'aws-academy-group',
      event_id: 'evt-aws-cloud-bootcamp',
      title: 'PEC-AWS Academy Cloud Builder Bootcamp',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80',
      caption: 'AWS Cloud Practitioner certification lab training on serverless Lambda microservices.'
    },
    {
      id: 'gal-sfds-01',
      club_id: 'society-for-data-science',
      event_id: 'evt-sfds-data-panoply',
      title: 'Data Product Panoply & Predictive Analytics Challenge',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80',
      caption: 'Data Science students presenting automated ETL pipelines and Tableau interactive dashboards.'
    },
    {
      id: 'gal-robotics-01',
      club_id: 'robotics-club',
      event_id: 'evt-robotics-summit',
      title: 'Autonomous Mobile Robotics & LiDAR SLAM Testing',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80',
      caption: 'Building ROS2 differential drive robots for obstacle avoidance in the mechanical prototyping bay.'
    },
    {
      id: 'gal-gokart-01',
      club_id: 'go-kart-club',
      title: 'Pragati Go-Kart Racing Team Track Testing & Fabrication',
      media_type: 'image',
      url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80',
      caption: 'Mechanical & EEE student team testing chassis dynamics for national Go-Kart championship.'
    }
  ];

  for (const g of galleryItems) {
    try {
      const existing = queryOne('SELECT id FROM gallery WHERE id = ?', [g.id]);
      if (!existing) {
        execute(
          `INSERT INTO gallery (id, club_id, event_id, title, media_type, url, caption, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'usr-pec-admin')`,
          [g.id, g.club_id, g.event_id || null, g.title, g.media_type, g.url, g.caption]
        );
      }
    } catch (err) {
      console.error(`[Gallery Seed Warning] Could not insert ${g.id}:`, err);
    }
  }

  console.log('[Enrichment] Real database and authentication enrichment completed successfully!');
}
