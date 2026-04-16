-- ============================================================
-- neon-subjects.sql  —  Populate the global Subject catalogue
-- and Topics for the Cameroon GCE O/A Level curriculum.
--
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- Run AFTER neon-reset.sql (tables must exist).
-- ============================================================

-- ============================================================
-- SUBJECTS  (24 subjects across 4 categories)
-- ============================================================

INSERT INTO "Subject" ("id", "name", "code", "category", "createdAt") VALUES
  -- ── Science ──
  ('subj-mat', 'Mathematics',             'MAT', 'Science',    CURRENT_TIMESTAMP),
  ('subj-ama', 'Additional Mathematics',  'AMA', 'Science',    CURRENT_TIMESTAMP),
  ('subj-pma', 'Pure Mathematics',        'PMA', 'Science',    CURRENT_TIMESTAMP),
  ('subj-fma', 'Further Mathematics',     'FMA', 'Science',    CURRENT_TIMESTAMP),
  ('subj-sta', 'Statistics',              'STA', 'Science',    CURRENT_TIMESTAMP),
  ('subj-mec', 'Mechanics',              'MEC', 'Science',    CURRENT_TIMESTAMP),
  ('subj-phy', 'Physics',                'PHY', 'Science',    CURRENT_TIMESTAMP),
  ('subj-che', 'Chemistry',              'CHE', 'Science',    CURRENT_TIMESTAMP),
  ('subj-bio', 'Biology',                'BIO', 'Science',    CURRENT_TIMESTAMP),
  ('subj-csc', 'Computer Science',       'CSC', 'Science',    CURRENT_TIMESTAMP),

  -- ── Language ──
  ('subj-eng', 'English Language',        'ENG', 'Language',   CURRENT_TIMESTAMP),
  ('subj-fre', 'French',                 'FRE', 'Language',   CURRENT_TIMESTAMP),
  ('subj-lit', 'Literature in English',  'LIT', 'Language',   CURRENT_TIMESTAMP),

  -- ── Humanities ──
  ('subj-his', 'History',                'HIS', 'Humanities', CURRENT_TIMESTAMP),
  ('subj-geo', 'Geography',             'GEO', 'Humanities', CURRENT_TIMESTAMP),
  ('subj-eco', 'Economics',             'ECO', 'Humanities', CURRENT_TIMESTAMP),
  ('subj-rel', 'Religious Studies',     'REL', 'Humanities', CURRENT_TIMESTAMP),
  ('subj-log', 'Logic',                'LOG', 'Humanities', CURRENT_TIMESTAMP),
  ('subj-phi', 'Philosophy',           'PHI', 'Humanities', CURRENT_TIMESTAMP),

  -- ── General ──
  ('subj-cit', 'Citizenship',           'CIT', 'General',    CURRENT_TIMESTAMP),
  ('subj-arc', 'Arts and Crafts',       'ARC', 'General',    CURRENT_TIMESTAMP),
  ('subj-phe', 'Physical Education',    'PHE', 'General',    CURRENT_TIMESTAMP),
  ('subj-spo', 'Sports',               'SPO', 'General',    CURRENT_TIMESTAMP),
  ('subj-mla', 'Manual Labour',         'MLA', 'General',    CURRENT_TIMESTAMP),

  -- ── New Subjects ──
  ('subj-ict', 'Information and Communication Technology', 'ICT', 'Science',    CURRENT_TIMESTAMP),
  ('subj-nwk', 'Needle Work',                             'NWK', 'General',    CURRENT_TIMESTAMP),
  ('subj-fan', 'Food and Nutrition',                       'FAN', 'General',    CURRENT_TIMESTAMP),
  ('subj-gel', 'Geology',                                  'GEL', 'Science',    CURRENT_TIMESTAMP),
  ('subj-sbf', 'Special Bilingual French',                 'SBF', 'Language',   CURRENT_TIMESTAMP),
  ('subj-hbi', 'Human Biology',                            'HBI', 'Science',    CURRENT_TIMESTAMP),
  ('subj-fsc', 'Food Science',                             'FSC', 'Science',    CURRENT_TIMESTAMP),
  ('subj-clb', 'Club Activities',                          'CLB', 'General',    CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- TOPICS  —  Cameroon GCE O/A Level syllabus
-- Organised by subject → class level → module
-- ============================================================

INSERT INTO "Topic" ("id", "name", "classLevel", "moduleName", "moduleNum", "orderIndex", "createdAt", "subjectId") VALUES

  -- ════════════════════════════════════════════════════════════
  -- PHYSICS
  -- ════════════════════════════════════════════════════════════

  -- Form 5  (O Level)
  ('t-phy-001', 'Kinematics',                       'Form 5',      'Mechanics',            1,  1,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-002', 'Newton''s Laws of Motion',          'Form 5',      'Mechanics',            1,  2,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-003', 'Work, Energy & Power',              'Form 5',      'Mechanics',            1,  3,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-004', 'Momentum & Collisions',             'Form 5',      'Mechanics',            1,  4,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-005', 'Wave Motion',                       'Form 5',      'Waves & Optics',       2,  5,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-006', 'Light & Optics',                    'Form 5',      'Waves & Optics',       2,  6,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-007', 'Measurement & Units',               'Form 5',      'General Physics',      3,  7,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-008', 'Pressure & Fluids',                 'Form 5',      'General Physics',      3,  8,  CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-009', 'Heat & Temperature',                'Form 5',      'Thermal Physics',      4,  9,  CURRENT_TIMESTAMP, 'subj-phy'),

  -- Lower Sixth  (A Level Year 1)
  ('t-phy-010', 'Circular Motion',                   'Lower Sixth', 'Rotational Mechanics', 5,  10, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-011', 'Gravitational Fields',              'Lower Sixth', 'Fields',               6,  11, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-012', 'Thermal Physics',                   'Lower Sixth', 'Thermal Physics',      4,  12, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-013', 'Oscillations & SHM',                'Lower Sixth', 'Waves & Oscillations', 7,  13, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-014', 'Superposition of Waves',            'Lower Sixth', 'Waves & Oscillations', 7,  14, CURRENT_TIMESTAMP, 'subj-phy'),

  -- Upper Sixth  (A Level Year 2)
  ('t-phy-015', 'Electric Fields',                   'Upper Sixth', 'Electricity',          8,  15, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-016', 'Current Electricity',               'Upper Sixth', 'Electricity',          8,  16, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-017', 'Electromagnetic Induction',         'Upper Sixth', 'Electricity',          8,  17, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-018', 'Magnetic Fields',                   'Upper Sixth', 'Electricity',          8,  18, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-019', 'Nuclear Physics',                   'Upper Sixth', 'Modern Physics',       9,  19, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-020', 'Radioactivity',                     'Upper Sixth', 'Modern Physics',       9,  20, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-021', 'Quantum Physics',                   'Upper Sixth', 'Modern Physics',       9,  21, CURRENT_TIMESTAMP, 'subj-phy'),

  -- ════════════════════════════════════════════════════════════
  -- MATHEMATICS
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-mat-001', 'Algebra & Polynomials',             'Form 5',      'Pure Mathematics',     1,  1,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-002', 'Trigonometry',                      'Form 5',      'Pure Mathematics',     1,  2,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-003', 'Coordinate Geometry',               'Form 5',      'Pure Mathematics',     1,  3,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-004', 'Sequences & Series',                'Form 5',      'Pure Mathematics',     1,  4,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-005', 'Indices & Logarithms',              'Form 5',      'Pure Mathematics',     1,  5,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-006', 'Sets & Logic',                      'Form 5',      'Pure Mathematics',     1,  6,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-007', 'Mensuration',                       'Form 5',      'Geometry',             2,  7,  CURRENT_TIMESTAMP, 'subj-mat'),

  -- Lower Sixth
  ('t-mat-008', 'Differentiation',                   'Lower Sixth', 'Calculus',             3,  8,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-009', 'Integration',                       'Lower Sixth', 'Calculus',             3,  9,  CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-010', 'Functions',                         'Lower Sixth', 'Pure Mathematics',     1,  10, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-011', 'Binomial Theorem',                  'Lower Sixth', 'Pure Mathematics',     1,  11, CURRENT_TIMESTAMP, 'subj-mat'),

  -- Upper Sixth
  ('t-mat-012', 'Vectors',                           'Upper Sixth', 'Vectors & Mechanics',  4,  12, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-013', 'Statistics & Probability',          'Upper Sixth', 'Statistics',           5,  13, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-014', 'Mechanics',                         'Upper Sixth', 'Applied Mathematics',  6,  14, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-015', 'Partial Fractions',                 'Upper Sixth', 'Pure Mathematics',     1,  15, CURRENT_TIMESTAMP, 'subj-mat'),

  -- ════════════════════════════════════════════════════════════
  -- CHEMISTRY
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-che-001', 'Atomic Structure',                  'Form 5',      'Physical Chemistry',   1,  1,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-002', 'Chemical Bonding',                  'Form 5',      'Physical Chemistry',   1,  2,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-003', 'Stoichiometry',                     'Form 5',      'Physical Chemistry',   1,  3,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-004', 'States of Matter',                  'Form 5',      'Physical Chemistry',   1,  4,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-005', 'Acids, Bases & Salts',              'Form 5',      'Inorganic Chemistry',  2,  5,  CURRENT_TIMESTAMP, 'subj-che'),

  -- Lower Sixth
  ('t-che-006', 'Energetics & Thermochemistry',      'Lower Sixth', 'Physical Chemistry',   1,  6,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-007', 'Reaction Kinetics',                 'Lower Sixth', 'Physical Chemistry',   1,  7,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-008', 'Chemical Equilibrium',              'Lower Sixth', 'Physical Chemistry',   1,  8,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-009', 'Electrochemistry',                  'Lower Sixth', 'Physical Chemistry',   1,  9,  CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-010', 'Redox Reactions',                   'Lower Sixth', 'Physical Chemistry',   1,  10, CURRENT_TIMESTAMP, 'subj-che'),

  -- Upper Sixth
  ('t-che-011', 'Hydrocarbons',                      'Upper Sixth', 'Organic Chemistry',    3,  11, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-012', 'Functional Groups',                 'Upper Sixth', 'Organic Chemistry',    3,  12, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-013', 'Polymers & Macromolecules',          'Upper Sixth', 'Organic Chemistry',    3,  13, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-014', 'Periodic Table & Trends',           'Upper Sixth', 'Inorganic Chemistry',  2,  14, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-015', 'Transition Metals',                 'Upper Sixth', 'Inorganic Chemistry',  2,  15, CURRENT_TIMESTAMP, 'subj-che'),

  -- ════════════════════════════════════════════════════════════
  -- BIOLOGY
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-bio-001', 'Cell Structure & Organisation',     'Form 5',      'Cell Biology',         1,  1,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-002', 'Biological Molecules',              'Form 5',      'Cell Biology',         1,  2,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-003', 'Enzymes',                           'Form 5',      'Cell Biology',         1,  3,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-004', 'Cell Division',                     'Form 5',      'Cell Biology',         1,  4,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-005', 'Nutrition in Plants',               'Form 5',      'Physiology',           2,  5,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-006', 'Nutrition in Animals',              'Form 5',      'Physiology',           2,  6,  CURRENT_TIMESTAMP, 'subj-bio'),

  -- Lower Sixth
  ('t-bio-007', 'Transport in Plants',               'Lower Sixth', 'Transport',            3,  7,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-008', 'Transport in Animals',              'Lower Sixth', 'Transport',            3,  8,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-009', 'Gas Exchange & Respiration',        'Lower Sixth', 'Respiration',          4,  9,  CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-010', 'Excretion & Homeostasis',           'Lower Sixth', 'Homeostasis',          5,  10, CURRENT_TIMESTAMP, 'subj-bio'),

  -- Upper Sixth
  ('t-bio-011', 'Genetics & Heredity',               'Upper Sixth', 'Genetics',             6,  11, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-012', 'Evolution & Natural Selection',     'Upper Sixth', 'Evolution',            7,  12, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-013', 'Ecology',                           'Upper Sixth', 'Ecology',              8,  13, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-014', 'Reproduction',                      'Upper Sixth', 'Reproduction',         9,  14, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-015', 'Coordination & Response',           'Upper Sixth', 'Coordination',         10, 15, CURRENT_TIMESTAMP, 'subj-bio'),

  -- ════════════════════════════════════════════════════════════
  -- FURTHER MATHEMATICS
  -- ════════════════════════════════════════════════════════════

  -- Lower Sixth
  ('t-fma-001', 'Complex Numbers',                   'Lower Sixth', 'Pure Mathematics',     1,  1,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-002', 'Matrices & Transformations',        'Lower Sixth', 'Pure Mathematics',     1,  2,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-003', 'Proof & Logic',                     'Lower Sixth', 'Pure Mathematics',     1,  3,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-004', 'Hyperbolic Functions',              'Lower Sixth', 'Pure Mathematics',     1,  4,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-005', 'Polar Coordinates',                 'Lower Sixth', 'Pure Mathematics',     1,  5,  CURRENT_TIMESTAMP, 'subj-fma'),

  -- Upper Sixth
  ('t-fma-006', 'Differential Equations',            'Upper Sixth', 'Calculus',             2,  6,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-007', 'Numerical Methods',                 'Upper Sixth', 'Applied',              3,  7,  CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-008', 'Groups & Abstract Algebra',         'Upper Sixth', 'Pure Mathematics',     1,  8,  CURRENT_TIMESTAMP, 'subj-fma'),

  -- ════════════════════════════════════════════════════════════
  -- COMPUTER SCIENCE
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-csc-001', 'Data Representation',               'Form 5',      'Fundamentals',         1,  1,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-002', 'Programming Concepts',              'Form 5',      'Programming',          2,  2,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-003', 'Number Systems',                    'Form 5',      'Fundamentals',         1,  3,  CURRENT_TIMESTAMP, 'subj-csc'),

  -- Lower Sixth
  ('t-csc-004', 'Algorithms & Data Structures',      'Lower Sixth', 'Computer Science',     3,  4,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-005', 'Computer Architecture',             'Lower Sixth', 'Hardware',             4,  5,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-006', 'Operating Systems',                 'Lower Sixth', 'Systems',              5,  6,  CURRENT_TIMESTAMP, 'subj-csc'),

  -- Upper Sixth
  ('t-csc-007', 'Networking',                        'Upper Sixth', 'Networks',             6,  7,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-008', 'Databases',                         'Upper Sixth', 'Data Management',      7,  8,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-009', 'Software Engineering',              'Upper Sixth', 'Software',             8,  9,  CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-010', 'Cybersecurity',                     'Upper Sixth', 'Security',             9,  10, CURRENT_TIMESTAMP, 'subj-csc'),

  -- ════════════════════════════════════════════════════════════
  -- ENGLISH LANGUAGE
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-eng-001', 'Comprehension & Summary',           'Form 5',      'Reading',              1,  1,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-002', 'Essay Writing',                     'Form 5',      'Writing',              2,  2,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-003', 'Grammar & Usage',                   'Form 5',      'Language',             3,  3,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-004', 'Vocabulary & Word Formation',       'Form 5',      'Language',             3,  4,  CURRENT_TIMESTAMP, 'subj-eng'),

  -- Lower Sixth
  ('t-eng-005', 'Directed Writing',                  'Lower Sixth', 'Writing',              2,  5,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-006', 'Prose',                             'Lower Sixth', 'Literature',           4,  6,  CURRENT_TIMESTAMP, 'subj-eng'),

  -- Upper Sixth
  ('t-eng-007', 'Poetry',                            'Upper Sixth', 'Literature',           4,  7,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-008', 'Drama',                             'Upper Sixth', 'Literature',           4,  8,  CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-009', 'Critical Analysis',                 'Upper Sixth', 'Literature',           4,  9,  CURRENT_TIMESTAMP, 'subj-eng'),

  -- ════════════════════════════════════════════════════════════
  -- FRENCH
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-fre-001', 'Compréhension écrite',              'Form 5',      'Lecture',              1,  1,  CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-002', 'Expression écrite',                 'Form 5',      'Écriture',             2,  2,  CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-003', 'Grammaire',                         'Form 5',      'Langue',               3,  3,  CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-004', 'Vocabulaire',                       'Form 5',      'Langue',               3,  4,  CURRENT_TIMESTAMP, 'subj-fre'),

  -- Lower Sixth
  ('t-fre-005', 'Compréhension orale',               'Lower Sixth', 'Oral',                 4,  5,  CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-006', 'Dissertation',                      'Lower Sixth', 'Écriture',             2,  6,  CURRENT_TIMESTAMP, 'subj-fre'),

  -- Upper Sixth
  ('t-fre-007', 'Littérature',                       'Upper Sixth', 'Littérature',          5,  7,  CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-008', 'Traduction',                        'Upper Sixth', 'Traduction',           6,  8,  CURRENT_TIMESTAMP, 'subj-fre'),

  -- ════════════════════════════════════════════════════════════
  -- LITERATURE IN ENGLISH
  -- ════════════════════════════════════════════════════════════

  -- Lower Sixth
  ('t-lit-001', 'Prose Fiction',                     'Lower Sixth', 'Prose',                1,  1,  CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-002', 'Poetry',                            'Lower Sixth', 'Poetry',               2,  2,  CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-003', 'Drama',                             'Lower Sixth', 'Drama',                3,  3,  CURRENT_TIMESTAMP, 'subj-lit'),

  -- Upper Sixth
  ('t-lit-004', 'African Literature',                'Upper Sixth', 'African Lit',          4,  4,  CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-005', 'Shakespeare',                       'Upper Sixth', 'Drama',                3,  5,  CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-006', 'Literary Criticism',                'Upper Sixth', 'Criticism',            5,  6,  CURRENT_TIMESTAMP, 'subj-lit'),

  -- ════════════════════════════════════════════════════════════
  -- HISTORY
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-his-001', 'Pre-colonial Cameroon',             'Form 5',      'Cameroon History',     1,  1,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-002', 'Colonial Cameroon',                 'Form 5',      'Cameroon History',     1,  2,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-003', 'Cameroon Independence & Unification','Form 5',     'Cameroon History',     1,  3,  CURRENT_TIMESTAMP, 'subj-his'),

  -- Lower Sixth
  ('t-his-004', 'African Civilisations',             'Lower Sixth', 'African History',      2,  4,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-005', 'Colonialism in Africa',             'Lower Sixth', 'African History',      2,  5,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-006', 'Nationalism & Independence',        'Lower Sixth', 'African History',      2,  6,  CURRENT_TIMESTAMP, 'subj-his'),

  -- Upper Sixth
  ('t-his-007', 'World War I & II',                  'Upper Sixth', 'World History',        3,  7,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-008', 'The Cold War',                      'Upper Sixth', 'World History',        3,  8,  CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-009', 'International Organisations',       'Upper Sixth', 'World History',        3,  9,  CURRENT_TIMESTAMP, 'subj-his'),

  -- ════════════════════════════════════════════════════════════
  -- GEOGRAPHY
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-geo-001', 'Map Reading & Interpretation',      'Form 5',      'Practical Geography',  1,  1,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-002', 'Physical Geography of Cameroon',    'Form 5',      'Physical Geography',   2,  2,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-003', 'Population & Settlement',           'Form 5',      'Human Geography',      3,  3,  CURRENT_TIMESTAMP, 'subj-geo'),

  -- Lower Sixth
  ('t-geo-004', 'Geomorphology',                     'Lower Sixth', 'Physical Geography',   2,  4,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-005', 'Climatology',                       'Lower Sixth', 'Physical Geography',   2,  5,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-006', 'Agriculture & Rural Development',   'Lower Sixth', 'Economic Geography',   4,  6,  CURRENT_TIMESTAMP, 'subj-geo'),

  -- Upper Sixth
  ('t-geo-007', 'Urbanisation & Industrialisation',  'Upper Sixth', 'Economic Geography',   4,  7,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-008', 'Environmental Issues',              'Upper Sixth', 'Environmental',        5,  8,  CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-009', 'Globalisation',                     'Upper Sixth', 'Economic Geography',   4,  9,  CURRENT_TIMESTAMP, 'subj-geo'),

  -- ════════════════════════════════════════════════════════════
  -- ECONOMICS
  -- ════════════════════════════════════════════════════════════

  -- Lower Sixth
  ('t-eco-001', 'Basic Economic Concepts',           'Lower Sixth', 'Microeconomics',       1,  1,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-002', 'Demand, Supply & Market Equilibrium','Lower Sixth','Microeconomics',       1,  2,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-003', 'Theory of the Firm',                'Lower Sixth', 'Microeconomics',       1,  3,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-004', 'Market Structures',                 'Lower Sixth', 'Microeconomics',       1,  4,  CURRENT_TIMESTAMP, 'subj-eco'),

  -- Upper Sixth
  ('t-eco-005', 'National Income',                   'Upper Sixth', 'Macroeconomics',       2,  5,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-006', 'Money & Banking',                   'Upper Sixth', 'Macroeconomics',       2,  6,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-007', 'International Trade',               'Upper Sixth', 'Macroeconomics',       2,  7,  CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-008', 'Economic Development',              'Upper Sixth', 'Development',          3,  8,  CURRENT_TIMESTAMP, 'subj-eco'),

  -- ════════════════════════════════════════════════════════════
  -- RELIGIOUS STUDIES
  -- ════════════════════════════════════════════════════════════

  -- Form 5
  ('t-rel-001', 'Introduction to Religion',          'Form 5',      'Foundations',          1,  1,  CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-002', 'Moral & Ethical Issues',            'Form 5',      'Ethics',               2,  2,  CURRENT_TIMESTAMP, 'subj-rel'),

  -- Lower Sixth
  ('t-rel-003', 'Old Testament Studies',             'Lower Sixth', 'Biblical Studies',     3,  3,  CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-004', 'New Testament Studies',             'Lower Sixth', 'Biblical Studies',     3,  4,  CURRENT_TIMESTAMP, 'subj-rel'),

  -- Upper Sixth
  ('t-rel-005', 'Philosophy of Religion',            'Upper Sixth', 'Philosophy',           4,  5,  CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-006', 'Religion & Society',                'Upper Sixth', 'Applied',              5,  6,  CURRENT_TIMESTAMP, 'subj-rel'),

  -- ════════════════════════════════════════════════════════════
  -- LOGIC  (O Level — Form 5)
  -- ════════════════════════════════════════════════════════════
  -- Form 5
  ('t-log-001', 'Propositions & Logical Connectives','Form 5',      'Formal Logic',         1,  1,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-002', 'Truth Tables',                      'Form 5',      'Formal Logic',         1,  2,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-003', 'Logical Equivalence & Implication',  'Form 5',      'Formal Logic',         1,  3,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-004', 'Syllogisms & Deductive Reasoning',  'Form 5',      'Reasoning',            2,  4,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-005', 'Fallacies & Invalid Arguments',     'Form 5',      'Reasoning',            2,  5,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-006', 'Sets, Venn Diagrams & Logic',       'Form 5',      'Applied Logic',        3,  6,  CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-007', 'Inductive Reasoning',               'Form 5',      'Reasoning',            2,  7,  CURRENT_TIMESTAMP, 'subj-log'),

  -- ════════════════════════════════════════════════════════════
  -- PHILOSOPHY  (A Level — Logic at A Level)
  -- ════════════════════════════════════════════════════════════
  -- Lower Sixth
  ('t-phi-001', 'Introduction to Philosophy',        'Lower Sixth', 'Foundations',          1,  1,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-002', 'Epistemology (Theory of Knowledge)','Lower Sixth', 'Foundations',          1,  2,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-003', 'Propositional & Predicate Logic',   'Lower Sixth', 'Logic',                2,  3,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-004', 'Formal Proofs & Derivations',       'Lower Sixth', 'Logic',                2,  4,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-005', 'Ethics & Moral Philosophy',         'Lower Sixth', 'Ethics',               3,  5,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-006', 'Philosophy of Mind',                'Lower Sixth', 'Metaphysics',          4,  6,  CURRENT_TIMESTAMP, 'subj-phi'),
  -- Upper Sixth
  ('t-phi-007', 'Metaphysics',                       'Upper Sixth', 'Metaphysics',          4,  7,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-008', 'Political Philosophy',              'Upper Sixth', 'Applied Philosophy',   5,  8,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-009', 'Philosophy of Science',             'Upper Sixth', 'Applied Philosophy',   5,  9,  CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-010', 'Symbolic Logic & Modal Logic',      'Upper Sixth', 'Advanced Logic',       6,  10, CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-011', 'Existentialism & Phenomenology',    'Upper Sixth', 'Modern Philosophy',    7,  11, CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-012', 'Philosophy of Religion',            'Upper Sixth', 'Applied Philosophy',   5,  12, CURRENT_TIMESTAMP, 'subj-phi')

  -- ════════════════════════════════════════════════════════════
  -- ICT (Information and Communication Technology)
  -- Form 1-5 (O Level)
  -- ════════════════════════════════════════════════════════════
  ('t-ict-001', 'Introduction to Computers',               'Form 1',      'Computer Basics',      1,  1,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-002', 'Computer Hardware & Software',            'Form 1',      'Computer Basics',      1,  2,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-003', 'Operating Systems',                       'Form 1',      'Computer Basics',      1,  3,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-004', 'Word Processing',                         'Form 2',      'Office Applications',  2,  4,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-005', 'Spreadsheets',                            'Form 2',      'Office Applications',  2,  5,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-006', 'Presentation Software',                   'Form 2',      'Office Applications',  2,  6,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-007', 'Internet & Email',                        'Form 3',      'Networking & Internet', 3,  7,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-008', 'Web Design Basics',                       'Form 3',      'Networking & Internet', 3,  8,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-009', 'Database Concepts',                       'Form 4',      'Data Management',      4,  9,  CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-010', 'Introduction to Programming',             'Form 4',      'Programming',          5,  10, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-011', 'Multimedia & Graphics',                   'Form 5',      'Multimedia',           6,  11, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-012', 'ICT & Society',                           'Form 5',      'ICT in Society',       7,  12, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-013', 'Cybersecurity Awareness',                 'Form 5',      'ICT in Society',       7,  13, CURRENT_TIMESTAMP, 'subj-ict'),

  -- ════════════════════════════════════════════════════════════
  -- NEEDLE WORK
  -- Form 1-5 (O Level)
  -- ════════════════════════════════════════════════════════════
  ('t-nwk-001', 'Introduction to Sewing Tools',            'Form 1',      'Basics',               1,  1,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-002', 'Hand Stitches & Seams',                   'Form 1',      'Basics',               1,  2,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-003', 'Fabric Types & Properties',               'Form 2',      'Textiles',             2,  3,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-004', 'Pattern Making & Cutting',                'Form 3',      'Pattern & Design',     3,  4,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-005', 'Machine Sewing',                          'Form 3',      'Pattern & Design',     3,  5,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-006', 'Garment Construction',                    'Form 4',      'Construction',         4,  6,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-007', 'Embroidery & Decoration',                 'Form 5',      'Finishing',            5,  7,  CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-008', 'Fashion Design Principles',               'Form 5',      'Finishing',            5,  8,  CURRENT_TIMESTAMP, 'subj-nwk'),

  -- ════════════════════════════════════════════════════════════
  -- FOOD AND NUTRITION
  -- Form 1-5 (O Level)
  -- ════════════════════════════════════════════════════════════
  ('t-fan-001', 'Introduction to Nutrition',               'Form 1',      'Nutrition Basics',     1,  1,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-002', 'Food Groups & Nutrients',                 'Form 1',      'Nutrition Basics',     1,  2,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-003', 'Food Hygiene & Safety',                   'Form 2',      'Food Safety',          2,  3,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-004', 'Meal Planning',                           'Form 2',      'Meal Planning',        3,  4,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-005', 'Methods of Cooking',                      'Form 3',      'Cooking Methods',      4,  5,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-006', 'Food Preservation',                       'Form 3',      'Food Processing',      5,  6,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-007', 'Diet & Health',                           'Form 4',      'Health & Diet',        6,  7,  CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-008', 'Special Diets & Nutritional Disorders',   'Form 5',      'Health & Diet',        6,  8,  CURRENT_TIMESTAMP, 'subj-fan'),

  -- ════════════════════════════════════════════════════════════
  -- GEOLOGY
  -- Lower Sixth & Upper Sixth (A Level)
  -- ════════════════════════════════════════════════════════════
  ('t-gel-001', 'Introduction to Geology',                 'Lower Sixth', 'Physical Geology',     1,  1,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-002', 'Minerals & Rocks',                        'Lower Sixth', 'Physical Geology',     1,  2,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-003', 'Plate Tectonics',                         'Lower Sixth', 'Physical Geology',     1,  3,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-004', 'Weathering & Erosion',                    'Lower Sixth', 'Surface Processes',    2,  4,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-005', 'Stratigraphy & Fossils',                  'Upper Sixth', 'Historical Geology',   3,  5,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-006', 'Structural Geology',                      'Upper Sixth', 'Structural Geology',   4,  6,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-007', 'Economic Geology',                        'Upper Sixth', 'Applied Geology',      5,  7,  CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-008', 'Hydrogeology',                            'Upper Sixth', 'Applied Geology',      5,  8,  CURRENT_TIMESTAMP, 'subj-gel'),

  -- ════════════════════════════════════════════════════════════
  -- SPECIAL BILINGUAL FRENCH
  -- Form 1-5 (anglophone schools)
  -- ════════════════════════════════════════════════════════════
  ('t-sbf-001', 'Greetings & Introductions',               'Form 1',      'Communication',        1,  1,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-002', 'Basic Vocabulary & Phrases',              'Form 1',      'Communication',        1,  2,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-003', 'Grammar Foundations',                     'Form 2',      'Grammaire',            2,  3,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-004', 'Reading Comprehension',                   'Form 3',      'Lecture',              3,  4,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-005', 'Oral Expression',                         'Form 3',      'Oral',                 4,  5,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-006', 'Written Expression',                      'Form 4',      'Écriture',             5,  6,  CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-007', 'Essay & Composition',                     'Form 5',      'Écriture',             5,  7,  CURRENT_TIMESTAMP, 'subj-sbf'),

  -- ════════════════════════════════════════════════════════════
  -- HUMAN BIOLOGY
  -- Form 3-5 (O Level)
  -- ════════════════════════════════════════════════════════════
  ('t-hbi-001', 'Organisation of the Human Body',          'Form 3',      'Body Systems',         1,  1,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-002', 'Nutrition & Digestive System',            'Form 3',      'Body Systems',         1,  2,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-003', 'Respiratory System',                      'Form 4',      'Body Systems',         1,  3,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-004', 'Circulatory System',                      'Form 4',      'Body Systems',         1,  4,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-005', 'Nervous System & Sense Organs',           'Form 4',      'Coordination',         2,  5,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-006', 'Endocrine System',                        'Form 5',      'Coordination',         2,  6,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-007', 'Reproduction & Development',              'Form 5',      'Reproduction',         3,  7,  CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-008', 'Disease & Immunity',                      'Form 5',      'Health',               4,  8,  CURRENT_TIMESTAMP, 'subj-hbi'),

  -- ════════════════════════════════════════════════════════════
  -- FOOD SCIENCE
  -- Lower Sixth & Upper Sixth (A Level)
  -- ════════════════════════════════════════════════════════════
  ('t-fsc-001', 'Introduction to Food Science',            'Lower Sixth', 'Foundations',          1,  1,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-002', 'Food Chemistry',                          'Lower Sixth', 'Food Chemistry',       2,  2,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-003', 'Food Microbiology',                       'Lower Sixth', 'Microbiology',         3,  3,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-004', 'Food Preservation & Processing',          'Lower Sixth', 'Processing',           4,  4,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-005', 'Food Quality & Standards',                'Upper Sixth', 'Quality Control',      5,  5,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-006', 'Nutrition & Health',                      'Upper Sixth', 'Nutrition',            6,  6,  CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-007', 'Food Biotechnology',                      'Upper Sixth', 'Biotechnology',        7,  7,  CURRENT_TIMESTAMP, 'subj-fsc'),

  -- ════════════════════════════════════════════════════════════
  -- CLUB ACTIVITIES (General period)
  -- All levels
  -- ════════════════════════════════════════════════════════════
  ('t-clb-001', 'Club Meeting',                            'Form 1',      'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-002', 'Club Meeting',                            'Form 2',      'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-003', 'Club Meeting',                            'Form 3',      'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-004', 'Club Meeting',                            'Form 4',      'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-005', 'Club Meeting',                            'Form 5',      'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-006', 'Club Meeting',                            'Lower Sixth', 'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb'),
  ('t-clb-007', 'Club Meeting',                            'Upper Sixth', 'Club Activities',      1,  1,  CURRENT_TIMESTAMP, 'subj-clb')

ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- REVISION & CORRECTION modules for ALL subjects at ALL levels
-- Every subject gets "Revision for Exams" and "Correction of Exams"
-- at every class level it has topics for.
-- ============================================================

INSERT INTO "Topic" ("id", "name", "classLevel", "moduleName", "moduleNum", "orderIndex", "createdAt", "subjectId") VALUES
  -- Physics
  ('t-phy-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phy'),
  ('t-phy-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phy'),

  -- Mathematics
  ('t-mat-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-mat'),
  ('t-mat-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-mat'),

  -- Chemistry
  ('t-che-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-che'),
  ('t-che-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-che'),

  -- Biology
  ('t-bio-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-bio'),
  ('t-bio-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-bio'),

  -- Additional Mathematics
  ('t-ama-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ama'),
  ('t-ama-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ama'),

  -- Pure Mathematics
  ('t-pma-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-pma'),
  ('t-pma-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-pma'),
  ('t-pma-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-pma'),
  ('t-pma-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-pma'),

  -- Further Mathematics
  ('t-fma-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fma'),
  ('t-fma-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fma'),

  -- Statistics
  ('t-sta-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-sta'),
  ('t-sta-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-sta'),
  ('t-sta-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-sta'),
  ('t-sta-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-sta'),

  -- Mechanics
  ('t-mec-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-mec'),
  ('t-mec-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-mec'),
  ('t-mec-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-mec'),
  ('t-mec-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-mec'),

  -- Computer Science
  ('t-csc-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-csc'),
  ('t-csc-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-csc'),

  -- English Language
  ('t-eng-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-eng'),
  ('t-eng-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-eng'),

  -- French
  ('t-fre-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fre'),
  ('t-fre-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fre'),

  -- Literature in English
  ('t-lit-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-lit'),
  ('t-lit-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-lit'),

  -- History
  ('t-his-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-his'),
  ('t-his-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-his'),

  -- Geography
  ('t-geo-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-geo'),
  ('t-geo-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-geo'),

  -- Economics
  ('t-eco-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-eco'),
  ('t-eco-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-eco'),

  -- Religious Studies
  ('t-rel-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-rel'),
  ('t-rel-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-rel'),

  -- Logic
  ('t-log-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-log'),
  ('t-log-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-log'),

  -- Philosophy
  ('t-phi-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phi'),
  ('t-phi-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phi'),

  -- General subjects (Citizenship, Arts, PE, Sports, Manual Labour)
  ('t-cit-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-cit'),
  ('t-cit-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-cit'),
  ('t-arc-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-arc'),
  ('t-arc-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-arc'),
  ('t-phe-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-phe'),
  ('t-phe-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-phe'),

  -- New subjects: ICT
  ('t-ict-rev-f1',  'Revision for Exams',    'Form 1',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-cor-f1',  'Correction of Exams',   'Form 1',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-rev-f2',  'Revision for Exams',    'Form 2',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-cor-f2',  'Correction of Exams',   'Form 2',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-rev-f3',  'Revision for Exams',    'Form 3',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-cor-f3',  'Correction of Exams',   'Form 3',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-rev-f4',  'Revision for Exams',    'Form 4',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-cor-f4',  'Correction of Exams',   'Form 4',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-ict'),
  ('t-ict-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-ict'),

  -- Needle Work
  ('t-nwk-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-nwk'),
  ('t-nwk-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-nwk'),

  -- Food and Nutrition
  ('t-fan-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fan'),
  ('t-fan-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fan'),

  -- Geology
  ('t-gel-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-gel'),
  ('t-gel-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-gel'),

  -- Special Bilingual French
  ('t-sbf-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-sbf'),
  ('t-sbf-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-sbf'),

  -- Human Biology
  ('t-hbi-rev-f5',  'Revision for Exams',    'Form 5',       'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-hbi'),
  ('t-hbi-cor-f5',  'Correction of Exams',   'Form 5',       'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-hbi'),

  -- Food Science
  ('t-fsc-rev-ls',  'Revision for Exams',    'Lower Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-cor-ls',  'Correction of Exams',   'Lower Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-rev-us',  'Revision for Exams',    'Upper Sixth',  'Revision & Exams', 99, 97, CURRENT_TIMESTAMP, 'subj-fsc'),
  ('t-fsc-cor-us',  'Correction of Exams',   'Upper Sixth',  'Revision & Exams', 99, 98, CURRENT_TIMESTAMP, 'subj-fsc')

ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- Done! Subjects and topics have been seeded.
-- Schools can now link subjects via the admin UI.
-- ============================================================
