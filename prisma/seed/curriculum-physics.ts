export interface TopicData {
  name: string;
  moduleNum: number;
  moduleName: string;
  orderIndex: number;
}

export interface LevelData {
  classLevel: string;
  topics: TopicData[];
}

export const PHYSICS_CURRICULUM: LevelData[] = [
  // =====================================================================
  // FORM 1
  // =====================================================================
  {
    classLevel: 'Form 1',
    topics: [
      // Module 1: The World of Science
      { name: 'Definition and branches of science', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 0 },
      { name: 'Prominent scientists and discoveries', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 1 },
      { name: 'Definition of physics and its branches', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 2 },
      { name: 'What physicists do', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 3 },
      { name: 'Basic equipment in the Physics laboratory', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 4 },
      { name: 'Safety rules for working in the Physics laboratory', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 5 },
      { name: 'Job opportunities for science students', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 6 },
      { name: 'Simple measurements using measuring instruments', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 7 },
      { name: 'Identifying physical and non-physical quantities', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 8 },
      { name: 'Units of measurement and SI units', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 9 },

      // Module 2: Matter – Properties and Transformation
      { name: 'Matter and states of matter', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 10 },
      { name: 'Interconversion processes', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 11 },
      { name: 'Definition of length and SI units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 12 },
      { name: 'Measurement of length', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 13 },
      { name: 'Definition of mass and SI units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 14 },
      { name: 'Measurement of the mass of a body', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 15 },
      { name: 'Definition of weight and its units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 16 },
      { name: 'Differentiate between mass and weight', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 17 },
      { name: 'Measurement of weight', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 18 },
      { name: 'Definition of volume and its units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 19 },
      { name: 'Measurement of volumes of liquids regular and irregular solids', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 20 },
      { name: 'Definition of density as mass per unit volume and its units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 21 },
      { name: 'Definition of temperature and SI units', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 22 },
      { name: 'Conversion between temperature scales', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 23 },
      { name: 'Safety rules on products/materials', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 24 },
      { name: 'Using product information', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 25 },

      // Module 3: Energy – Applications and Uses
      { name: 'Definition forms and sources of energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 26 },
      { name: 'Daily applications of energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 27 },
      { name: 'Common devices using different forms of energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 28 },
      { name: 'Principle of energy conservation', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 29 },
      { name: 'Components and uses of solar energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 30 },
      { name: 'Sources and uses of chemical energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 31 },
      { name: 'Sources and uses of electrical energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 32 },
      { name: 'Sources and uses of heat', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 33 },
      { name: 'Conduction convection radiation', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 34 },
      { name: 'Definition and effects of forces', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 35 },
      { name: 'Definition and types of motion', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 36 },
      { name: 'Safety rules: seat belts road signs', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 37 },

      // Module 4: Health Education
      { name: 'Definition and production of sound', moduleNum: 4, moduleName: 'Health Education', orderIndex: 38 },
      { name: 'The ear and sound perception', moduleNum: 4, moduleName: 'Health Education', orderIndex: 39 },
      { name: 'Effects of loud sound and prevention', moduleNum: 4, moduleName: 'Health Education', orderIndex: 40 },
      { name: 'Measurement of body temperature', moduleNum: 4, moduleName: 'Health Education', orderIndex: 41 },
      { name: 'Normal and abnormal body temperatures', moduleNum: 4, moduleName: 'Health Education', orderIndex: 42 },
      { name: 'Body posture and importance of good posture', moduleNum: 4, moduleName: 'Health Education', orderIndex: 43 },

      // Module 5: Environmental Education and Sustainable Development
      { name: 'Harmful waste and background radiation', moduleNum: 5, moduleName: 'Environmental Education and Sustainable Development', orderIndex: 44 },
      { name: 'Handling radioactive substances', moduleNum: 5, moduleName: 'Environmental Education and Sustainable Development', orderIndex: 45 },
      { name: 'Greenhouse effect', moduleNum: 5, moduleName: 'Environmental Education and Sustainable Development', orderIndex: 46 },
      { name: 'Climate change', moduleNum: 5, moduleName: 'Environmental Education and Sustainable Development', orderIndex: 47 },
      { name: 'Environmental sustainability', moduleNum: 5, moduleName: 'Environmental Education and Sustainable Development', orderIndex: 48 },

      // Module 6: Technology
      { name: 'Machines: identification and uses', moduleNum: 6, moduleName: 'Technology', orderIndex: 49 },
      { name: 'Lubrication cleaning and repairs', moduleNum: 6, moduleName: 'Technology', orderIndex: 50 },
      { name: 'Instruments used in technical drawing', moduleNum: 6, moduleName: 'Technology', orderIndex: 51 },
      { name: 'Sample drawings', moduleNum: 6, moduleName: 'Technology', orderIndex: 52 },
    ],
  },

  // =====================================================================
  // FORM 2
  // =====================================================================
  {
    classLevel: 'Form 2',
    topics: [
      // Module 1: The World of Science
      { name: 'Collecting data and importance of data', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 0 },
      { name: 'Interpreting data and concluding', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 1 },
      { name: 'Predicting and evaluating', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 2 },
      { name: 'Planning and recalling basic quantities', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 3 },
      { name: 'Measurements of speed and units', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 4 },
      { name: 'Measurement of density and units', moduleNum: 1, moduleName: 'The World of Science', orderIndex: 5 },

      // Module 2: Matter – Properties and Transformation
      { name: 'Physical states of matter', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 6 },
      { name: 'Characteristics of matter in different states', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 7 },
      { name: 'Temperature measurement units and effects on matter', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 8 },
      { name: 'Thermal and electrical insulation', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 9 },
      { name: 'Action of heat on materials', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 10 },
      { name: 'Action of electrical energy on materials', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 11 },

      // Module 3: Energy – Value and Uses
      { name: 'Sources and uses of energy', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 12 },
      { name: 'Transmission of energy', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 13 },
      { name: 'Solar panel for heating', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 14 },
      { name: 'Other renewable sources', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 15 },
      { name: 'Electricity for the home', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 16 },
      { name: 'Simple electric circuit', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 17 },
      { name: 'Sources of light', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 18 },
      { name: 'Types of light receivers', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 19 },
      { name: 'Beams and shadows', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 20 },
      { name: 'Linking one form of energy to other forms', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 21 },
      { name: 'Distance time and speed', moduleNum: 3, moduleName: 'Energy – Value and Uses', orderIndex: 22 },

      // Module 4: Health Education
      { name: 'Average blood pressure', moduleNum: 4, moduleName: 'Health Education', orderIndex: 23 },
      { name: 'Demonstrating liquid pressure', moduleNum: 4, moduleName: 'Health Education', orderIndex: 24 },
      { name: 'Sports and physical education', moduleNum: 4, moduleName: 'Health Education', orderIndex: 25 },
      { name: 'The eye as an imaging device', moduleNum: 4, moduleName: 'Health Education', orderIndex: 26 },
      { name: 'Use of lenses to aid eyes with vision defects', moduleNum: 4, moduleName: 'Health Education', orderIndex: 27 },

      // Module 5: Environmental Protection and Sustainable Development
      { name: 'Radiation emitted into the atmosphere', moduleNum: 5, moduleName: 'Environmental Protection and Sustainable Development', orderIndex: 28 },
      { name: 'Cosmic waves from the sun', moduleNum: 5, moduleName: 'Environmental Protection and Sustainable Development', orderIndex: 29 },
      { name: 'The Greenhouse Effect', moduleNum: 5, moduleName: 'Environmental Protection and Sustainable Development', orderIndex: 30 },
      { name: 'Global warming', moduleNum: 5, moduleName: 'Environmental Protection and Sustainable Development', orderIndex: 31 },
      { name: 'Climate change', moduleNum: 5, moduleName: 'Environmental Protection and Sustainable Development', orderIndex: 32 },

      // Module 6: Technology
      { name: 'Review of Form 1', moduleNum: 6, moduleName: 'Technology', orderIndex: 33 },
      { name: 'Introduction to technology', moduleNum: 6, moduleName: 'Technology', orderIndex: 34 },
      { name: 'Fabrication of common instruments', moduleNum: 6, moduleName: 'Technology', orderIndex: 35 },
      { name: 'Care and maintenance', moduleNum: 6, moduleName: 'Technology', orderIndex: 36 },
      { name: 'Principle of functionality of common appliances', moduleNum: 6, moduleName: 'Technology', orderIndex: 37 },
      { name: 'Technical drawing', moduleNum: 6, moduleName: 'Technology', orderIndex: 38 },
    ],
  },

  // =====================================================================
  // FORM 3
  // =====================================================================
  {
    classLevel: 'Form 3',
    topics: [
      // Module 1: Introduction to Mechanics
      { name: 'Definitions examples and units of physical quantities', moduleNum: 1, moduleName: 'Introduction to Mechanics', orderIndex: 0 },
      { name: 'Scalar and vector quantities', moduleNum: 1, moduleName: 'Introduction to Mechanics', orderIndex: 1 },
      { name: 'Prefixes and standard form', moduleNum: 1, moduleName: 'Introduction to Mechanics', orderIndex: 2 },
      { name: 'Basic equipment in force study', moduleNum: 1, moduleName: 'Introduction to Mechanics', orderIndex: 3 },

      // Module 2: Matter – Properties and Transformation
      { name: 'Definition calculation and unit of density', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 4 },
      { name: 'Measurement of density of regular and irregular objects', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 5 },
      { name: 'Applications of density in engineering', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 6 },
      { name: 'Definition calculation and unit of pressure', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 7 },
      { name: 'Factors affecting pressure in solids', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 8 },
      { name: 'Pressure in liquids', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 9 },
      { name: 'Atmospheric pressure', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 10 },
      { name: 'Hydraulic machines', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 11 },
      { name: 'Pressure and health', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 12 },
      { name: 'Definition of elasticity', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 13 },
      { name: 'Elastic and non-elastic materials', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 14 },
      { name: "Hooke's Law and elastic limit", moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 15 },
      { name: 'F–e graphs', moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 16 },
      { name: "Experimental demonstration of Hooke's Law", moduleNum: 2, moduleName: 'Matter – Properties and Transformation', orderIndex: 17 },

      // Module 3: Energy – Applications and Uses
      { name: 'Definition and forms of energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 18 },
      { name: 'Renewable and non-renewable energy sources', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 19 },
      { name: 'Law of conservation of energy', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 20 },
      { name: 'Transducers and energy flow diagrams', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 21 },
      { name: 'Calculations of potential and kinetic energies', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 22 },
      { name: 'Definition and calculation of work', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 23 },
      { name: 'Examples of situations where work is done', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 24 },
      { name: 'Definition and calculation of power', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 25 },
      { name: 'Power ratings of common devices', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 26 },
      { name: 'Definition and advantages of a machine', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 27 },
      { name: 'Mechanical advantage velocity ratio efficiency', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 28 },
      { name: 'Lever inclined plane pulley hydraulic machines', moduleNum: 3, moduleName: 'Energy – Applications and Uses', orderIndex: 29 },

      // Module 4: Optics
      { name: 'Propagation of light', moduleNum: 4, moduleName: 'Optics', orderIndex: 30 },
      { name: 'Rays and types of beams', moduleNum: 4, moduleName: 'Optics', orderIndex: 31 },
      { name: 'Luminous and non-luminous sources', moduleNum: 4, moduleName: 'Optics', orderIndex: 32 },
      { name: 'Shadows and applications', moduleNum: 4, moduleName: 'Optics', orderIndex: 33 },
      { name: 'Laws of reflection', moduleNum: 4, moduleName: 'Optics', orderIndex: 34 },
      { name: 'Image formation by plane mirrors', moduleNum: 4, moduleName: 'Optics', orderIndex: 35 },
      { name: 'Curved mirrors', moduleNum: 4, moduleName: 'Optics', orderIndex: 36 },
      { name: 'Definition of refraction', moduleNum: 4, moduleName: 'Optics', orderIndex: 37 },
      { name: 'Laws of refraction', moduleNum: 4, moduleName: 'Optics', orderIndex: 38 },
      { name: 'Refractive index and speed of light', moduleNum: 4, moduleName: 'Optics', orderIndex: 39 },
      { name: 'Effects of refraction in everyday life', moduleNum: 4, moduleName: 'Optics', orderIndex: 40 },
      { name: 'Real/apparent depth', moduleNum: 4, moduleName: 'Optics', orderIndex: 41 },
      { name: 'Total internal reflection', moduleNum: 4, moduleName: 'Optics', orderIndex: 42 },
      { name: 'Types of lenses', moduleNum: 4, moduleName: 'Optics', orderIndex: 43 },
      { name: 'Ray diagrams for converging and diverging lenses', moduleNum: 4, moduleName: 'Optics', orderIndex: 44 },
      { name: 'Lens formula and magnification', moduleNum: 4, moduleName: 'Optics', orderIndex: 45 },
      { name: 'Definition and demonstration of dispersion', moduleNum: 4, moduleName: 'Optics', orderIndex: 46 },
      { name: 'Formation of a pure spectrum', moduleNum: 4, moduleName: 'Optics', orderIndex: 47 },
      { name: 'Natural occurrence of dispersion', moduleNum: 4, moduleName: 'Optics', orderIndex: 48 },

      // Module 5: Projects and Elementary Engineering
      { name: 'Technical drawing concepts', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 49 },
      { name: '2D diagrams and orthogonal representation', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 50 },
      { name: 'Project types and elements', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 51 },
      { name: 'Feasibility studies', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 52 },
      { name: 'Investigating forces', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 53 },
      { name: 'Relationship between mass and volume', moduleNum: 5, moduleName: 'Projects and Elementary Engineering', orderIndex: 54 },
    ],
  },

  // =====================================================================
  // FORM 4
  // =====================================================================
  {
    classLevel: 'Form 4',
    topics: [
      // Module 1: Energy – Application and Uses
      { name: 'Concept of heat and temperature', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 0 },
      { name: 'Measurement of temperature', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 1 },
      { name: 'Liquid-in-glass thermometer', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 2 },
      { name: 'Calibration using fixed points', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 3 },
      { name: 'Clinical and laboratory thermometers', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 4 },
      { name: 'Heat capacity and specific heat capacity', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 5 },
      { name: 'Measurement of specific heat capacity', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 6 },
      { name: 'Calculations using Q = mc\u0394\u03b8', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 7 },
      { name: 'Latent heat and specific latent heat', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 8 },
      { name: 'Cooling effect', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 9 },
      { name: 'Conduction convection and radiation', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 10 },
      { name: 'The bimetallic strip and its principles', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 11 },
      { name: 'Radiant energy converters', moduleNum: 1, moduleName: 'Energy – Application and Uses', orderIndex: 12 },

      // Module 2: Waves
      { name: 'Definition and classification of waves', moduleNum: 2, moduleName: 'Waves', orderIndex: 13 },
      { name: 'Reflection refraction diffraction and interference', moduleNum: 2, moduleName: 'Waves', orderIndex: 14 },
      { name: 'Calculations using v = f\u03bb', moduleNum: 2, moduleName: 'Waves', orderIndex: 15 },
      { name: 'Stationary waves', moduleNum: 2, moduleName: 'Waves', orderIndex: 16 },
      { name: 'Harmonics and overtones', moduleNum: 2, moduleName: 'Waves', orderIndex: 17 },
      { name: 'Relationship between inter-node distance and wavelength', moduleNum: 2, moduleName: 'Waves', orderIndex: 18 },
      { name: 'Production and transmission of sound', moduleNum: 2, moduleName: 'Waves', orderIndex: 19 },
      { name: 'Characteristics of sound', moduleNum: 2, moduleName: 'Waves', orderIndex: 20 },
      { name: 'Measurement of speed of sound', moduleNum: 2, moduleName: 'Waves', orderIndex: 21 },
      { name: 'Vibrating strings', moduleNum: 2, moduleName: 'Waves', orderIndex: 22 },
      { name: 'Relationship between frequency length mass per unit length and tension', moduleNum: 2, moduleName: 'Waves', orderIndex: 23 },
      { name: 'Forced vibration on string and in a tube', moduleNum: 2, moduleName: 'Waves', orderIndex: 24 },
      { name: 'Definition and explanation of resonance', moduleNum: 2, moduleName: 'Waves', orderIndex: 25 },
      { name: 'Applications of resonance', moduleNum: 2, moduleName: 'Waves', orderIndex: 26 },
      { name: 'Electromagnetic spectrum', moduleNum: 2, moduleName: 'Waves', orderIndex: 27 },
      { name: 'Methods of production and detection of EM waves', moduleNum: 2, moduleName: 'Waves', orderIndex: 28 },
      { name: 'Properties and uses of EM waves', moduleNum: 2, moduleName: 'Waves', orderIndex: 29 },
      { name: 'Health hazards from EM waves', moduleNum: 2, moduleName: 'Waves', orderIndex: 30 },

      // Module 3: Electrical Energy
      { name: 'Charges and their origins', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 31 },
      { name: 'Types of charges and basic law of electrostatics', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 32 },
      { name: "Coulomb's law", moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 33 },
      { name: 'Testing for charge with electroscope', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 34 },
      { name: 'Charging and discharging', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 35 },
      { name: 'Conductors and insulators', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 36 },
      { name: 'Applications of electrostatics', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 37 },
      { name: 'Introduction to electricity and charge movement', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 38 },
      { name: 'Use of meters in circuits', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 39 },
      { name: 'EMF and potential difference', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 40 },
      { name: 'Sources of EMF', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 41 },
      { name: 'Energy consumption: W = QV and P = VI', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 42 },
      { name: "Ohm's Law and resistance", moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 43 },
      { name: 'Series and parallel connections', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 44 },
      { name: 'DC and AC definitions', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 45 },
      { name: 'Power dissipated and consumed (kWh)', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 46 },
      { name: 'Ring circuit and linear circuit in house wiring', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 47 },
      { name: 'Fuse and selection', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 48 },
      { name: 'Safety precautions', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 49 },
      { name: 'The cathode ray oscilloscope', moduleNum: 3, moduleName: 'Electrical Energy', orderIndex: 50 },

      // Module 4: Projects and Elementary Engineering
      { name: 'Technical drawing basics', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 51 },
      { name: 'Reading of technical drawings', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 52 },
      { name: 'Cross section of an object', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 53 },
      { name: 'Building plans and construction drawings', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 54 },
    ],
  },

  // =====================================================================
  // FORM 5
  // =====================================================================
  {
    classLevel: 'Form 5',
    topics: [
      // Module 1: Fields – Magnetic Fields and Their Effects
      { name: 'Introduction to magnetism', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 0 },
      { name: 'Law of magnetism', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 1 },
      { name: 'Applications of magnets', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 2 },
      { name: 'Hard and soft magnetic materials', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 3 },
      { name: 'Magnetic flux pattern', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 4 },
      { name: 'Drawing magnetic field lines', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 5 },
      { name: 'Magnetic field pattern of a straight conductor', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 6 },
      { name: 'Direction of field lines in solenoid', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 7 },
      { name: 'Force on a current-carrying conductor', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 8 },
      { name: 'Principle of electric motor', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 9 },
      { name: 'Introduction to electromagnetic induction', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 10 },
      { name: "Faraday's law", moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 11 },
      { name: "Lenz's law", moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 12 },
      { name: 'Conservation of energy', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 13 },
      { name: 'Mutual inductance', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 14 },
      { name: 'The transformer', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 15 },
      { name: 'Energy losses and turn ratio', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 16 },
      { name: 'Efficiency and power transmission', moduleNum: 1, moduleName: 'Fields – Magnetic Fields and Their Effects', orderIndex: 17 },

      // Module 2: Environmental Protection – Modern Physics and Basic Electronics
      { name: 'Nuclear model of the atom', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 18 },
      { name: 'Composition of the atom', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 19 },
      { name: 'The electron (Q = Ne)', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 20 },
      { name: 'Nuclear stability', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 21 },
      { name: 'Radioactivity and decay equations', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 22 },
      { name: 'Alpha beta and gamma decay and properties', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 23 },
      { name: 'Concept of half-life', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 24 },
      { name: 'Importance and use of isotopes', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 25 },
      { name: 'Background radiation', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 26 },
      { name: 'Uses of radioactive isotopes in medicine and agriculture', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 27 },
      { name: 'Safety and hazards of radioactivity', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 28 },
      { name: 'Semiconductors: intrinsic and extrinsic', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 29 },
      { name: 'P-type and N-type semiconductors', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 30 },
      { name: 'P-n junctions and rectification', moduleNum: 2, moduleName: 'Environmental Protection – Modern Physics and Basic Electronics', orderIndex: 31 },

      // Module 3: Mechanics
      { name: 'Vector and scalar quantities', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 32 },
      { name: 'Types of forces', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 33 },
      { name: 'Resolution of forces', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 34 },
      { name: 'Free body diagrams', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 35 },
      { name: "Archimedes' Principle", moduleNum: 3, moduleName: 'Mechanics', orderIndex: 36 },
      { name: 'Turning effect of forces', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 37 },
      { name: 'Moments couples and applications', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 38 },
      { name: 'Distance displacement speed velocity acceleration', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 39 },
      { name: 'Motion graphs', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 40 },
      { name: 'Equations of uniformly accelerated linear motion', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 41 },
      { name: 'Free fall and gravity', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 42 },
      { name: 'Experiment to determine g', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 43 },
      { name: 'Linear momentum', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 44 },
      { name: 'Conservation of momentum', moduleNum: 3, moduleName: 'Mechanics', orderIndex: 45 },
      { name: "Newton's laws of motion", moduleNum: 3, moduleName: 'Mechanics', orderIndex: 46 },

      // Module 4: Projects and Elementary Engineering
      { name: 'Preservation and maintenance of appliances', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 47 },
      { name: 'Essential elements in a repair box', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 48 },
      { name: 'Labelling on appliances', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 49 },
      { name: 'Techniques of dismantling and assembling (FILO and LIFO)', moduleNum: 4, moduleName: 'Projects and Elementary Engineering', orderIndex: 50 },
    ],
  },

  // =====================================================================
  // LOWER SIXTH
  // =====================================================================
  {
    classLevel: 'Lower Sixth',
    topics: [
      // Module 1: Physical Quantities
      { name: 'Base and derived physical quantities/units SI units', moduleNum: 1, moduleName: 'Physical Quantities', orderIndex: 0 },
      { name: 'Dimensions and homogeneity of physical equations', moduleNum: 1, moduleName: 'Physical Quantities', orderIndex: 1 },
      { name: 'Experimental techniques accuracy sensitivity error and precautions', moduleNum: 1, moduleName: 'Physical Quantities', orderIndex: 2 },

      // Module 2: Mechanics
      { name: 'Motion distance/displacement speed/velocity linear momentum acceleration', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 3 },
      { name: 'Graphs of motion and equations of uniformly accelerated motion', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 4 },
      { name: 'Motion under gravity and experiment to measure g', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 5 },
      { name: 'Projectile motion', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 6 },
      { name: 'Meaning and nature of forces', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 7 },
      { name: 'Centre of gravity and centre of mass', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 8 },
      { name: 'Free-body diagrams and resultant of coplanar forces', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 9 },
      { name: 'Turning effect of forces moments and couples', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 10 },
      { name: "Newton's first and second laws", moduleNum: 2, moduleName: 'Mechanics', orderIndex: 11 },
      { name: 'Impulse', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 12 },
      { name: "Newton's third law", moduleNum: 2, moduleName: 'Mechanics', orderIndex: 13 },
      { name: 'Law of conservation of linear momentum', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 14 },
      { name: 'Elastic and inelastic collisions', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 15 },
      { name: 'Explosions head-on and oblique collisions', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 16 },
      { name: 'Work potential energy and kinetic energy', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 17 },
      { name: 'Law of conservation of mechanical energy', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 18 },
      { name: 'Work-kinetic energy theorem', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 19 },
      { name: 'Efficiency and power', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 20 },
      { name: 'Period and frequency', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 21 },
      { name: 'Angular speed and velocity', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 22 },
      { name: 'Centripetal acceleration and force', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 23 },
      { name: 'Motion in a vertical circle', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 24 },
      { name: 'Conical pendulum', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 25 },
      { name: 'Cornering and banking', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 26 },
      { name: 'Meaning and equations of SHM', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 27 },
      { name: 'Energy changes in SHM', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 28 },
      { name: 'Examples of simple harmonic oscillators', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 29 },
      { name: 'Mechanical oscillations and resonance', moduleNum: 2, moduleName: 'Mechanics', orderIndex: 30 },

      // Module 3: Energetics
      { name: 'Thermal equilibrium and zeroth law', moduleNum: 3, moduleName: 'Energetics', orderIndex: 31 },
      { name: 'Thermometric properties', moduleNum: 3, moduleName: 'Energetics', orderIndex: 32 },
      { name: 'Temperature measurement and scales', moduleNum: 3, moduleName: 'Energetics', orderIndex: 33 },
      { name: 'Types of thermometers', moduleNum: 3, moduleName: 'Energetics', orderIndex: 34 },
      { name: 'Heat capacity and specific heat capacity', moduleNum: 3, moduleName: 'Energetics', orderIndex: 35 },
      { name: 'Latent heat and specific latent heat', moduleNum: 3, moduleName: 'Energetics', orderIndex: 36 },
      { name: 'Heating and cooling curves', moduleNum: 3, moduleName: 'Energetics', orderIndex: 37 },
      { name: 'Thermal conduction and temperature gradient', moduleNum: 3, moduleName: 'Energetics', orderIndex: 38 },
      { name: 'Thermal conductivity', moduleNum: 3, moduleName: 'Energetics', orderIndex: 39 },
      { name: 'Thermal convection and radiation', moduleNum: 3, moduleName: 'Energetics', orderIndex: 40 },
      { name: 'Electric current potential difference drift velocity', moduleNum: 3, moduleName: 'Energetics', orderIndex: 41 },
      { name: "Electrical resistance Ohm's Law and resistivity", moduleNum: 3, moduleName: 'Energetics', orderIndex: 42 },
      { name: 'Resistor networks and potential divider', moduleNum: 3, moduleName: 'Energetics', orderIndex: 43 },
      { name: 'EMF terminal p.d. and internal resistance', moduleNum: 3, moduleName: 'Energetics', orderIndex: 44 },
      { name: "Kirchhoff's laws", moduleNum: 3, moduleName: 'Energetics', orderIndex: 45 },
      { name: 'Potentiometer', moduleNum: 3, moduleName: 'Energetics', orderIndex: 46 },
      { name: 'Wheatstone bridge circuit', moduleNum: 3, moduleName: 'Energetics', orderIndex: 47 },
      { name: 'Classification of energy sources', moduleNum: 3, moduleName: 'Energetics', orderIndex: 48 },
      { name: 'Hydroelectricity and wind energy', moduleNum: 3, moduleName: 'Energetics', orderIndex: 49 },
      { name: 'Solar energy and tidal energy', moduleNum: 3, moduleName: 'Energetics', orderIndex: 50 },
      { name: 'Biomass geothermal energy and wave energy', moduleNum: 3, moduleName: 'Energetics', orderIndex: 51 },
      { name: 'Fossil fuels and nuclear fuel', moduleNum: 3, moduleName: 'Energetics', orderIndex: 52 },
      { name: 'Greenhouse effect global warming and climate change', moduleNum: 3, moduleName: 'Energetics', orderIndex: 53 },

      // Module 4: Matter – Effects of Energy and Application
      { name: 'Molecular properties of solids liquids and gases', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 54 },
      { name: 'Intermolecular force vs separation curves', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 55 },
      { name: "Elasticity and Young's modulus", moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 56 },
      { name: 'Energy stored in a stretched wire', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 57 },
      { name: 'Surface tension and capillarity', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 58 },
      { name: 'Brownian motion in gases', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 59 },
      { name: 'Gas laws and the ideal gas equation', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 60 },
      { name: 'Kinetic theory of ideal gases', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 61 },
      { name: 'Distribution of molecular speeds', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 62 },
      { name: "Real gases and Andrew's experiment", moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 63 },
      { name: 'First law of thermodynamics', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 64 },
      { name: 'Second law of thermodynamics', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 65 },
      { name: 'Basic function of heat engines', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 66 },
      { name: 'Entropy', moduleNum: 4, moduleName: 'Matter – Effects of Energy and Application', orderIndex: 67 },
    ],
  },

  // =====================================================================
  // UPPER SIXTH
  // =====================================================================
  {
    classLevel: 'Upper Sixth',
    topics: [
      // Module 5: Field Phenomena
      { name: "Newton's law of universal gravitation", moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 0 },
      { name: "Kepler's laws", moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 1 },
      { name: 'Gravitational field strength', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 2 },
      { name: 'Variation of g inside and outside the earth', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 3 },
      { name: 'Gravitational potential and potential energy', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 4 },
      { name: 'Escape velocity', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 5 },
      { name: 'Orbital speed and geostationary satellites', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 6 },
      { name: 'Electric charge and current', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 7 },
      { name: 'Charging by friction contact induction and chemical action', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 8 },
      { name: 'Point action and lightning conductor', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 9 },
      { name: "Coulomb's law", moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 10 },
      { name: 'Electric field and field strength', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 11 },
      { name: 'Electric potential and work done in an electric field', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 12 },
      { name: 'Identification of capacitors and circuit symbols', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 13 },
      { name: 'Measurement of capacitance', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 14 },
      { name: 'Factors affecting capacitance', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 15 },
      { name: 'Relative permittivity', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 16 },
      { name: 'Combination of capacitors', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 17 },
      { name: 'Energy/charge stored in capacitors', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 18 },
      { name: 'Charging and discharging through resistors and time constant', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 19 },
      { name: 'Magnetic flux density and the tesla', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 20 },
      { name: 'Field patterns of current-carrying conductors', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 21 },
      { name: 'Force on a current-carrying conductor', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 22 },
      { name: 'Torque on a rectangular coil', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 23 },
      { name: 'Principle of the electric motor', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 24 },
      { name: 'Biot-Savart law', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 25 },
      { name: "Ampere's law", moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 26 },
      { name: 'Force on a moving charge in a magnetic field', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 27 },
      { name: 'Hall effect', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 28 },
      { name: 'Magnetic materials and shielding', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 29 },
      { name: "Faraday's and Lenz's laws", moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 30 },
      { name: 'Induced EMF', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 31 },
      { name: 'Simple DC and AC generators', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 32 },
      { name: 'Self-inductance and mutual inductance', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 33 },
      { name: 'Energy stored in an inductor', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 34 },
      { name: 'Theory of transformers', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 35 },
      { name: 'Root-mean-square values', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 36 },
      { name: 'Impedance and resonance', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 37 },
      { name: 'Power in AC circuits', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 38 },
      { name: 'Rectification and smoothening', moduleNum: 5, moduleName: 'Field Phenomena', orderIndex: 39 },

      // Module 6: Waves Around Us
      { name: 'Classification of waves', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 40 },
      { name: 'The progressive wave and equation', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 41 },
      { name: 'Graphical representation of waves', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 42 },
      { name: 'Properties of waves: reflection refraction diffraction interference', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 43 },
      { name: 'Single slit and double slit patterns', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 44 },
      { name: 'Polarization', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 45 },
      { name: 'Factors affecting speed of transverse waves on strings', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 46 },
      { name: 'Doppler Effect', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 47 },
      { name: 'Stationary waves', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 48 },
      { name: 'Measurement of speed of sound in air', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 49 },
      { name: 'EM waves and their characteristics', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 50 },
      { name: 'EM spectrum: production detection and uses', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 51 },
      { name: 'X-rays: production and uses', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 52 },
      { name: 'Plane polarized EM waves', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 53 },
      { name: 'Optical transmission grating', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 54 },
      { name: 'Multiple slit diffraction', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 55 },
      { name: 'Reflection and refraction at plane interfaces', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 56 },
      { name: 'Laws of refraction and refractive index', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 57 },
      { name: 'Dispersion', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 58 },
      { name: 'Total internal reflection and critical angle', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 59 },
      { name: 'Lenses: principal focus focal length', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 60 },
      { name: 'Optical instruments: compound microscopes and astronomical telescopes', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 61 },
      { name: 'Photoelectric effect', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 62 },
      { name: "Photons and Planck's constant", moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 63 },
      { name: "Einstein's photoelectric equation", moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 64 },
      { name: 'Wave-particle duality', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 65 },
      { name: 'Emission and absorption spectra', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 66 },
      { name: 'Energy levels and the electron volt', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 67 },
      { name: "Rutherford's alpha scattering experiment", moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 68 },
      { name: 'Atomic model', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 69 },
      { name: 'Energy levels', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 70 },
      { name: 'Nuclear stability and radioactivity', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 71 },
      { name: 'Properties of radiations and applications', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 72 },
      { name: 'Mass defect in nuclear processes', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 73 },
      { name: 'Nuclear fission and fusion', moduleNum: 6, moduleName: 'Waves Around Us', orderIndex: 74 },

      // Module 7: Electronics (Option)
      { name: 'Thermionic emission and the electron gun', moduleNum: 7, moduleName: 'Electronics (Option)', orderIndex: 75 },
      { name: 'Semiconductors and doping', moduleNum: 7, moduleName: 'Electronics (Option)', orderIndex: 76 },
      { name: 'The p-n junction diode biasing and applications', moduleNum: 7, moduleName: 'Electronics (Option)', orderIndex: 77 },
      { name: 'The transistor', moduleNum: 7, moduleName: 'Electronics (Option)', orderIndex: 78 },
      { name: 'Logic gates and amplifiers', moduleNum: 7, moduleName: 'Electronics (Option)', orderIndex: 79 },

      // Module 8: Communication (Option)
      { name: 'Representing information: analogue and digital methods', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 80 },
      { name: 'Radio waves: surface/ground wave sky wave space wave', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 81 },
      { name: 'Aerials: transmitting and receiving', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 82 },
      { name: 'Tuning circuit and resonance', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 83 },
      { name: 'Modulation and demodulation (AM and FM)', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 84 },
      { name: 'Communication channels: bandwidth sidebands', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 85 },
      { name: 'Use of satellite for communication', moduleNum: 8, moduleName: 'Communication (Option)', orderIndex: 86 },

      // Module 9: Medical Physics (Option)
      { name: 'The physics of vision and defects', moduleNum: 9, moduleName: 'Medical Physics (Option)', orderIndex: 87 },
      { name: 'Hearing and defects', moduleNum: 9, moduleName: 'Medical Physics (Option)', orderIndex: 88 },
      { name: 'Biological measurements for the heart', moduleNum: 9, moduleName: 'Medical Physics (Option)', orderIndex: 89 },
      { name: 'Imaging in medical diagnosis (non-ionising and ionising methods)', moduleNum: 9, moduleName: 'Medical Physics (Option)', orderIndex: 90 },
      { name: 'Use of optical fibres in medical procedures', moduleNum: 9, moduleName: 'Medical Physics (Option)', orderIndex: 91 },
    ],
  },
];
