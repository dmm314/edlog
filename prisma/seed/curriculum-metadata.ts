/**
 * EDLOG CURRICULUM METADATA
 *
 * This file contains Family of Situation and Learning Objectives for each
 * module in the Cameroonian national curriculum. It is used to auto-populate
 * fields in the logbook entry form.
 *
 * HOW TO READ THIS FILE:
 *   Each subject (PHY, CHE, MAT, etc.) contains class levels ("Form 1", "Form 2", etc.)
 *   Each class level contains modules (numbered 1, 2, 3, etc.)
 *   Each module has:
 *     - familyOfSituation: the official MINSEC family of situation for that module
 *     - objectives: things learners should be able to do after studying this module
 *
 * HOW TO UPDATE:
 *   1. Find the subject code (PHY = Physics, CHE = Chemistry, etc.)
 *   2. Find the class level ("Form 1", "Lower Sixth", etc.)
 *   3. Find or add the module number
 *   4. Add or edit the familyOfSituation and objectives
 *   5. Save the file
 *   6. Run: npx prisma db seed (or restart the dev server)
 *
 * IMPORTANT: Module numbers and names must match what's in the corresponding
 * curriculum file (curriculum-physics.ts, etc.) — the moduleNum and moduleName
 * fields in the Topic table.
 *
 * Source: MINSEC National Syllabi, Competency-Based Approach (CBA)
 * Last updated: March 2026
 */

export interface ModuleObjective {
  text: string;           // "identify the different branches of science"
  // The teacher will select which objectives were achieved, and for each
  // selected objective they'll indicate: "all", "most", "some", or "few" students
}

export interface ModuleMetadata {
  moduleNum: number;
  moduleName: string;     // Must match the moduleName in the Topic table
  familyOfSituation: string;
  objectives: ModuleObjective[];
}

export interface LevelMetadata {
  classLevel: string;     // "Form 1", "Form 2", ..., "Lower Sixth", "Upper Sixth"
  modules: ModuleMetadata[];
}

export interface SubjectMetadata {
  subjectCode: string;    // "PHY", "CHE", "MAT", "BIO", etc.
  subjectName: string;    // "Physics", "Chemistry", etc.
  levels: LevelMetadata[];
}


// ════════════════════════════════════════════════════════════════════
// PHYSICS
// ════════════════════════════════════════════════════════════════════

const PHYSICS: SubjectMetadata = {
  subjectCode: "PHY",
  subjectName: "Physics",
  levels: [
    // ── FORM 1 ──────────────────────────────────────────────────
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "The World of Science",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "identify the different branches of science" },
            { text: "name prominent scientists and their discoveries" },
            { text: "define physics and list its branches" },
            { text: "describe what physicists do" },
            { text: "identify basic equipment in the physics laboratory" },
            { text: "state safety rules for working in the laboratory" },
            { text: "list job opportunities for science students" },
            { text: "perform simple measurements using measuring instruments" },
            { text: "distinguish between physical and non-physical quantities" },
            { text: "state and use SI units of measurement" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Matter – Properties and Transformation",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe the three states of matter" },
            { text: "explain interconversion processes between states" },
            { text: "define and measure length using appropriate instruments" },
            { text: "define mass and measure it using a balance" },
            { text: "differentiate between mass and weight" },
            { text: "measure volumes of liquids, regular and irregular solids" },
            { text: "define density and calculate it from mass and volume" },
            { text: "define temperature and convert between temperature scales" },
            { text: "apply safety rules on products and materials" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energy – Applications and Uses",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "identify forms and sources of energy" },
            { text: "describe daily applications of different forms of energy" },
            { text: "explain the principle of energy conservation" },
            { text: "describe components and uses of solar energy" },
            { text: "identify sources and uses of chemical, electrical, and heat energy" },
            { text: "explain conduction, convection, and radiation" },
            { text: "define force and describe its effects" },
            { text: "define and describe types of motion" },
            { text: "explain safety rules related to seat belts and road signs" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Health Education",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe how sound is produced and transmitted" },
            { text: "explain how the ear perceives sound" },
            { text: "describe the effects of loud sound and prevention measures" },
            { text: "measure body temperature using a thermometer" },
            { text: "identify normal and abnormal body temperatures" },
            { text: "describe good body posture and its importance" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Environmental Education and Sustainable Development",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "identify harmful waste and background radiation" },
            { text: "explain safety procedures for handling radioactive substances" },
            { text: "describe the greenhouse effect" },
            { text: "explain the causes and effects of climate change" },
            { text: "describe principles of environmental sustainability" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Technology",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "identify common machines and their uses" },
            { text: "describe lubrication, cleaning, and repair of simple machines" },
            { text: "use instruments for technical drawing" },
            { text: "produce sample technical drawings" },
          ],
        },
      ],
    },
    // ── FORM 2 ──────────────────────────────────────────────────
    {
      classLevel: "Form 2",
      modules: [
        {
          moduleNum: 1,
          moduleName: "The World of Science",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "collect data systematically and explain its importance" },
            { text: "interpret data and draw valid conclusions" },
            { text: "design and carry out a simple scientific investigation" },
            { text: "present results in tables, charts, and graphs" },
            { text: "distinguish between observation, inference, and prediction" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Matter – Properties and Transformation",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe and explain the properties of solids, liquids, and gases" },
            { text: "explain the action of heat and electricity on materials" },
            { text: "apply Hooke's Law to elastic materials" },
            { text: "describe atmospheric pressure and its effects" },
            { text: "explain the action of forces on objects in fluids" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energy – Value and Uses",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "identify and describe light as a form of energy" },
            { text: "describe how light travels and forms beams and shadows" },
            { text: "explain reflection and refraction of light" },
            { text: "describe the formation of images in plane mirrors" },
            { text: "identify applications of light in everyday life" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Health Education",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe the structure and function of the eye" },
            { text: "explain how lenses are used to correct vision defects" },
            { text: "identify common eye defects and their causes" },
            { text: "describe the importance of a balanced diet for health" },
            { text: "explain the effects of poor nutrition on the body" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Environmental Protection and Sustainable Development",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe sources and effects of water and air pollution" },
            { text: "explain methods of water treatment and purification" },
            { text: "describe principles of waste management and recycling" },
            { text: "explain the concept of sustainable development" },
            { text: "identify individual actions that protect the environment" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Technology",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "identify types of levers and calculate mechanical advantage" },
            { text: "describe the working principles of pulleys and inclined planes" },
            { text: "explain how gears are used in machines" },
            { text: "interpret simple technical drawings" },
          ],
        },
      ],
    },
    // ── FORM 3 ──────────────────────────────────────────────────
    {
      classLevel: "Form 3",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Introduction to Mechanics",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "define scalar and vector quantities and give examples" },
            { text: "add and resolve vectors using graphical and analytical methods" },
            { text: "describe types of forces and their effects on bodies" },
            { text: "apply Newton's laws of motion to solve simple problems" },
            { text: "explain the concept of equilibrium" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Matter – Properties and Transformation",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "explain the molecular theory of matter" },
            { text: "describe Brownian motion and its significance" },
            { text: "explain cohesion, adhesion, and surface tension" },
            { text: "apply the gas laws to solve problems" },
            { text: "describe the kinetic theory of gases" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energy – Applications and Uses",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "define work, power, and energy and state their units" },
            { text: "calculate work done by a force" },
            { text: "apply the work-energy theorem to solve problems" },
            { text: "explain conservation of mechanical energy" },
            { text: "describe how machines convert energy" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Optics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "explain refraction and apply Snell's law" },
            { text: "describe total internal reflection and its applications" },
            { text: "describe the formation of images by converging and diverging lenses" },
            { text: "explain the working of optical instruments" },
            { text: "describe the spectrum of white light and dispersion" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Projects and Elementary Engineering",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "design and build a simple mechanical device" },
            { text: "read and interpret engineering drawings" },
            { text: "apply physics principles to solve engineering problems" },
            { text: "evaluate the performance of a constructed device" },
          ],
        },
      ],
    },
    // ── FORM 4 ──────────────────────────────────────────────────
    {
      classLevel: "Form 4",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Energy – Application and Uses",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "define heat and temperature and distinguish between them" },
            { text: "calibrate thermometers using fixed points" },
            { text: "perform calculations using Q = mcΔθ" },
            { text: "explain conduction, convection, and radiation with examples" },
            { text: "describe clinical and laboratory thermometers" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Waves",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define wave motion and describe types of waves" },
            { text: "define and use the terms: frequency, wavelength, amplitude, period" },
            { text: "apply the wave equation v = fλ" },
            { text: "describe reflection, refraction, and diffraction of waves" },
            { text: "explain resonance and its applications" },
            { text: "describe properties of sound waves" },
            { text: "explain the Doppler effect" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Electrical Energy",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe methods of charging bodies electrically" },
            { text: "apply Coulomb's law to calculate electrostatic forces" },
            { text: "define electric field, potential, and capacitance" },
            { text: "describe the charging and discharging of capacitors" },
            { text: "apply Ohm's law to simple and complex circuits" },
            { text: "calculate resistance in series and parallel" },
            { text: "apply Kirchhoff's laws to circuit analysis" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Projects and Elementary Engineering",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "design, build, and test an electrical circuit" },
            { text: "interpret circuit diagrams and engineering schematics" },
            { text: "produce orthogonal drawings and 2D diagrams" },
            { text: "evaluate and present a completed project" },
          ],
        },
      ],
    },
    // ── FORM 5 ──────────────────────────────────────────────────
    {
      classLevel: "Form 5",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Fields – Magnetic Fields and Their Effects",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the properties and applications of magnets" },
            { text: "apply Faraday's and Lenz's laws to electromagnetic induction" },
            { text: "explain the working of transformers and generators" },
            { text: "describe the principle of energy conservation in electrical systems" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Environmental Protection – Modern Physics and Basic Electronics",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe the composition of the atom and atomic models" },
            { text: "classify types of radioactive decay: alpha, beta, and gamma" },
            { text: "explain the concept of half-life and radioactive decay" },
            { text: "describe background radiation and safety measures" },
            { text: "describe basic electronic components and their uses" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Mechanics",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "apply Newton's laws of motion to advanced problems" },
            { text: "solve problems involving circular motion and centripetal force" },
            { text: "apply the principle of conservation of momentum" },
            { text: "apply Archimedes' Principle to floating and sinking" },
            { text: "solve problems involving work, energy, and power" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Projects and Elementary Engineering",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "design and execute an engineering project" },
            { text: "produce and interpret technical drawings" },
            { text: "apply physics principles to the project" },
            { text: "present findings and evaluate the project outcome" },
          ],
        },
      ],
    },
    // ── LOWER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Lower Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Physical Quantities",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "distinguish between base and derived physical quantities" },
            { text: "state and use SI units correctly" },
            { text: "perform dimensional analysis" },
            { text: "apply significant figures and error analysis in calculations" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Mechanics",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "resolve and add vectors in two and three dimensions" },
            { text: "apply Newton's laws to systems of particles" },
            { text: "solve problems involving circular motion" },
            { text: "apply conservation of energy and momentum" },
            { text: "describe simple harmonic motion and solve related problems" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energetics",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "apply the first law of thermodynamics" },
            { text: "describe and apply Ohm's law and resistivity" },
            { text: "apply Kirchhoff's laws to complex networks" },
            { text: "describe renewable and non-renewable energy sources" },
            { text: "perform calculations involving electrical power and energy" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Matter – Effects of Energy and Application",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "apply Hooke's Law and Young's modulus to problems" },
            { text: "describe and apply the gas laws" },
            { text: "explain Brownian motion in gases" },
            { text: "describe real gases and Van der Waals forces" },
            { text: "explain the basic function of heat engines" },
          ],
        },
      ],
    },
    // ── UPPER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Upper Sixth",
      modules: [
        {
          moduleNum: 5,
          moduleName: "Field Phenomena",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply Newton's law of universal gravitation to orbital motion" },
            { text: "describe Kepler's laws of planetary motion" },
            { text: "apply Coulomb's law and Gauss's law to electrostatic problems" },
            { text: "describe capacitance, charging, and energy stored in capacitors" },
            { text: "apply Biot-Savart and Ampere's laws to magnetic fields" },
            { text: "apply Faraday's and Lenz's laws to electromagnetic induction" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Waves Around Us",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the wave nature of light and classify electromagnetic waves" },
            { text: "explain interference, diffraction, and polarisation of light" },
            { text: "apply Einstein's photoelectric equation" },
            { text: "describe the atomic model and emission spectra" },
            { text: "explain nuclear reactions and radioactive decay" },
          ],
        },
        {
          moduleNum: 7,
          moduleName: "Electronics (Option)",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe the working of diodes, transistors, and logic gates" },
            { text: "design and analyse simple amplifier circuits" },
            { text: "explain the working of oscillators and rectifiers" },
          ],
        },
        {
          moduleNum: 8,
          moduleName: "Communication (Option)",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe analogue and digital communication channels" },
            { text: "explain modulation techniques (AM, FM)" },
            { text: "describe aerials and signal transmission" },
          ],
        },
        {
          moduleNum: 9,
          moduleName: "Medical Physics (Option)",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe the use of X-rays and ultrasound in diagnosis" },
            { text: "explain biological measurements for the heart (ECG)" },
            { text: "describe the principles of radiation therapy" },
          ],
        },
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// CHEMISTRY
// ════════════════════════════════════════════════════════════════════

const CHEMISTRY: SubjectMetadata = {
  subjectCode: "CHE",
  subjectName: "Chemistry",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Understanding Chemistry and Classification",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "define chemistry and describe its importance in daily life" },
            { text: "identify and classify substances as elements, compounds, or mixtures" },
            { text: "distinguish between physical and chemical changes" },
            { text: "describe properties of acids and bases using indicators" },
            { text: "apply basic laboratory safety rules" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Effect of Heat on Substances",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe the effect of heat on common substances" },
            { text: "explain thermal decomposition with examples" },
            { text: "describe exothermic and endothermic reactions" },
            { text: "explain the effect of heat on solubility" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Air Water and Solutions",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe the composition of air and its importance" },
            { text: "explain the water cycle and properties of water" },
            { text: "define a solution and describe factors affecting solubility" },
            { text: "describe methods of separating mixtures" },
            { text: "explain water purification methods" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 2",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Atoms and Chemical Reactions",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the structure of the atom" },
            { text: "use atomic number and mass number to describe atoms" },
            { text: "explain ionic, covalent, and metallic bonding" },
            { text: "write and balance chemical equations" },
            { text: "calculate moles and apply the mole concept" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Action of Heat and Electricity",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe electrolysis and identify electrolytes" },
            { text: "explain the action of electricity on solutions" },
            { text: "describe practical applications of electrolysis" },
            { text: "explain thermal decomposition of selected compounds" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 3",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Atoms Structure and Chemical Properties",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe electron configuration and the periodic table" },
            { text: "explain trends in properties across periods and down groups" },
            { text: "describe the properties of common metals and non-metals" },
            { text: "explain acid-base and redox reactions" },
            { text: "perform stoichiometric calculations" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 4",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Elements Compounds and Organic Chemistry",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe the properties and uses of selected elements and compounds" },
            { text: "explain the extraction and uses of metals" },
            { text: "introduce organic chemistry: hydrocarbons and functional groups" },
            { text: "describe the properties of alkanes, alkenes, and alkynes" },
            { text: "explain industrial applications of organic compounds" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 5",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Reaction Rates and Organic Chemistry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define reaction rate and identify factors affecting it" },
            { text: "explain collision theory and activation energy" },
            { text: "describe the role of catalysts in reactions" },
            { text: "describe the chemistry of alcohols, acids, and esters" },
            { text: "explain polymerisation and uses of polymers" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Industrial Chemistry",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe the industrial production of ammonia (Haber process)" },
            { text: "explain the industrial production of sulfuric acid (Contact process)" },
            { text: "describe the manufacture of chlorine and sodium hydroxide" },
            { text: "explain the extraction of metals from ores" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energetics and Electrochemistry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define enthalpy change and apply Hess's law" },
            { text: "explain oxidation and reduction in electrochemical cells" },
            { text: "describe the functioning of galvanic and electrolytic cells" },
            { text: "apply electrochemistry to corrosion and its prevention" },
          ],
        },
      ],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Fundamental Chemistry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply the mole concept to calculations involving gases and solutions" },
            { text: "describe atomic structure, electron configuration, and periodicity" },
            { text: "explain types of chemical bonding and shapes of molecules" },
            { text: "describe intermolecular forces and their effects on physical properties" },
            { text: "perform quantitative analysis calculations" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Thermochemistry",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "define standard enthalpy changes and calculate them" },
            { text: "apply Hess's law and bond energy calculations" },
            { text: "describe entropy and Gibbs free energy" },
            { text: "explain spontaneity and equilibrium from thermodynamic principles" },
          ],
        },
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Equilibria and Organic Chemistry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply the equilibrium law and Le Chatelier's principle" },
            { text: "describe acid-base equilibria and pH calculations" },
            { text: "explain buffer solutions and their applications" },
            { text: "describe mechanisms of organic reactions (substitution, addition, elimination)" },
            { text: "explain the chemistry of carbonyl compounds and amines" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Chemistry and Society",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe the chemistry of atmospheric pollution" },
            { text: "explain green chemistry principles" },
            { text: "describe the chemistry of food, drugs, and polymers" },
            { text: "explain nuclear chemistry and its applications" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Reaction Kinetics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "determine rate equations and rate constants experimentally" },
            { text: "explain the Arrhenius equation and activation energy" },
            { text: "describe reaction mechanisms and intermediates" },
            { text: "apply kinetic principles to industrial processes" },
          ],
        },
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// MATHEMATICS
// ════════════════════════════════════════════════════════════════════

const MATHEMATICS: SubjectMetadata = {
  subjectCode: "MAT",
  subjectName: "Mathematics",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Numbers and Algebra",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "classify and perform operations on natural, integer, rational, and real numbers" },
            { text: "apply order of operations (BODMAS/BIDMAS) correctly" },
            { text: "simplify algebraic expressions" },
            { text: "solve linear equations and inequalities" },
            { text: "use ratio, proportion, and percentages in real-life contexts" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Geometry",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "identify and classify angles, triangles, and polygons" },
            { text: "apply properties of parallel lines cut by a transversal" },
            { text: "calculate perimeters, areas, and volumes of basic shapes" },
            { text: "apply Pythagoras' theorem to right-angled triangles" },
            { text: "perform geometric constructions with compass and ruler" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Statistics",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "collect, organise, and present data in tables and charts" },
            { text: "calculate mean, median, and mode" },
            { text: "interpret bar charts, pictograms, and pie charts" },
            { text: "describe the range and describe data spread" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Coordinate Geometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "plot and read points in the Cartesian plane" },
            { text: "calculate the distance between two points" },
            { text: "find the midpoint of a line segment" },
            { text: "plot linear equations and interpret their graphs" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 2",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Numbers and Algebra",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "work with indices and standard form" },
            { text: "factorise algebraic expressions" },
            { text: "solve simultaneous linear equations" },
            { text: "apply sequences and series" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Geometry",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "apply congruence and similarity conditions to triangles" },
            { text: "calculate arc length and sector area of circles" },
            { text: "apply the properties of quadrilaterals" },
            { text: "perform reflections, rotations, translations, and enlargements" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Coordinate Geometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "find the gradient and equation of a straight line" },
            { text: "determine whether lines are parallel or perpendicular" },
            { text: "use the equation of a circle" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Statistics",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "construct and interpret frequency tables and histograms" },
            { text: "calculate cumulative frequency and draw ogives" },
            { text: "find quartiles and interquartile range" },
            { text: "describe and interpret scatter diagrams" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 3",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Algebra",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "solve quadratic equations by factorisation, formula, and completing the square" },
            { text: "work with polynomials and the remainder theorem" },
            { text: "solve linear and quadratic inequalities" },
            { text: "apply the binomial theorem" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Geometry and Trigonometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define trigonometric ratios and apply them to right-angled triangles" },
            { text: "apply the sine and cosine rules" },
            { text: "calculate areas of triangles using trigonometry" },
            { text: "solve bearing and elevation problems" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Matrices and Vectors",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "perform matrix operations: addition, subtraction, multiplication" },
            { text: "find the determinant and inverse of 2×2 matrices" },
            { text: "solve systems of equations using matrices" },
            { text: "add and subtract vectors and find resultants" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Functions and Relations",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define functions, domain, range, and mapping" },
            { text: "sketch graphs of linear, quadratic, and other functions" },
            { text: "find inverse and composite functions" },
            { text: "describe transformations of functions" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Statistics and Probability",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "calculate and interpret measures of central tendency and spread" },
            { text: "apply basic probability rules" },
            { text: "use tree diagrams and Venn diagrams for probability" },
            { text: "describe independent and mutually exclusive events" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 4",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Numbers and Algebra",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "apply logarithms and exponential functions" },
            { text: "solve exponential and logarithmic equations" },
            { text: "work with partial fractions" },
            { text: "apply the binomial expansion" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Geometry and Trigonometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "use trigonometric identities and solve trigonometric equations" },
            { text: "apply compound and double angle formulas" },
            { text: "describe and apply 3D Pythagorean geometry" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Matrices and Vectors",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "work with 3×3 matrices and their properties" },
            { text: "use vectors in 3D space" },
            { text: "apply scalar and vector products" },
            { text: "find equations of lines and planes in 3D" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Pure Mathematics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "differentiate polynomials and apply the chain, product, and quotient rules" },
            { text: "find stationary points and apply differentiation to optimisation" },
            { text: "integrate polynomials and use integration to find areas" },
            { text: "apply the fundamental theorem of calculus" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Vectors and Geometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "represent position vectors in 2D and 3D" },
            { text: "calculate dot products and angles between vectors" },
            { text: "apply vectors to geometric proofs" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 5",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Pure Mathematics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "differentiate and integrate trigonometric, exponential, and logarithmic functions" },
            { text: "solve differential equations" },
            { text: "apply integration techniques: substitution and by parts" },
            { text: "work with complex numbers" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Statistics and Probability",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe discrete and continuous probability distributions" },
            { text: "apply the binomial and Poisson distributions" },
            { text: "use the normal distribution and standard tables" },
            { text: "carry out hypothesis testing" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Mechanics",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "apply Newton's laws to particles and systems" },
            { text: "describe motion under constant and variable acceleration" },
            { text: "solve problems involving friction and equilibrium" },
            { text: "apply momentum and impulse" },
          ],
        },
      ],
    },
    // ── LOWER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Lower Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Foundations",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "work with sets, relations, and functions" },
            { text: "apply the binomial theorem" },
            { text: "solve polynomial and rational equations" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Number Systems and Counting",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "work with real, rational, and complex numbers" },
            { text: "apply counting techniques: permutations and combinations" },
            { text: "use proof by induction" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Functions and Calculus",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "analyse and sketch functions including asymptotes" },
            { text: "differentiate using the chain, product, and quotient rules" },
            { text: "integrate using substitution and by parts" },
            { text: "apply calculus to rates of change and optimisation" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Number Theory and Algebra",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "work with modular arithmetic and divisibility" },
            { text: "apply the Euclidean algorithm" },
            { text: "solve systems of equations using matrices" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Logic and Structures",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "construct truth tables and evaluate logical statements" },
            { text: "apply Boolean algebra" },
            { text: "describe groups, rings, and fields at an introductory level" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Analysis and Geometry",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply limits, continuity, and differentiability" },
            { text: "describe conic sections: ellipses, parabolas, and hyperbolas" },
            { text: "apply vector geometry in 2D and 3D" },
          ],
        },
        {
          moduleNum: 7,
          moduleName: "Linear Algebra",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "perform operations on matrices including row reduction" },
            { text: "find eigenvalues and eigenvectors" },
            { text: "describe vector spaces and linear independence" },
          ],
        },
      ],
    },
    // ── UPPER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Upper Sixth",
      modules: [
        {
          moduleNum: 4,
          moduleName: "Advanced Topics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply advanced integration techniques" },
            { text: "solve ordinary differential equations" },
            { text: "work with infinite series and convergence" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Descriptive Statistics",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "calculate and interpret measures of central tendency and dispersion" },
            { text: "construct and analyse frequency distributions" },
            { text: "interpret scatter diagrams and lines of best fit" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Probability",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "apply classical and conditional probability" },
            { text: "work with discrete and continuous random variables" },
            { text: "apply common probability distributions" },
          ],
        },
        {
          moduleNum: 7,
          moduleName: "Inference",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "construct confidence intervals for means and proportions" },
            { text: "perform hypothesis tests (Z-test, t-test, chi-square)" },
            { text: "interpret statistical results in context" },
          ],
        },
        {
          moduleNum: 8,
          moduleName: "Vectors and Kinematics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "use vector methods in kinematics" },
            { text: "describe relative motion" },
            { text: "apply projectile motion equations" },
          ],
        },
        {
          moduleNum: 9,
          moduleName: "Motion and Forces",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "apply Newton's laws to 2D problems" },
            { text: "solve problems involving friction and connected particles" },
            { text: "apply work, energy, and power in mechanics" },
          ],
        },
        {
          moduleNum: 10,
          moduleName: "Dynamics",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply impulse and momentum in one and two dimensions" },
            { text: "describe elastic and inelastic collisions" },
            { text: "apply circular motion and simple harmonic motion" },
          ],
        },
        {
          moduleNum: 11,
          moduleName: "Analysis",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "apply advanced differentiation and integration" },
            { text: "solve first and second order differential equations" },
            { text: "describe convergence of series" },
          ],
        },
        {
          moduleNum: 12,
          moduleName: "Applied",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "model real-world problems using mathematical tools" },
            { text: "apply mathematics to physics, economics, or biology" },
            { text: "present and evaluate mathematical models" },
          ],
        },
        {
          moduleNum: 13,
          moduleName: "Statistics",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "apply regression analysis and correlation" },
            { text: "use the normal distribution in inference" },
            { text: "perform analysis of variance (ANOVA) at introductory level" },
          ],
        },
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// BIOLOGY
// ════════════════════════════════════════════════════════════════════

const BIOLOGY: SubjectMetadata = {
  subjectCode: "BIO",
  subjectName: "Biology",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Introduction to Biology",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "define biology and describe its branches" },
            { text: "list characteristics of living things" },
            { text: "describe the cell as the basic unit of life" },
            { text: "use a microscope to observe cells" },
            { text: "distinguish between plant and animal cells" },
            { text: "classify living organisms into kingdoms" },
            { text: "describe the importance of biology to daily life" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 2",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Living Organisms",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe classification systems for plants and animals" },
            { text: "explain nutrition in plants: photosynthesis and mineral absorption" },
            { text: "describe nutrition and digestion in animals" },
            { text: "explain transport systems in plants and animals" },
            { text: "describe the role of living organisms in ecosystems" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 3",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Cell Biology",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe the ultrastructure of plant and animal cells" },
            { text: "explain cell processes: diffusion, osmosis, and active transport" },
            { text: "describe cell division: mitosis and meiosis" },
            { text: "explain the cell cycle and its significance" },
            { text: "describe the role of cell division in growth and reproduction" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 4",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Human Biology",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe the structure and function of the human digestive system" },
            { text: "explain the mechanisms of gas exchange in the lungs" },
            { text: "describe blood composition and circulation" },
            { text: "explain the nervous and endocrine systems" },
            { text: "describe the structure and functions of the reproductive system" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 5",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Ecology and Environment",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "define ecology and describe ecosystem components" },
            { text: "explain food chains, food webs, and energy flow" },
            { text: "describe nutrient cycles: carbon, nitrogen, and water" },
            { text: "explain the causes and effects of environmental pollution" },
            { text: "describe conservation strategies and sustainable development" },
          ],
        },
      ],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Cell Biology Foundations",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the structure of the cell membrane and its functions" },
            { text: "explain the processes of diffusion, osmosis, and active transport" },
            { text: "describe the structure and function of cell organelles" },
            { text: "explain enzyme structure, function, and factors affecting activity" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Biological Molecules Part 1",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe the structure and function of carbohydrates" },
            { text: "describe the structure and function of lipids" },
            { text: "describe the structure and function of proteins" },
            { text: "explain the role of water in biological systems" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Nucleic Acids",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the structure of DNA and RNA" },
            { text: "explain DNA replication" },
            { text: "describe transcription and translation" },
            { text: "explain the genetic code and codon-anticodon interactions" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Molecular Biology",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe gene expression and regulation" },
            { text: "explain mutation and its consequences" },
            { text: "describe techniques in genetic engineering" },
            { text: "explain the applications of biotechnology in medicine and agriculture" },
          ],
        },
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Heredity",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "explain Mendel's laws of segregation and independent assortment" },
            { text: "solve monohybrid and dihybrid cross problems" },
            { text: "explain sex determination and sex-linked inheritance" },
            { text: "describe polygenic inheritance and gene interaction" },
            { text: "explain the chromosome theory of inheritance" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Nutrition",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe autotrophic and heterotrophic modes of nutrition" },
            { text: "explain the biochemistry of photosynthesis" },
            { text: "describe the light-dependent and light-independent reactions" },
            { text: "explain the role of minerals in plant and animal nutrition" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Metabolism and Transport",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe aerobic and anaerobic respiration" },
            { text: "explain glycolysis, the Krebs cycle, and oxidative phosphorylation" },
            { text: "describe the transport systems in mammals and plants" },
            { text: "explain the mechanisms of gas exchange" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Homeostasis",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "define homeostasis and explain its importance" },
            { text: "describe temperature regulation in humans" },
            { text: "explain osmoregulation and the role of the kidney" },
            { text: "describe blood glucose regulation and diabetes" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Reproduction and Growth",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "compare sexual and asexual reproduction" },
            { text: "describe reproductive strategies in plants and animals" },
            { text: "explain fertilisation, embryonic development, and birth" },
            { text: "describe growth patterns and population dynamics" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Ecology",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "describe population ecology and factors affecting population size" },
            { text: "explain community interactions: predation, competition, symbiosis" },
            { text: "describe succession and climax communities" },
            { text: "explain conservation biology and biodiversity" },
          ],
        },
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// COMPUTER SCIENCE
// ════════════════════════════════════════════════════════════════════

const COMPUTER_SCIENCE: SubjectMetadata = {
  subjectCode: "CSC",
  subjectName: "Computer Science",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "The Computing Environment",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "identify hardware components of a computer system" },
            { text: "describe the functions of input, processing, storage, and output devices" },
            { text: "describe types of software: system software and application software" },
            { text: "explain the role of an operating system" },
            { text: "apply basic file management and computer safety rules" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Word Processing",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "create, save, and retrieve documents" },
            { text: "format text: font, size, style, alignment, and spacing" },
            { text: "insert tables, images, and headers/footers" },
            { text: "print and share documents" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Spreadsheets",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "create and format a spreadsheet" },
            { text: "enter data and use basic arithmetic formulas" },
            { text: "use common functions: SUM, AVERAGE, MAX, MIN" },
            { text: "create simple charts from data" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "The Internet",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe the structure and purpose of the internet" },
            { text: "browse the web and perform searches effectively" },
            { text: "send and receive email" },
            { text: "identify online safety risks and preventive measures" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 2",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Computer Maintenance",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe routine computer maintenance procedures" },
            { text: "explain common hardware faults and simple troubleshooting" },
            { text: "protect against viruses using antivirus software" },
            { text: "manage disk space and files efficiently" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Word Processing Advanced",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "use advanced formatting: styles, columns, and sections" },
            { text: "create mail merge documents" },
            { text: "add footnotes, endnotes, and a table of contents" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Spreadsheets Intermediate",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "use logical and lookup functions: IF, VLOOKUP, HLOOKUP" },
            { text: "apply absolute and relative cell references" },
            { text: "create and format various chart types" },
            { text: "use filters and sorting to manage data" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "The Internet Intermediate",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe communication protocols: HTTP, FTP, SMTP" },
            { text: "evaluate website credibility" },
            { text: "describe cloud computing and online services" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Introduction to Algorithms and Programming",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define an algorithm and describe its properties" },
            { text: "represent algorithms using flowcharts and pseudocode" },
            { text: "describe the concept of a variable, data type, and operator" },
            { text: "write simple programs with sequence, selection, and repetition" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 3",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Introduction to DBMS",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "define a database and describe its advantages over files" },
            { text: "describe the relational model: tables, fields, records, keys" },
            { text: "create and query a simple database" },
            { text: "use forms and reports in a DBMS" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Computer Networks",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe types of networks: LAN, WAN, MAN" },
            { text: "explain network topologies and media" },
            { text: "describe the OSI and TCP/IP models" },
            { text: "explain IP addressing and DNS" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Spreadsheet Advanced",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "use pivot tables for data analysis" },
            { text: "apply advanced functions: COUNTIF, SUMIF, date functions" },
            { text: "protect worksheets and workbooks" },
            { text: "use macros to automate repetitive tasks" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Web Design",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe the structure of an HTML document" },
            { text: "use HTML tags for text, images, links, and tables" },
            { text: "apply CSS to style web pages" },
            { text: "describe basic principles of web usability and accessibility" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Introduction to Programming",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "write programs using variables, constants, and data types" },
            { text: "implement conditional statements and loops" },
            { text: "define and call functions/procedures" },
            { text: "work with arrays and basic data structures" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 4",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Introduction to Information Systems",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "define an information system and describe its components" },
            { text: "classify information systems by type and function" },
            { text: "describe the systems development life cycle (SDLC)" },
            { text: "explain data quality and information security" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Database Management Systems",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "design relational databases using entity-relationship diagrams" },
            { text: "normalise database tables to 3NF" },
            { text: "write SQL queries for data manipulation and retrieval" },
            { text: "describe transactions, concurrency, and backup strategies" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Computer Networks",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "describe routing and switching in networks" },
            { text: "explain network security: firewalls, encryption, and authentication" },
            { text: "describe wireless networks and mobile communication" },
            { text: "explain cloud networking concepts" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Programming with Visual Basic",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "design graphical user interfaces using Visual Basic" },
            { text: "implement event-driven programming" },
            { text: "connect a Visual Basic application to a database" },
            { text: "test and debug an application" },
          ],
        },
      ],
    },
    {
      classLevel: "Form 5",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Information Systems",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "analyse business requirements and propose information system solutions" },
            { text: "describe ERP, CRM, and e-commerce systems" },
            { text: "explain legal and ethical issues in ICT" },
            { text: "describe ICT project management principles" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Database Management Systems",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "implement advanced SQL including joins and subqueries" },
            { text: "describe stored procedures, triggers, and views" },
            { text: "explain database administration and performance tuning" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Computer Networks",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "configure and troubleshoot network services" },
            { text: "describe network administration and monitoring" },
            { text: "explain emerging network technologies: SDN, IoT" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Object-Oriented Programming with C++",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "define classes, objects, attributes, and methods" },
            { text: "implement encapsulation, inheritance, and polymorphism" },
            { text: "work with templates and the standard library" },
            { text: "design and implement a medium-scale OOP project" },
          ],
        },
      ],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Computer Systems",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe the von Neumann architecture and CPU operation" },
            { text: "explain memory hierarchy: cache, RAM, and secondary storage" },
            { text: "describe number representations: binary, octal, hexadecimal" },
            { text: "explain Boolean algebra and logic gates" },
            { text: "describe operating system functions and process management" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Algorithmics and Programming",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "analyse algorithm complexity using Big O notation" },
            { text: "implement common sorting and searching algorithms" },
            { text: "use recursion effectively" },
            { text: "implement and use stacks, queues, linked lists, and trees" },
            { text: "apply dynamic programming and greedy algorithms" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Structured Data",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "design and implement relational databases" },
            { text: "use advanced SQL including window functions" },
            { text: "describe NoSQL databases and their use cases" },
            { text: "explain data warehousing and business intelligence" },
          ],
        },
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [
        {
          moduleNum: 1,
          moduleName: "Software Engineering",
          familyOfSituation: "Science and technology",
          objectives: [
            { text: "describe software development methodologies: Agile, Scrum, Waterfall" },
            { text: "use UML for system modelling" },
            { text: "apply design patterns to software architecture" },
            { text: "perform unit testing, integration testing, and code review" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Information Systems",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "analyse and design enterprise information systems" },
            { text: "describe information security management" },
            { text: "apply ethical frameworks to ICT decisions" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Web Technology",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "develop dynamic web applications using server-side scripting" },
            { text: "apply RESTful API design principles" },
            { text: "implement basic web security: HTTPS, input validation, authentication" },
            { text: "describe cloud deployment and containerisation" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Databases",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "implement advanced database features and optimisation" },
            { text: "describe distributed database systems" },
            { text: "apply data mining and analytics techniques" },
          ],
        },
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// ADD MORE SUBJECTS BELOW
// ════════════════════════════════════════════════════════════════════
//
// To add a new subject:
// 1. Create a const following the same pattern as PHYSICS above
// 2. Add it to the ALL_METADATA array at the bottom
// 3. Fill in modules as data becomes available
//
// Subject codes must match what's in the Subject table:
//   ENG = English, FRE = French, LIT = Literature in English,
//   ECO = Economics, GEO = Geography, HIS = History,
//   PHI = Philosophy, LOG = Logic, ACC = Accounting,
//   COM = Commerce, FOA = Food and Nutrition,
//   and any others in your Subject table.
// ════════════════════════════════════════════════════════════════════


// ── MASTER EXPORT ───────────────────────────────────────────────────

export const ALL_METADATA: SubjectMetadata[] = [
  PHYSICS,
  CHEMISTRY,
  MATHEMATICS,
  BIOLOGY,
  COMPUTER_SCIENCE,
  // Add more subjects here as they are created above
];


// ── LOOKUP HELPERS ──────────────────────────────────────────────────
// These functions are used by the API to quickly find metadata.

/**
 * Find metadata for a specific subject + level + module combination.
 * Returns null if no metadata exists yet.
 */
export function getModuleMetadata(
  subjectCode: string,
  classLevel: string,
  moduleNum: number
): ModuleMetadata | null {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return null;

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return null;

  const mod = level.modules.find(m => m.moduleNum === moduleNum);
  return mod || null;
}

/**
 * Find metadata by module NAME instead of number.
 * Useful when the entry form knows the moduleName but not the moduleNum.
 */
export function getModuleMetadataByName(
  subjectCode: string,
  classLevel: string,
  moduleName: string
): ModuleMetadata | null {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return null;

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return null;

  const mod = level.modules.find(
    m => m.moduleName.toLowerCase() === moduleName.toLowerCase()
  );
  return mod || null;
}

/**
 * Get all available families of situation for a subject + level.
 * Used to populate the dropdown when no specific module match exists.
 */
export function getFamiliesForLevel(
  subjectCode: string,
  classLevel: string
): string[] {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return [];

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return [];

  const families = level.modules
    .map(m => m.familyOfSituation)
    .filter(Boolean);

  return Array.from(new Set(families)); // deduplicate
}

/**
 * Get ALL unique families of situation across the entire curriculum.
 * Used as fallback dropdown options.
 */
export function getAllFamilies(): string[] {
  const families = new Set<string>();
  for (const subject of ALL_METADATA) {
    for (const level of subject.levels) {
      for (const mod of level.modules) {
        if (mod.familyOfSituation) {
          families.add(mod.familyOfSituation);
        }
      }
    }
  }
  return Array.from(families).sort();
}
