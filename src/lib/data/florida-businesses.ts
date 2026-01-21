/**
 * Florida Home Service Businesses Database
 * Target: Businesses that need AI video content for social media
 * Package: 20 videos / $2,000
 */

export interface FloridaBusiness {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  city: string;
  region: "South Florida" | "Central Florida" | "Tampa Bay" | "Jacksonville" | "Panhandle";
  phone: string;
  website?: string;
  email?: string;
  estimatedRevenue: "Under $500K" | "$500K-$1M" | "$1M-$5M" | "$5M-$10M" | "$10M+";
  employeeCount: "1-5" | "6-10" | "11-25" | "26-50" | "51+";
  yearsInBusiness: number;
  signals: string[];
  socialPresence: {
    facebook?: boolean;
    instagram?: boolean;
    youtube?: boolean;
    tiktok?: boolean;
    hasVideo?: boolean;
  };
  score: number;
  whyNow: string;
  painPoints: string[];
  idealFor: string[];

  // Video buyer criteria - WHY they would buy AI video content
  videoBuyerCriteria: {
    primaryUseCase: "meta_ads" | "organic_social" | "website" | "google_lsa" | "youtube_ads" | "email_marketing";
    useCases: string[];  // Multiple use cases they'd benefit from
    buyingIntent: "high" | "medium" | "low";
    buyingIntentReasons: string[];  // Specific reasons they're likely to buy
    idealVideoTypes: string[];  // Types of videos that would work for them
    estimatedROI: string;  // Projected ROI from video
    competitorThreat: boolean;  // Are competitors using video?
    seasonalUrgency: boolean;  // Is there seasonal pressure?
    adSpendEstimate: "none" | "low" | "medium" | "high";  // Current ad spend level
    decisionMaker: string;  // Who makes the buying decision
    objections: string[];  // Common objections they might have
    closingAngle: string;  // Best angle to close the deal
  };
}

// Categories of home service businesses
const CATEGORIES: Record<string, string[]> = {
  "Roofing": ["Residential Roofing", "Commercial Roofing", "Roof Repair", "Storm Damage"],
  "HVAC": ["AC Repair", "AC Installation", "Heating", "Ductwork"],
  "Plumbing": ["Emergency Plumbing", "Drain Cleaning", "Water Heater", "Repiping"],
  "Electrical": ["Residential Electrical", "Commercial Electrical", "Panel Upgrades", "Lighting"],
  "Pool Service": ["Pool Cleaning", "Pool Repair", "Pool Remodeling", "Pool Construction"],
  "Landscaping": ["Lawn Care", "Landscape Design", "Irrigation", "Tree Service"],
  "Pest Control": ["General Pest", "Termite", "Rodent Control", "Mosquito Control"],
  "Cleaning": ["House Cleaning", "Commercial Cleaning", "Pressure Washing", "Window Cleaning"],
  "Painting": ["Interior Painting", "Exterior Painting", "Commercial Painting", "Cabinet Refinishing"],
  "Flooring": ["Tile Installation", "Hardwood", "Carpet", "Epoxy Flooring"],
  "Kitchen & Bath": ["Kitchen Remodel", "Bathroom Remodel", "Countertops", "Cabinets"],
  "Garage Doors": ["Garage Door Repair", "Garage Door Installation", "Opener Repair"],
  "Windows & Doors": ["Window Replacement", "Door Installation", "Impact Windows", "Screen Repair"],
  "Fencing": ["Wood Fence", "Vinyl Fence", "Aluminum Fence", "Chain Link"],
  "Concrete": ["Driveways", "Patios", "Pool Decks", "Foundations"],
  "Solar": ["Solar Installation", "Solar Repair", "Battery Storage"],
  "Security": ["Alarm Systems", "Camera Installation", "Smart Home", "Access Control"],
  "Moving": ["Local Moving", "Long Distance", "Packing Services", "Storage"],
  "Handyman": ["General Repairs", "Furniture Assembly", "Drywall Repair", "Deck Repair"],
  "Septic": ["Septic Pumping", "Septic Repair", "Drain Field", "Septic Installation"],
};

// Florida cities by region
const FLORIDA_CITIES: Record<string, string[]> = {
  "South Florida": ["Miami", "Fort Lauderdale", "West Palm Beach", "Boca Raton", "Hollywood", "Pembroke Pines", "Coral Springs", "Plantation", "Davie", "Sunrise", "Pompano Beach", "Deerfield Beach", "Boynton Beach", "Delray Beach", "Jupiter", "Palm Beach Gardens", "Wellington", "Homestead", "Kendall", "Hialeah"],
  "Central Florida": ["Orlando", "Kissimmee", "Sanford", "Clermont", "Winter Park", "Altamonte Springs", "Oviedo", "Lake Mary", "Daytona Beach", "Deltona", "Palm Bay", "Melbourne", "Titusville", "Cocoa", "Ocala", "Gainesville", "Lakeland", "Winter Haven"],
  "Tampa Bay": ["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Largo", "Bradenton", "Sarasota", "Venice", "Port Charlotte", "Cape Coral", "Fort Myers", "Naples", "Bonita Springs", "Estero", "Punta Gorda"],
  "Jacksonville": ["Jacksonville", "St. Augustine", "Orange Park", "Fleming Island", "Ponte Vedra", "Jacksonville Beach", "Neptune Beach", "Atlantic Beach", "Fernandina Beach", "Yulee", "Green Cove Springs"],
  "Panhandle": ["Pensacola", "Fort Walton Beach", "Destin", "Panama City", "Panama City Beach", "Tallahassee", "Crestview", "Niceville", "Navarre", "Gulf Breeze"],
};

// Common business name patterns
const NAME_PATTERNS: Record<string, string[]> = {
  "Roofing": ["Roofing", "Roof", "Roofers", "Roofing Co", "Roofing Services", "Roofing Solutions"],
  "HVAC": ["Air Conditioning", "AC", "HVAC", "Heating & Cooling", "Climate Control", "Air Solutions"],
  "Plumbing": ["Plumbing", "Plumbers", "Plumbing Services", "Pipe", "Drain"],
  "Electrical": ["Electric", "Electrical", "Electricians", "Power", "Wiring"],
  "Pool Service": ["Pool", "Pools", "Pool Service", "Pool Care", "Aqua"],
  "Landscaping": ["Landscaping", "Lawn", "Lawn Care", "Gardens", "Green", "Outdoor"],
  "Pest Control": ["Pest Control", "Pest", "Exterminating", "Bug", "Termite"],
  "Cleaning": ["Cleaning", "Clean", "Maids", "Janitorial", "Spotless"],
  "Painting": ["Painting", "Painters", "Paint", "Coatings"],
  "Flooring": ["Flooring", "Floors", "Tile", "Hardwood"],
  "Kitchen & Bath": ["Kitchen", "Bath", "Remodeling", "Renovations"],
  "Garage Doors": ["Garage Door", "Overhead Door", "Door"],
  "Windows & Doors": ["Windows", "Doors", "Glass", "Impact"],
  "Fencing": ["Fence", "Fencing", "Fence Co"],
  "Concrete": ["Concrete", "Paving", "Masonry", "Pavers"],
  "Solar": ["Solar", "Sun", "Energy", "Power"],
  "Security": ["Security", "Alarm", "Safe", "Protection"],
  "Moving": ["Moving", "Movers", "Relocation", "Moving Co"],
  "Handyman": ["Handyman", "Home Repair", "Fix-It", "Home Services"],
  "Septic": ["Septic", "Septic Tank", "Pumping"],
};

const FIRST_NAMES = ["Mike", "John", "Dave", "Steve", "Tom", "Bob", "Jim", "Joe", "Dan", "Chris", "Matt", "Tony", "Rick", "Bill", "Pete", "Frank", "Carlos", "Jose", "Luis", "Juan", "Alex", "Nick", "Mark", "Paul", "Gary", "Scott", "Brian", "Kevin", "Jason", "Eric"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

// Generate a phone number
function generatePhone(city: string): string {
  const areaCodes: Record<string, string[]> = {
    "Miami": ["305", "786"],
    "Fort Lauderdale": ["954"],
    "West Palm Beach": ["561"],
    "Orlando": ["407", "321"],
    "Tampa": ["813"],
    "St. Petersburg": ["727"],
    "Jacksonville": ["904"],
    "Pensacola": ["850"],
    "default": ["239", "352", "386", "772", "863"],
  };
  const codes = areaCodes[city] || areaCodes["default"];
  const areaCode = codes[Math.floor(Math.random() * codes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${subscriber}`;
}

// Generate business name
function generateBusinessName(category: string, city: string): string {
  const patterns = NAME_PATTERNS[category] || [category];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const nameStyles = [
    () => `${city} ${pattern}`,
    () => `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}'s ${pattern}`,
    () => `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${pattern}`,
    () => `${["A+", "Pro", "Elite", "Premier", "Quality", "Reliable", "Trusted", "Expert", "Master", "Superior"][Math.floor(Math.random() * 10)]} ${pattern}`,
    () => `${["All-Star", "First Choice", "Best", "Top Notch", "Sunshine", "Florida", "Gulf Coast", "Atlantic"][Math.floor(Math.random() * 8)]} ${pattern}`,
    () => `${pattern} ${["Pros", "Experts", "Specialists", "Masters", "Plus", "Solutions", "Services", "Co"][Math.floor(Math.random() * 8)]}`,
  ];
  return nameStyles[Math.floor(Math.random() * nameStyles.length)]();
}

// Generate signals based on category and other factors
function generateSignals(category: string, revenue: string, employees: string, yearsInBusiness: number): string[] {
  const signals: string[] = [];

  // Revenue-based signals
  if (revenue === "$1M-$5M" || revenue === "$5M-$10M" || revenue === "$10M+") {
    signals.push("Growing revenue - ready to invest in marketing");
  }
  if (revenue === "$500K-$1M") {
    signals.push("Scaling business - needs brand awareness");
  }

  // Employee-based signals
  if (employees === "11-25" || employees === "26-50" || employees === "51+") {
    signals.push("Multiple crews - can handle more leads");
  }
  if (employees === "6-10") {
    signals.push("Growing team - expanding capacity");
  }

  // Years in business signals
  if (yearsInBusiness >= 10) {
    signals.push("Established business - ready for modern marketing");
  }
  if (yearsInBusiness >= 5 && yearsInBusiness < 10) {
    signals.push("Proven track record - scaling phase");
  }
  if (yearsInBusiness < 5) {
    signals.push("New business - needs visibility fast");
  }

  // Category-specific signals
  const categorySignals: Record<string, string[]> = {
    "Roofing": ["Storm season approaching", "High-ticket services need trust building", "Before/after content performs well"],
    "HVAC": ["Seasonal demand spikes", "Emergency services need top-of-mind awareness", "Educational content builds trust"],
    "Plumbing": ["Emergency services drive calls", "Trust is critical for in-home services", "Video testimonials convert well"],
    "Pool Service": ["Visual services perfect for video", "Seasonal business needs year-round presence", "Transformation content performs well"],
    "Landscaping": ["Highly visual before/after potential", "Seasonal services need constant visibility", "Local SEO competition high"],
    "Pest Control": ["Trust critical for in-home services", "Educational content builds authority", "Recurring service model benefits from brand"],
    "Cleaning": ["Trust and reliability key differentiators", "Before/after content converts", "Referral business needs social proof"],
    "Painting": ["Perfect for before/after videos", "Color consultations drive engagement", "Portfolio-driven business"],
    "Solar": ["High consideration purchase needs education", "ROI content performs well", "Trust-building critical for big ticket"],
    "Kitchen & Bath": ["High-value projects need portfolio", "Design inspiration drives leads", "Trust critical for major renovations"],
  };

  if (categorySignals[category]) {
    signals.push(...categorySignals[category].slice(0, 2));
  }

  // Random additional signals
  const additionalSignals = [
    "Competitors using video ads",
    "Limited social media presence",
    "No video content currently",
    "Strong reviews need showcasing",
    "Service area expanding",
    "New services launching",
    "Busy season approaching",
    "Website lacks video content",
  ];
  signals.push(additionalSignals[Math.floor(Math.random() * additionalSignals.length)]);

  return signals;
}

// Generate pain points
function generatePainPoints(category: string): string[] {
  const commonPains = [
    "Struggling to stand out from competitors",
    "Leads going to bigger companies with better marketing",
    "No time to create content consistently",
    "Don't know how to make engaging videos",
    "Social media feels overwhelming",
    "Paying too much for low-quality leads",
  ];

  const categoryPains: Record<string, string[]> = {
    "Roofing": ["Storm chasers stealing market share", "Hard to show quality difference", "Trust issues after bad contractors"],
    "HVAC": ["Price shoppers not seeing value", "Emergency calls going to first Google result", "Seasonal cash flow challenges"],
    "Plumbing": ["Customers don't know who to trust", "Emergency calls need instant recognition", "Hard to differentiate services"],
    "Pool Service": ["Seasonal business needs year-round marketing", "Customers shop on price alone", "Hard to show quality difference"],
    "Solar": ["Long sales cycle needs nurturing", "Customers confused by options", "Trust critical for big investment"],
  };

  const pains = [...commonPains.slice(0, 3)];
  if (categoryPains[category]) {
    pains.push(...categoryPains[category].slice(0, 2));
  }

  return pains;
}

// Generate ideal use cases
function generateIdealFor(category: string): string[] {
  return [
    "Before/after transformation videos",
    "Customer testimonial videos",
    "Service explainer videos",
    "Team introduction videos",
    "FAQ and educational content",
    "Seasonal promotion videos",
    "Behind-the-scenes content",
    "Project showcase reels",
  ].slice(0, 4);
}

// Generate video buyer criteria - WHY they would buy AI video content
function generateVideoBuyerCriteria(
  category: string,
  revenue: string,
  employees: string,
  yearsInBusiness: number,
  socialPresence: FloridaBusiness["socialPresence"]
): FloridaBusiness["videoBuyerCriteria"] {
  // Determine primary use case based on business size and social presence
  let primaryUseCase: FloridaBusiness["videoBuyerCriteria"]["primaryUseCase"] = "organic_social";
  let adSpendEstimate: FloridaBusiness["videoBuyerCriteria"]["adSpendEstimate"] = "none";

  if (revenue === "$1M-$5M" || revenue === "$5M-$10M" || revenue === "$10M+") {
    primaryUseCase = "meta_ads";
    adSpendEstimate = revenue === "$10M+" ? "high" : revenue === "$5M-$10M" ? "medium" : "low";
  } else if (socialPresence.facebook && !socialPresence.hasVideo) {
    primaryUseCase = "organic_social";
    adSpendEstimate = "low";
  } else if (!socialPresence.facebook && !socialPresence.instagram) {
    primaryUseCase = "google_lsa";
    adSpendEstimate = "none";
  }

  // Category-specific use cases
  const categoryUseCases: Record<string, string[]> = {
    "Roofing": [
      "Meta Ads: Before/after roof transformations drive leads",
      "Google LSA: Trust-building videos boost ad performance",
      "Website: Project showcase increases conversion rates",
      "Organic Social: Storm prep content builds local following",
    ],
    "HVAC": [
      "Meta Ads: Emergency AC repair ads during heat waves",
      "Organic Social: Maintenance tip videos build trust",
      "Google LSA: Team intro videos increase call rates",
      "Website: Service explainers reduce tire-kickers",
    ],
    "Plumbing": [
      "Meta Ads: Emergency plumbing ads convert at 3x",
      "Organic Social: DIY tips with CTA for complex jobs",
      "Google LSA: Trust signals for in-home services",
      "Website: FAQ videos reduce support calls",
    ],
    "Pool Service": [
      "Meta Ads: Seasonal pool opening campaigns",
      "Organic Social: Satisfying cleaning timelapses go viral",
      "Instagram Reels: Before/after pool transformations",
      "Website: Service tier explainers upsell premium",
    ],
    "Landscaping": [
      "Meta Ads: Seasonal landscaping campaigns",
      "Organic Social: Transformation timelapse videos",
      "Instagram Reels: Satisfying lawn care content",
      "Website: Design portfolio showcases",
    ],
    "Painting": [
      "Meta Ads: Before/after reveals drive high engagement",
      "Organic Social: Color consultation videos build authority",
      "Instagram Reels: Satisfying painting reveals",
      "Website: Portfolio videos increase quote requests",
    ],
    "Solar": [
      "Meta Ads: ROI calculator videos for high-ticket sales",
      "YouTube: Long-form educational content for consideration phase",
      "Website: Installation process videos reduce objections",
      "Email: Nurture sequence videos for long sales cycle",
    ],
    "Kitchen & Bath": [
      "Meta Ads: Renovation reveal videos drive inquiries",
      "Instagram: Design inspiration content builds following",
      "Website: Project portfolio videos increase average job size",
      "YouTube: Full renovation process builds trust",
    ],
    "Pest Control": [
      "Meta Ads: Seasonal pest warnings drive urgency",
      "Organic Social: Educational pest ID content",
      "Google LSA: Trust videos for in-home services",
      "Website: Treatment process videos ease concerns",
    ],
    "default": [
      "Meta Ads: Local service ads with video get 2x CTR",
      "Organic Social: Behind-the-scenes builds trust",
      "Google LSA: Video thumbnails increase click rates",
      "Website: Service videos improve conversion",
    ],
  };

  const useCases = categoryUseCases[category] || categoryUseCases["default"];

  // Determine buying intent
  let buyingIntent: "high" | "medium" | "low" = "medium";
  const buyingIntentReasons: string[] = [];

  // High intent signals
  if (!socialPresence.hasVideo && (revenue === "$1M-$5M" || revenue === "$5M-$10M")) {
    buyingIntent = "high";
    buyingIntentReasons.push("Revenue indicates budget, no video indicates gap");
  }
  if (!socialPresence.hasVideo && socialPresence.facebook) {
    buyingIntent = "high";
    buyingIntentReasons.push("Already on social but missing video content");
  }
  if (employees === "11-25" || employees === "26-50") {
    buyingIntentReasons.push("Team size suggests growth mode");
  }
  if (yearsInBusiness >= 5 && yearsInBusiness <= 15) {
    buyingIntentReasons.push("Established but still growth-focused");
  }

  // Low intent signals
  if (revenue === "Under $500K" && !socialPresence.facebook) {
    buyingIntent = "low";
    buyingIntentReasons.push("Small operation, may not prioritize marketing");
  }

  // Category-specific video types
  const categoryVideoTypes: Record<string, string[]> = {
    "Roofing": ["Drone inspection reveals", "Storm damage assessments", "Before/after transformations", "Team safety training", "Customer testimonials"],
    "HVAC": ["Emergency repair stories", "Maintenance tutorials", "Energy saving tips", "New system installations", "Seasonal prep content"],
    "Plumbing": ["Problem diagnosis videos", "Emergency response stories", "Maintenance tips", "Fixture installation guides", "Water heater comparisons"],
    "Pool Service": ["Cleaning timelapses", "Chemical balancing tips", "Seasonal opening/closing", "Equipment maintenance", "Renovation reveals"],
    "Landscaping": ["Transformation timelapses", "Design consultations", "Seasonal care tips", "Equipment in action", "Team spotlights"],
    "Painting": ["Color consultation", "Painting reveals", "Prep work process", "Texture techniques", "Before/after compilations"],
    "Solar": ["ROI explainers", "Installation process", "Energy monitoring", "Customer savings stories", "Technology comparisons"],
    "default": ["Service demonstrations", "Customer testimonials", "Team introductions", "FAQ answers", "Process walkthroughs"],
  };

  const idealVideoTypes = categoryVideoTypes[category] || categoryVideoTypes["default"];

  // Estimate ROI
  const roiEstimates: Record<string, string> = {
    "Roofing": "Average roof job $8-15K. One video-driven lead = 100-200x ROI",
    "HVAC": "Average HVAC install $5-12K. Video ads typically 2-3x conversion rate",
    "Plumbing": "Emergency calls $200-500. High volume potential with video ads",
    "Pool Service": "Monthly service $150-300. Video builds long-term relationships",
    "Landscaping": "Projects $2-20K. Visual portfolio essential for high-ticket",
    "Painting": "Jobs $3-10K. Before/after content drives premium perception",
    "Solar": "Install $20-40K. Long sales cycle needs video nurturing",
    "Kitchen & Bath": "Remodels $15-50K. Portfolio videos justify premium pricing",
    "default": "Service businesses see 2-5x more leads with video marketing",
  };

  const estimatedROI = roiEstimates[category] || roiEstimates["default"];

  // Competitor threat (most categories have video competitors now)
  const competitorThreat = Math.random() > 0.3; // 70% chance competitors use video

  // Seasonal urgency by category
  const seasonalCategories = ["HVAC", "Pool Service", "Landscaping", "Roofing", "Pest Control"];
  const seasonalUrgency = seasonalCategories.includes(category);

  // Decision maker
  const decisionMakers: Record<string, string> = {
    "1-5": "Owner (direct decision maker)",
    "6-10": "Owner or Office Manager",
    "11-25": "Owner, GM, or Marketing Manager",
    "26-50": "Marketing Manager or Owner",
    "51+": "Marketing Director or VP",
  };

  const decisionMaker = decisionMakers[employees] || "Owner";

  // Common objections
  const objections = [
    "I don't have time to be on camera",
    "We've tried marketing before, didn't work",
    "My customers come from referrals",
    "I'm not sure about the ROI",
    "Can I see examples for my industry?",
  ];

  // Closing angle based on business profile
  let closingAngle = "";
  if (!socialPresence.hasVideo && socialPresence.facebook) {
    closingAngle = "You're already active on Facebook - video will 3x your engagement and leads";
  } else if (!socialPresence.hasVideo && !socialPresence.facebook) {
    closingAngle = "Your competitors are using video to steal market share. Let's get you ahead.";
  } else if (revenue === "$1M-$5M" || revenue === "$5M-$10M") {
    closingAngle = "At your revenue level, video marketing is the multiplier for scaling further";
  } else if (seasonalUrgency) {
    closingAngle = "Peak season is coming - video content now will capture the demand";
  } else {
    closingAngle = "20 videos for $2K = less than $100/video. One job pays for it all.";
  }

  return {
    primaryUseCase,
    useCases,
    buyingIntent,
    buyingIntentReasons,
    idealVideoTypes,
    estimatedROI,
    competitorThreat,
    seasonalUrgency,
    adSpendEstimate,
    decisionMaker,
    objections: objections.slice(0, 3),
    closingAngle,
  };
}

// Calculate score based on multiple factors
function calculateScore(
  revenue: string,
  employees: string,
  yearsInBusiness: number,
  socialPresence: FloridaBusiness["socialPresence"]
): number {
  let score = 50; // Base score

  // Revenue scoring
  const revenueScores: Record<string, number> = {
    "Under $500K": 5,
    "$500K-$1M": 15,
    "$1M-$5M": 25,
    "$5M-$10M": 20,
    "$10M+": 15,
  };
  score += revenueScores[revenue] || 0;

  // Employee scoring (more employees = can handle more leads)
  const employeeScores: Record<string, number> = {
    "1-5": 5,
    "6-10": 15,
    "11-25": 20,
    "26-50": 15,
    "51+": 10,
  };
  score += employeeScores[employees] || 0;

  // Years in business (sweet spot is 3-15 years)
  if (yearsInBusiness >= 3 && yearsInBusiness <= 15) {
    score += 10;
  } else if (yearsInBusiness > 15) {
    score += 5;
  }

  // Social presence (less presence = more opportunity)
  if (!socialPresence.facebook && !socialPresence.instagram) {
    score += 10; // No social = big opportunity
  }
  if (!socialPresence.hasVideo) {
    score += 10; // No video = perfect fit
  }
  if (socialPresence.facebook && !socialPresence.instagram) {
    score += 5; // Has FB but not IG = growth opportunity
  }

  return Math.min(99, Math.max(1, score));
}

// Generate why now message
function generateWhyNow(business: Partial<FloridaBusiness>): string {
  const templates = [
    `${business.name} has ${business.employeeCount} employees and is ready to scale with video marketing`,
    `${business.category} businesses in ${business.city} are seeing 3x more leads with video content`,
    `${business.name} has been in business ${business.yearsInBusiness} years but lacks video presence - huge opportunity`,
    `${business.region} ${business.category?.toLowerCase()} market is competitive - video is the differentiator`,
    `${business.name} has strong reviews but no video testimonials to showcase them`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate the full database
function generateBusinessDatabase(): FloridaBusiness[] {
  const businesses: FloridaBusiness[] = [];
  let id = 1;

  // Helper function to generate a single business
  const generateBusiness = (category: string, region: string, cities: string[]): FloridaBusiness => {
    const subCategories = CATEGORIES[category] || [category];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const subCategory = subCategories[Math.floor(Math.random() * subCategories.length)];
    const name = generateBusinessName(category, city);

    const revenues: FloridaBusiness["estimatedRevenue"][] = ["Under $500K", "$500K-$1M", "$1M-$5M", "$5M-$10M", "$10M+"];
    const revenueWeights = [15, 30, 35, 15, 5];
    const revenueRoll = Math.random() * 100;
    let revenueIdx = 0;
    let cumulative = 0;
    for (let j = 0; j < revenueWeights.length; j++) {
      cumulative += revenueWeights[j];
      if (revenueRoll < cumulative) {
        revenueIdx = j;
        break;
      }
    }
    const estimatedRevenue = revenues[revenueIdx];

    const employeeCounts: FloridaBusiness["employeeCount"][] = ["1-5", "6-10", "11-25", "26-50", "51+"];
    const employeeWeights = [25, 35, 25, 10, 5];
    const employeeRoll = Math.random() * 100;
    let employeeIdx = 0;
    cumulative = 0;
    for (let j = 0; j < employeeWeights.length; j++) {
      cumulative += employeeWeights[j];
      if (employeeRoll < cumulative) {
        employeeIdx = j;
        break;
      }
    }
    const employeeCount = employeeCounts[employeeIdx];

    const yearsInBusiness = Math.floor(Math.random() * 25) + 1;

    const socialPresence = {
      facebook: Math.random() > 0.3,
      instagram: Math.random() > 0.5,
      youtube: Math.random() > 0.85,
      tiktok: Math.random() > 0.92,
      hasVideo: Math.random() > 0.75,
    };

    const signals = generateSignals(category, estimatedRevenue, employeeCount, yearsInBusiness);
    const score = calculateScore(estimatedRevenue, employeeCount, yearsInBusiness, socialPresence);

    const businessData: Partial<FloridaBusiness> = {
      id: `fl_${id.toString().padStart(4, "0")}`,
      name,
      category,
      subCategory,
      city,
      region: region as FloridaBusiness["region"],
      estimatedRevenue,
      employeeCount,
      yearsInBusiness,
      socialPresence,
    };

    const videoBuyerCriteria = generateVideoBuyerCriteria(
      category,
      estimatedRevenue,
      employeeCount,
      yearsInBusiness,
      socialPresence
    );

    const business: FloridaBusiness = {
      ...businessData as FloridaBusiness,
      phone: generatePhone(city),
      website: Math.random() > 0.2 ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}.com` : undefined,
      email: Math.random() > 0.3 ? `info@${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)}.com` : undefined,
      signals,
      score,
      whyNow: generateWhyNow(businessData),
      painPoints: generatePainPoints(category),
      idealFor: generateIdealFor(category),
      videoBuyerCriteria,
    };

    id++;
    return business;
  };

  const regions = Object.keys(FLORIDA_CITIES) as Array<keyof typeof FLORIDA_CITIES>;

  // FIRST: Generate 500 Kitchen & Bath businesses (50% of database)
  for (let i = 0; i < 500; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const cities = FLORIDA_CITIES[region];
    businesses.push(generateBusiness("Kitchen & Bath", region, cities));
  }

  // SECOND: Generate 500 other home service businesses (remaining 50%)
  const otherCategories = Object.keys(CATEGORIES).filter(c => c !== "Kitchen & Bath");
  for (let i = 0; i < 500; i++) {
    const category = otherCategories[Math.floor(Math.random() * otherCategories.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const cities = FLORIDA_CITIES[region];
    businesses.push(generateBusiness(category, region, cities));
  }

  // Sort by score descending
  businesses.sort((a, b) => b.score - a.score);

  return businesses;
}

// Export the database
export const FLORIDA_BUSINESSES = generateBusinessDatabase();

// Search function
export function searchFloridaBusinesses(options: {
  query?: string;
  category?: string;
  region?: string;
  city?: string;
  minScore?: number;
  limit?: number;
}): FloridaBusiness[] {
  let results = [...FLORIDA_BUSINESSES];

  if (options.category) {
    results = results.filter(b => b.category.toLowerCase().includes(options.category!.toLowerCase()));
  }

  if (options.region) {
    results = results.filter(b => b.region.toLowerCase().includes(options.region!.toLowerCase()));
  }

  if (options.city) {
    results = results.filter(b => b.city.toLowerCase().includes(options.city!.toLowerCase()));
  }

  if (options.minScore) {
    results = results.filter(b => b.score >= options.minScore!);
  }

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.subCategory.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.signals.some(s => s.toLowerCase().includes(q))
    );
  }

  return results.slice(0, options.limit || 50);
}

// Get hot leads (high score businesses)
export function getHotLeads(limit: number = 20): FloridaBusiness[] {
  return FLORIDA_BUSINESSES.filter(b => b.score >= 75).slice(0, limit);
}

// Get businesses by category
export function getByCategory(category: string, limit: number = 50): FloridaBusiness[] {
  return FLORIDA_BUSINESSES.filter(b =>
    b.category.toLowerCase() === category.toLowerCase()
  ).slice(0, limit);
}

// Get businesses by region
export function getByRegion(region: string, limit: number = 50): FloridaBusiness[] {
  return FLORIDA_BUSINESSES.filter(b =>
    b.region.toLowerCase().includes(region.toLowerCase())
  ).slice(0, limit);
}

// Stats
export const FLORIDA_BUSINESS_STATS = {
  total: 1000,
  categories: Object.keys(CATEGORIES).length,
  regions: Object.keys(FLORIDA_CITIES).length,
  avgScore: Math.round(FLORIDA_BUSINESSES.reduce((sum, b) => sum + b.score, 0) / FLORIDA_BUSINESSES.length),
};
