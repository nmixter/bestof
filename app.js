const STORAGE_KEY = "guscm-best-of-2026-survey";
const RESPONSE_KEY = "guscm-best-of-2026-responses";
const COMPLETED_KEY = "guscm-best-of-2026-completed";
const ADMIN_PASSWORD_KEY = "guscm-best-of-2026-admin-password";
const API_ENDPOINT = "/.netlify/functions/survey";
const BACKEND_ENABLED = location.protocol !== "file:";

const introText =
  "Enter the survey for a chance to win a family four pack of tickets to the Boardwalk. One entry per person. Must be received by May 31. Winners will be announced in the July edition of Growing Up in Santa Cruz. Please let your family and friends know to vote for their favorites also. Vote for as many different categories as you can but only one vote per person.";

const thankYouText =
  "Thank you for voting in this year's Best of Santa Cruz poll. Look for results in the July Growing Up in Santa Cruz edition.";

const ballotCategories = [
  "Day Camp",
  "Residential Camp",
  "Bakery",
  "Coffee Shop",
  "Breakfast",
  "Deli",
  "Dinner",
  "Fine Dining",
  "Grocery Store",
  "Ice Cream",
  "Pizza",
  "Sushi",
  "Taqueria",
  "To Go",
  "Family Friendly Restaurant",
  "After School Care",
  "Art",
  "Dance",
  "Music",
  "Sport",
  "Swimming",
  "Theater",
  "Gymnastics",
  "Bank",
  "Place/House of Worship",
  "Insurance",
  "Photographer",
  "Realtor",
  "Dentist/Orthodontist",
  "Fitness",
  "Hospital",
  "Pediatrician",
  "Reproductive",
  "Midwife/Doula",
  "Therapist",
  "Specialist",
  "Beach",
  "Park",
  "Hiking",
  "Amusement Park",
  "Hair Salon",
  "Spa",
  "Massage Therapist",
  "Nail Salon",
  "Kennel",
  "Pet supplies",
  "Veterinarian",
  "Radio Station",
  "Art Supplies",
  "Baby",
  "Bike Shop",
  "Children's Clothing",
  "Gift Shop",
  "Home Decor",
  "Nursery/Garden",
  "Skate/ Surf",
  "Teen Clothing",
  "Toys",
  "Women's Clothing",
  "Charter",
  "Elementary",
  "Middle School",
  "High School",
  "Preschool",
  "Private School",
  "Place to celebrate kid's Birthday",
  "Place to celebrate an adult Birthday or milestone"
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryGroup(category) {
  if (["Day Camp", "Residential Camp"].includes(category)) return "Camps";
  if (["After School Care", "Art", "Dance", "Music", "Sport", "Swimming", "Theater", "Gymnastics"].includes(category)) return "Activities";
  if (["Bank", "Place/House of Worship", "Insurance", "Photographer", "Realtor"].includes(category)) return "Services";
  if (["Dentist/Orthodontist", "Fitness", "Hospital", "Pediatrician", "Reproductive", "Midwife/Doula", "Therapist", "Specialist"].includes(category)) return "Health";
  if (["Beach", "Park", "Hiking", "Amusement Park"].includes(category)) return "Outdoors";
  if (["Hair Salon", "Spa", "Massage Therapist", "Nail Salon"].includes(category)) return "Personal Care";
  if (["Kennel", "Pet supplies", "Veterinarian"].includes(category)) return "Pets";
  if (["Charter", "Elementary", "Middle School", "High School", "Preschool", "Private School"].includes(category)) return "Schools";
  if (category.includes("Birthday")) return "Celebrations";
  if (["Bakery", "Coffee Shop", "Breakfast", "Deli", "Dinner", "Fine Dining", "Grocery Store", "Ice Cream", "Pizza", "Sushi", "Taqueria", "To Go", "Family Friendly Restaurant"].includes(category)) return "Food";
  return "Shopping";
}

const categoryOptions = {
  "Day Camp": ["Santa Cruz County Parks Summer Camps", "City of Santa Cruz Parks & Recreation", "Scotts Valley Recreation", "Santa Cruz SPCA Kids Camp", "Seymour Marine Discovery Center Ocean Explorers", "Santa Cruz Museum of Natural History Camps", "Tannery World Dance & Cultural Center Camp", "Mount Hermon Adventures", "Kennolyn Camps", "Camp Gateway"],
  "Residential Camp": ["Kennolyn Camps", "Mount Hermon Redwood Camp", "Camp Hammer", "YMCA Camp Campbell", "Camp Krem", "Monte Toyon Camp and Conference Center"],
  "Bakery": ["Gayle's Bakery & Rosticceria", "The Buttery", "Companion Bakeshop", "Kelly's French Bakery", "The Grove Cafe & Bakery", "Manresa Bread", "Emily's Bakery", "Pacific Cookie Company", "Beckmann's Old World Bakery", "Aldo's Bakery"],
  "Coffee Shop": ["Verve Coffee Roasters", "Cat & Cloud Coffee", "11th Hour Coffee", "Santa Cruz Coffee Roasting Co.", "Lulu Carpenter's", "Firefly Coffee House", "People's Coffee", "Java Junction", "Mariposa Coffee Bar", "Coffeeville"],
  "Breakfast": ["Zachary's Restaurant", "Linda's Seabreeze Cafe", "Harbor Cafe", "Cafe Brasil", "Walnut Avenue Cafe", "The Picnic Basket", "Silver Spur", "Red Apple Cafe", "The Grove Cafe & Bakery", "Avenue Cafe"],
  "Deli": ["Zoccoli's Delicatessen", "Seabright Deli", "Erik's DeliCafe", "Garden Deli", "Ben Lomond Market", "Staff of Life Natural Foods Deli", "New Leaf Community Markets Deli", "Shopper's Corner Deli", "Aptos Street BBQ", "The Picnic Basket"],
  "Dinner": ["Laili Restaurant", "Hula's Island Grill", "Shadowbrook Restaurant", "Cafe Sparrow", "Venus Spirits Cocktails & Kitchen", "Oswald Restaurant", "The Point Chophouse", "Sanderlings Restaurant", "Hindquarter Bar & Grille", "Ideal Bar & Grill"],
  "Fine Dining": ["Shadowbrook Restaurant", "Cafe Sparrow", "Sanderlings Restaurant", "Oswald Restaurant", "Laili Restaurant", "Gabriella Cafe", "Venus Spirits Cocktails & Kitchen", "The Point Chophouse", "Home Restaurant", "La Posta"],
  "Grocery Store": ["New Leaf Community Markets", "Staff of Life Natural Foods", "Shopper's Corner", "Deluxe Foods of Aptos", "Ben Lomond Market", "Grocery Outlet Santa Cruz", "Safeway Capitola", "Nob Hill Foods Scotts Valley", "Whole Foods Market Santa Cruz", "Wild Roots Market"],
  "Ice Cream": ["The Penny Ice Creamery", "Marianne's Ice Cream", "Mission Hill Creamery", "Polar Bear Ice Cream", "Marini's Candies", "Pacific Cookie Company", "Boardwalk Dipper", "Sno-White Drive-In", "Fosters Freeze Watsonville", "Cold Stone Creamery Capitola"],
  "Pizza": ["Woodstock's Pizza", "Pizza My Heart", "Pizzeria Avanti", "Engfer Pizza Works", "Pleasure Pizza", "Bantam", "La Bufala", "Tony & Alba's Pizza", "Upper Crust Pizza & Pasta", "Bookie's Pizza"],
  "Sushi": ["Mobo Sushi", "Akira Sushi", "Sushi Garden", "Geisha Japanese Restaurant & Tea House", "Sushi Totoro", "Otoro Sushi", "Sushi Mori", "Naka Sushi", "Kaito Japanese Restaurant", "Shogun Japanese Restaurant"],
  "Taqueria": ["Taqueria Vallarta", "Los Pericos Taqueria", "Taqueria Santa Cruz", "Taqueria Los Gallos", "Taqueria Agave", "Taqueria La Cabana", "Taqueria Los Pericos", "Taqueria Mi Tierra", "Taqueria Jalapenos", "Taqueria El Dandy"],
  "To Go": ["The Picnic Basket", "Seabright Deli", "Zoccoli's Delicatessen", "Pizza My Heart", "Taqueria Vallarta", "Aptos Street BBQ", "Samba Rock Acai Cafe", "New Leaf Community Markets Deli", "Staff of Life Natural Foods Deli", "Boardwalk Grille"],
  "Family Friendly Restaurant": ["Santa Cruz Beach Boardwalk Restaurants", "Ideal Bar & Grill", "Woodstock's Pizza", "Pizza My Heart", "Betty Burgers", "Cafe Brasil", "Harbor Cafe", "Sno-White Drive-In", "Red Apple Cafe", "Aptos Street BBQ"],
  "After School Care": ["Boys & Girls Clubs of Santa Cruz County", "Santa Cruz City Schools After School Programs", "Campus Kids Connection", "YMCA of San Benito County Child Care", "City of Watsonville Parks and Community Services", "Scotts Valley Recreation", "Mount Madonna School Extended Care", "Gateway School Extended Care", "Baymonte Christian School Extended Care", "Orchard School Extended Care"],
  "Art": ["Santa Cruz Mountains Art Center", "Palace Art & Office Supply", "Tannery Arts Center", "Santa Cruz Art Center", "Arts Council Santa Cruz County", "Santa Cruz Museum of Art & History", "Radius Gallery", "Lenz Arts", "Cabrillo Gallery", "Felix Kulpa Gallery"],
  "Dance": ["Tannery World Dance & Cultural Center", "Motion Pacific", "International Academy of Dance Santa Cruz", "Dancenter", "No Limits Dance & Performing Arts", "Santa Cruz Ballet Theatre", "Agape Dance Academy", "Pacific Arts Complex", "Watsonville Taiko", "Santa Cruz Dance Company"],
  "Music": ["Everyone's Music School", "Be Natural Music", "Kuumbwa Jazz", "Santa Cruz Symphony", "Santa Cruz Music School", "Sylvan Music", "More Music Santa Cruz", "Cabrillo Festival of Contemporary Music", "Abbott Square Music", "Pacific Voices"],
  "Sport": ["Santa Cruz County Youth Soccer Club", "Santa Cruz Little League", "Santa Cruz Warriors Basketball Academy", "Santa Cruz Track Club", "Santa Cruz County Cycling Club", "Scotts Valley Sportsmen's Club", "Aptos Soccer Club", "Santa Cruz Rugby", "Parks & Recreation Santa Cruz Sports", "Watsonville Youth Soccer League"],
  "Swimming": ["Jim Booth Swim School", "Adventure Sports Unlimited", "Santa Cruz Swim School", "Simpkins Family Swim Center", "Seahorse Swim School", "Watsonville YMCA", "Santa Cruz Masters Aquatics", "Cabrillo College Pool", "Scotts Valley Recreation Swim", "Aptos Cabrillo Swim Club"],
  "Theater": ["Jewel Theatre Company", "Santa Cruz Shakespeare", "Cabrillo Stage", "Mountain Community Theater", "Actors' Theatre", "The 418 Project", "Colligan Theater", "Kuumbwa Jazz Center", "Rio Theatre", "Henry J. Mello Center"],
  "Gymnastics": ["Santa Cruz Gymnastics Center", "Ohana Gymnastics", "JuneBug's Gym", "Toadal Fitness Gymnastics", "Scotts Valley Recreation Gymnastics"],
  "Bank": ["Santa Cruz County Bank", "Bay Federal Credit Union", "Santa Cruz Community Credit Union", "Comerica Bank", "Bank of America", "Wells Fargo", "Chase Bank", "U.S. Bank", "Comerica Bank Aptos", "Lighthouse Bank"],
  "Place/House of Worship": ["Twin Lakes Church", "Holy Cross Catholic Church", "Temple Beth El", "St. Joseph's Catholic Church", "Calvary Episcopal Church", "Peace United Church of Christ", "Vintage Faith Church", "Santa Cruz Bible Church", "Resurrection Catholic Community", "Watsonville Buddhist Temple"],
  "Insurance": ["State Farm - Larry Pearson", "State Farm - Stacey Ziegler", "Farmers Insurance - Santa Cruz", "Allstate Insurance Santa Cruz", "Goosehead Insurance Santa Cruz", "Coastal Insurance Services", "HUB International Santa Cruz", "Bargetto Insurance", "Acrisure Santa Cruz", "Santa Cruz Insurance Services"],
  "Photographer": ["Crystal Birns Photography", "De Joy Photography", "Kelley Williams Photography", "Michele Duffy Photography", "Kimberly Sandoval Photography", "Viera Photographics", "Rebecca Stark Photography", "Renae Zipfel Photography", "Shmuel Thaler Photography", "Santa Cruz Photo Booth"],
  "Realtor": ["Anderson Christie Real Estate", "Bailey Properties", "David Lyng Real Estate", "Sotheby's International Realty Santa Cruz", "Coldwell Banker Realty Santa Cruz", "Keller Williams Realty Santa Cruz", "eXp Realty Santa Cruz", "Room Real Estate", "Montalvo Homes & Estates", "Monterey Bay Properties"],
  "Dentist/Orthodontist": ["Santa Cruz Dental Group", "Dientes Community Dental Care", "Santa Cruz Orthodontics", "Lighthouse Dental", "Watsonville Family Dental", "Kids Dental Specialists", "Aptos Dental Care", "Capitola Kids Dentistry", "Scotts Valley Dental Care", "Western Dental Watsonville"],
  "Fitness": ["Toadal Fitness", "Santa Cruz Power Fitness", "Pacific Edge Climbing Gym", "Minorsan Self-Defense & Fitness", "Santa Cruz CORE Fitness + Rehab", "Westside Barbell Club", "CrossFit Santa Cruz", "In-Shape Capitola", "Watsonville Family YMCA", "Santa Cruz Yoga"],
  "Hospital": ["Dominican Hospital", "Watsonville Community Hospital", "Sutter Maternity & Surgery Center of Santa Cruz", "Santa Cruz County Health Services Agency", "Palo Alto Medical Foundation Santa Cruz", "Salud Para La Gente"],
  "Pediatrician": ["Palo Alto Medical Foundation Pediatrics Santa Cruz", "Santa Cruz Community Health", "Dignity Health Medical Group Dominican", "Salud Para La Gente Pediatrics", "Pediatric Medical Group of Santa Cruz", "Sutter Health Pediatrics Capitola", "Watsonville Health Center", "Sutter Pediatrics Aptos"],
  "Reproductive": ["Planned Parenthood Mar Monte Santa Cruz", "Dignity Health Dominican Women's Health", "Palo Alto Medical Foundation Obstetrics and Gynecology", "Santa Cruz Community Health Women's Health", "Salud Para La Gente Women's Health", "Sutter Maternity & Surgery Center of Santa Cruz"],
  "Midwife/Doula": ["Birth Network of Santa Cruz County", "Santa Cruz Midwives", "Birth Center of Santa Cruz", "Luma Birth", "Pacific Maternity", "Santa Cruz Doula Collective"],
  "Therapist": ["Family Service Agency of the Central Coast", "Pajaro Valley Prevention and Student Assistance", "Encompass Community Services", "Santa Cruz Community Counseling Center", "The Camp Recovery Center", "Janus of Santa Cruz", "Monarch Services", "NAMI Santa Cruz County", "Balance4Kids", "New Life Community Services"],
  "Specialist": ["Santa Cruz Medical Clinic", "Palo Alto Medical Foundation Santa Cruz", "Dignity Health Medical Group Dominican", "Santa Cruz Orthopaedic Institute", "Santa Cruz Ear Nose and Throat", "Santa Cruz Dermatology", "Santa Cruz Eye Medical Group", "Central Coast Allergy and Asthma", "Sutter Health Santa Cruz", "Salud Para La Gente"],
  "Beach": ["Natural Bridges State Beach", "Seacliff State Beach", "New Brighton State Beach", "Twin Lakes State Beach", "Seabright State Beach", "Main Beach", "Capitola Beach", "Rio Del Mar State Beach", "Manresa State Beach", "Sunset State Beach"],
  "Park": ["Wilder Ranch State Park", "Henry Cowell Redwoods State Park", "Roaring Camp Railroads", "Anna Jean Cummings Park", "Skypark", "Harvey West Park", "DeLaveaga Park", "Pinto Lake County Park", "Quail Hollow Ranch County Park", "Aptos Village Park"],
  "Hiking": ["Wilder Ranch State Park", "Henry Cowell Redwoods State Park", "The Forest of Nisene Marks State Park", "Pogonip Open Space", "Quail Hollow Ranch County Park", "Fall Creek Unit", "Moore Creek Preserve", "Arana Gulch", "DeLaveaga Park", "Byrne-Milliron Forest"],
  "Amusement Park": ["Santa Cruz Beach Boardwalk", "Roaring Camp Railroads", "Mount Hermon Adventures", "Seymour Marine Discovery Center", "Gilroy Gardens", "Neptune's Kingdom", "Santa Cruz Wharf", "Boardwalk Bowl", "Skypark", "Santa Cruz Roller Palladium"],
  "Hair Salon": ["Faust Salon Downtown", "Lavish Salon", "Salon on the Square", "Nirvana Salon", "Parlour at the Point", "Arrow Beauty Bar", "Pleasure Point Hair Design", "Opal Spa & Boutique", "Yoso Wellness Spa", "Watsonville Hair Company"],
  "Spa": ["Well Within Spa", "Tea House Spa", "Chaminade Resort & Spa", "Yoso Wellness Spa", "Opal Spa & Boutique", "Sage Float Spa", "Vital Body Therapy", "Santa Cruz Ayurveda", "SkinSpirit Santa Cruz", "Coco Spa"],
  "Massage Therapist": ["Vital Body Therapy", "Tea House Spa", "Well Within Spa", "Chaminade Resort & Spa", "Yoso Wellness Spa", "Santa Cruz CORE Fitness + Rehab", "Sage Float Spa", "Opal Spa & Boutique", "Santa Cruz Massage Therapy", "Aptos Massage Therapy"],
  "Nail Salon": ["Opal Spa & Boutique", "Perfect Nails Santa Cruz", "Nail Club Santa Cruz", "Capitola Nails", "Watsonville Nails", "Aptos Nails", "Scotts Valley Nails", "Ocean Nails", "Nail Spa Santa Cruz", "Diva Nails"],
  "Kennel": ["Bed & Biscuits Groomingdales", "Pawsitive Styles", "Kennel Club Loma Prieta", "Canine Corral", "Santa Cruz Pet Resort", "Doggie Dude Ranch", "Woofpack", "Aptos-Creekside Pet Hospital Boarding", "Animal Hospital of Soquel Boarding", "Boulder Creek Veterinary Clinic Boarding"],
  "Pet supplies": ["Pet Pals Discount Pet Food & Supplies", "Aptos Feed & Pet Supply", "PetSmart Capitola", "Petco Santa Cruz", "General Feed & Seed", "Boulder Creek Feed & Pet Supply", "Capitola Feed & Pet", "The Whole Pet Vet Shop", "Westside Farm and Feed", "Ben Lomond Feed"],
  "Veterinarian": ["Pacific & Santa Cruz Veterinary Specialists", "Aptos-Creekside Pet Hospital", "Animal Hospital of Soquel", "Scotts Valley Veterinary Clinic", "Westside Animal Hospital", "Capitola Veterinary Hospital", "Boulder Creek Veterinary Clinic", "Adobe Animal Hospital of Soquel", "Companion Animal Hospital", "The Whole Pet Vet Hospital and Wellness Center"],
  "Radio Station": ["KSQD Community Radio", "KZSC Santa Cruz", "KPIG Radio", "KAZU", "KION 1460", "KMBY 1240", "KDON 102.5", "KBOQ 103.9", "KOCN 105.1", "KUSP Archives"],
  "Art Supplies": ["Palace Art & Office Supply", "Lenz Arts", "Beverly's Fabrics", "Santa Cruz Art Center", "Bookshop Santa Cruz Art Supplies", "Michaels Capitola", "Wild Roots Market Floral and Craft", "Felton Mercantile", "Mountain Feed and Farm Supply", "Artisans & Agency"],
  "Baby": ["Jelli Beanz Kids Resale", "Stripe Design Group", "Bookshop Santa Cruz", "Target Capitola", "Baby Bloomers", "Little Trends", "Bunny's Shoes", "Toys N Tech", "Children's Discovery Museum Store", "New Leaf Community Markets Baby"],
  "Bike Shop": ["Spokesman Bicycles", "Another Bike Shop", "Epicenter Cycling", "Family Cycling Center", "Santa Cruz Bicycles", "Bicycle Trip", "Cycle Works", "Shuttle Smith Adventures", "Scotts Valley Cycle Sport", "Watsonville Cyclery"],
  "Children's Clothing": ["Jelli Beanz Kids Resale", "Stripe Design Group", "Bunny's Shoes", "Gap Capitola Mall", "Target Capitola", "O'Neill Surf Shop", "Rip Curl Capitola", "Patagonia Outlet Santa Cruz", "Toys N Tech", "Baby Bloomers"],
  "Gift Shop": ["Bookshop Santa Cruz", "Stripe Design Group", "Botanic and Luxe", "Home/Work", "Artisans & Agency", "Annieglass", "Santa Cruz Museum of Art & History Store", "Seymour Marine Discovery Center Store", "Santa Cruz Beach Boardwalk Gift Shops", "Capitola Mercantile"],
  "Home Decor": ["Stripe Design Group", "Botanic and Luxe", "Home/Work", "Annieglass", "Dig Gardens", "Wisteria Antiques", "Santa Cruz Reclaimed", "Berdels", "Lenz Arts", "World Market Santa Cruz"],
  "Nursery/Garden": ["Dig Gardens", "San Lorenzo Garden Center", "Mountain Feed and Farm Supply", "Central Home Supply", "ProBuild Garden Center", "Boulder Creek Nursery", "The Garden Company", "Far West Nursery", "Scarborough Gardens", "Alladin Nursery"],
  "Skate/ Surf": ["O'Neill Surf Shop", "Rip Curl Santa Cruz", "Billabong Santa Cruz", "Santa Cruz Surf Shop", "Arrow Surf & Sport", "Freeline Surf Shop", "Midtown Surf Shop", "Pacific Wave", "Santa Cruz Skateboards", "NHS Fun Factory"],
  "Teen Clothing": ["Pacific Wave", "Berdels", "O'Neill Surf Shop", "Rip Curl Capitola", "Patagonia Outlet Santa Cruz", "Stripe Design Group", "Billabong Santa Cruz", "Gap Capitola Mall", "Target Capitola", "Urban Outfitters Santa Cruz"],
  "Toys": ["Toys N Tech", "Bookshop Santa Cruz", "Atlantis Fantasyworld", "Comicopolis", "Children's Discovery Museum Store", "Santa Cruz Beach Boardwalk Gift Shops", "Target Capitola", "Seymour Marine Discovery Center Store", "Marini's Candies", "Bunny's Shoes"],
  "Women's Clothing": ["Stripe Design Group", "Cameron Marks", "Berdels", "Pacific Wave", "Patagonia Outlet Santa Cruz", "O'Neill Surf Shop", "Rip Curl Capitola", "Wallflower Boutique", "Botanic and Luxe", "Gap Capitola Mall"],
  "Charter": ["Pacific Collegiate School", "Santa Cruz Montessori Charter School", "Linscott Charter School", "Ocean Alternative Education Center", "Cypress Charter High School", "Delta Charter High School", "Ceiba College Preparatory Academy", "Nature Academy", "Alternative Family Education", "Watsonville Charter School of the Arts"],
  "Elementary": ["Westlake Elementary School", "Bay View Elementary School", "Gault Elementary School", "DeLaveaga Elementary School", "Main Street Elementary School", "Vine Hill Elementary School", "Mar Vista Elementary School", "Rio del Mar Elementary School", "Valencia Elementary School", "Amesti Elementary School"],
  "Middle School": ["Mission Hill Middle School", "Branciforte Middle School", "Shoreline Middle School", "New Brighton Middle School", "Scotts Valley Middle School", "Aptos Junior High School", "Rolling Hills Middle School", "Pajaro Middle School", "E. A. Hall Middle School", "San Lorenzo Valley Middle School"],
  "High School": ["Santa Cruz High School", "Harbor High School", "Soquel High School", "Aptos High School", "Scotts Valley High School", "Watsonville High School", "Pajaro Valley High School", "San Lorenzo Valley High School", "Pacific Collegiate School", "Cypress Charter High School"],
  "Preschool": ["Baymonte Christian Preschool", "Gateway School Preschool", "Santa Cruz Montessori", "Mount Madonna School Preschool", "Rocking Horse Ranch Preschool", "Campus Kids Connection Preschool", "Orchard School Preschool", "St. Lawrence Academy Preschool", "Good Shepherd Catholic School Preschool", "Holy Cross Preschool"],
  "Private School": ["Kirby School", "Baymonte Christian School", "Gateway School", "Mount Madonna School", "Santa Cruz Montessori", "Orchard School", "Good Shepherd Catholic School", "Holy Cross School", "St. Francis High School", "Salesian Elementary and Junior High"],
  "Place to celebrate kid's Birthday": ["Santa Cruz Beach Boardwalk", "Santa Cruz Children's Museum of Discovery", "Seymour Marine Discovery Center", "Roaring Camp Railroads", "JuneBug's Gym", "Santa Cruz Gymnastics Center", "Boardwalk Bowl", "Mount Hermon Adventures", "Santa Cruz Roller Palladium", "Skypark"],
  "Place to celebrate an adult Birthday or milestone": ["Shadowbrook Restaurant", "Chaminade Resort & Spa", "Sanderlings Restaurant", "Venus Spirits Cocktails & Kitchen", "The Dream Inn", "Oswald Restaurant", "Laili Restaurant", "Kuumbwa Jazz", "Santa Cruz Mountain Brewing", "Bargetto Winery"]
};

function createBallotQuestion(category) {
  return {
    id: `best-${slugify(category)}`,
    label: `Best ${category}`,
    type: "select-other",
    required: false,
    category: categoryGroup(category),
    options: [...(categoryOptions[category] || []), "Other"]
  };
}

const sampleSurvey = {
  version: 3,
  title: "Growing Up in Santa Cruz Best Of 2026 Reader Poll",
  description: introText,
  thankYou: thankYouText,
  slug: "best-of-2026",
  open: true,
  questions: [
    {
      id: "reader-name",
      label: "Your name",
      type: "text",
      required: true,
      category: "Entry",
      options: []
    },
    {
      id: "reader-email",
      label: "Email address",
      type: "text",
      required: true,
      category: "Entry",
      options: []
    },
    {
      id: "reader-area",
      label: "Where do you live?",
      type: "single",
      required: false,
      category: "Entry",
      options: ["Santa Cruz", "Capitola", "Aptos", "Scotts Valley", "Watsonville", "San Lorenzo Valley", "Other"]
    },
    {
      id: "reader-sections",
      label: "Which sections are you voting in today?",
      type: "multiple",
      required: false,
      category: "Entry",
      options: ["Camps", "Food", "Activities", "Services", "Health", "Outdoors", "Shopping", "Schools", "Celebrations"]
    },
    ...ballotCategories.map(createBallotQuestion),
    {
      id: "q-overall",
      label: "How would you rate this year's Best of Santa Cruz ballot?",
      type: "rating",
      required: false,
      category: "Reader sentiment",
      options: []
    },
    {
      id: "q-comments",
      label: "What should we know before publishing the 2026 reader results?",
      type: "text",
      required: false,
      category: "Editorial notes",
      options: []
    }
  ]
};

let survey = loadSurvey();
let responses = loadResponses();

const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".tab");
const settingsForm = document.querySelector("#surveySettings");
const questionList = document.querySelector("#questionList");
const questionTemplate = document.querySelector("#questionEditorTemplate");
const publicLink = document.querySelector("#publicLink");
const publicSurvey = document.querySelector("#publicSurvey");
const surveyTitle = document.querySelector("#survey-title");
const surveyDescription = document.querySelector("#surveyDescription");
const surveyQuestions = document.querySelector("#surveyQuestions");
const winnerSummary = document.querySelector("#winnerSummary");
const charts = document.querySelector("#charts");

function loadSurvey() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(sampleSurvey);
  const parsed = JSON.parse(saved);
  return parsed.version === sampleSurvey.version ? parsed : structuredClone(sampleSurvey);
}

function loadResponses() {
  const saved = localStorage.getItem(RESPONSE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveSurvey() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(survey));
}

function saveResponses() {
  localStorage.setItem(RESPONSE_KEY, JSON.stringify(responses));
}

async function setView(name) {
  if ((name === "builder" || name === "dashboard") && !(await ensureAdminAccess())) {
    return;
  }

  views.forEach((view) => view.classList.toggle("active", view.id === name));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === name));
  if (name === "survey") renderPublicSurvey();
  if (name === "dashboard") {
    await loadRemoteResults();
    renderDashboard();
  }
  location.hash = name === "survey" ? `survey/${survey.slug}` : name;
}

function getPublicUrl() {
  return `${location.origin}${location.pathname}#survey/${survey.slug}`;
}

function renderAll() {
  renderSettings();
  renderQuestions();
  renderPublicSurvey();
  if (document.querySelector("#dashboard").classList.contains("active")) renderDashboard();
}

function renderSettings() {
  settingsForm.elements.title.value = survey.title;
  settingsForm.elements.description.value = survey.description;
  settingsForm.elements.thankYou.value = survey.thankYou || thankYouText;
  settingsForm.elements.slug.value = survey.slug;
  settingsForm.elements.open.checked = survey.open;
  publicLink.textContent = getPublicUrl();
}

async function ensureAdminAccess() {
  if (!BACKEND_ENABLED) return true;
  if (sessionStorage.getItem(ADMIN_PASSWORD_KEY)) return true;

  const password = prompt("Enter the admin password to open the builder or results dashboard.");
  if (!password) return false;

  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
  const ok = await loadRemoteResults(false);

  if (!ok) {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    alert("That admin password did not work.");
  }

  return ok;
}

function adminHeaders() {
  const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  return password ? { "x-admin-password": password } : {};
}

async function apiRequest(action, options = {}) {
  if (!BACKEND_ENABLED) return null;

  const response = await fetch(`${API_ENDPOINT}?action=${action}`, {
    method: options.method || "GET",
    headers: {
      "content-type": "application/json",
      ...(options.admin ? adminHeaders() : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function loadRemoteConfig() {
  try {
    const result = await apiRequest("config");
    if (!result?.ok) return;

    if (result.data.survey) {
      survey = result.data.survey;
      saveSurvey();
    }

    mergeRemoteOptions(result.data.options || {});
  } catch (error) {
    console.warn("Backend config unavailable", error);
  }
}

async function loadRemoteResults(showError = true) {
  try {
    const result = await apiRequest("results", { admin: true });
    if (!result) return true;

    if (!result.ok) {
      if (showError && result.status !== 401) alert("Could not load shared results from the backend.");
      return false;
    }

    if (result.data.survey) {
      survey = result.data.survey;
      saveSurvey();
    }

    mergeRemoteOptions(result.data.options || {});
    responses = result.data.responses || [];
    saveResponses();
    return true;
  } catch (error) {
    if (showError) alert("Could not reach the backend results service.");
    return false;
  }
}

async function saveRemoteSurvey() {
  if (!BACKEND_ENABLED || !sessionStorage.getItem(ADMIN_PASSWORD_KEY)) return;

  try {
    await apiRequest("save-config", {
      method: "POST",
      admin: true,
      body: { survey }
    });
  } catch (error) {
    console.warn("Backend survey save unavailable", error);
  }
}

function mergeRemoteOptions(optionMap) {
  let changed = false;

  survey.questions = survey.questions.map((question) => {
    const remoteOptions = optionMap[question.id];
    if (!remoteOptions || question.type !== "select-other") return question;

    const merged = [...question.options.filter((option) => option !== "Other")];
    remoteOptions.forEach((option) => {
      if (option && option !== "Other" && !merged.some((existing) => normalizeChoice(existing) === normalizeChoice(option))) {
        merged.push(option);
        changed = true;
      }
    });

    return { ...question, options: [...merged, "Other"] };
  });

  if (changed) saveSurvey();
}

function renderQuestions() {
  questionList.innerHTML = "";

  survey.questions.forEach((question, index) => {
    const fragment = questionTemplate.content.cloneNode(true);
    const editor = fragment.querySelector(".question-editor");
    editor.dataset.id = question.id;
    fragment.querySelector(".question-number").textContent = `Question ${index + 1}`;
    fragment.querySelector(".q-label").value = question.label;
    fragment.querySelector(".q-type").value = question.type;
    fragment.querySelector(".q-required").checked = question.required;
    fragment.querySelector(".q-category").value = question.category;
    fragment.querySelector(".q-options").value = question.options.join("\n");
    fragment.querySelector(".options-field").classList.toggle("hidden", question.type === "text" || question.type === "rating");

    fragment.querySelector(".move-up").disabled = index === 0;
    fragment.querySelector(".move-down").disabled = index === survey.questions.length - 1;

    questionList.appendChild(fragment);
  });
}

function updateQuestion(id, patch) {
  survey.questions = survey.questions.map((question) =>
    question.id === id ? { ...question, ...patch } : question
  );
  saveSurvey();
  saveRemoteSurvey();
}

function swapQuestions(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= survey.questions.length) return;
  const copy = [...survey.questions];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  survey.questions = copy;
  saveSurvey();
  saveRemoteSurvey();
  renderAll();
}

function renderPublicSurvey() {
  surveyTitle.textContent = survey.title;
  surveyDescription.textContent = survey.description;
  surveyQuestions.innerHTML = "";

  if (!survey.open) {
    surveyQuestions.innerHTML = '<p class="empty">This survey is currently closed.</p>';
    publicSurvey.querySelector(".submit").disabled = true;
    return;
  }

  if (localStorage.getItem(COMPLETED_KEY) === survey.slug) {
    surveyQuestions.innerHTML = '<p class="empty">This browser has already submitted a ballot for this survey.</p>';
    publicSurvey.querySelector(".submit").disabled = true;
    return;
  }

  publicSurvey.querySelector(".submit").disabled = false;

  let currentCategory = "";

  survey.questions.forEach((question, index) => {
    if (question.category !== currentCategory) {
      currentCategory = question.category;
      const header = document.createElement("div");
      header.className = "survey-category-header";
      header.innerHTML = `<h3>${escapeHtml(currentCategory)}</h3>`;
      surveyQuestions.appendChild(header);
    }

    const wrapper = document.createElement("section");
    wrapper.className = "survey-question";
    wrapper.dataset.id = question.id;

    const required = question.required ? '<span class="required">*</span>' : "";
    wrapper.innerHTML = `<h3>${index + 1}. ${escapeHtml(question.label)} ${required}</h3>`;

    if (question.type === "single") {
      wrapper.appendChild(renderChoices(question, "radio"));
    }

    if (question.type === "multiple") {
      wrapper.appendChild(renderChoices(question, "checkbox"));
    }

    if (question.type === "select-other") {
      wrapper.appendChild(renderSelectWithOther(question));
    }

    if (question.type === "text") {
      const textarea = document.createElement("textarea");
      textarea.name = question.id;
      textarea.rows = 3;
      textarea.required = question.required;
      textarea.placeholder = "Type your answer";
      wrapper.appendChild(textarea);
    }

    if (question.type === "rating") {
      const row = document.createElement("div");
      row.className = "rating-row";
      [1, 2, 3, 4, 5].forEach((score) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="${question.id}" value="${score}" ${question.required ? "required" : ""}><span>${score}</span>`;
        row.appendChild(label);
      });
      wrapper.appendChild(row);
    }

    surveyQuestions.appendChild(wrapper);
  });
}

function renderChoices(question, inputType) {
  const fieldset = document.createElement("div");
  question.options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "choice";
    label.innerHTML = `<input type="${inputType}" name="${question.id}" value="${escapeHtml(option)}" ${question.required && inputType === "radio" ? "required" : ""}> <span>${escapeHtml(option)}</span>`;
    fieldset.appendChild(label);
  });
  return fieldset;
}

function renderSelectWithOther(question) {
  const group = document.createElement("div");
  group.className = "select-other-group";
  const options = question.options.includes("Other") ? question.options : [...question.options, "Other"];

  const select = document.createElement("select");
  select.name = question.id;
  select.required = question.required;
  select.innerHTML = `<option value="">Choose one</option>${options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("")}`;

  const input = document.createElement("input");
  input.type = "text";
  input.name = `${question.id}-other`;
  input.placeholder = "Type your choice";
  input.className = "other-input";
  input.hidden = true;

  select.addEventListener("change", () => {
    const isOther = select.value === "Other";
    input.hidden = !isOther;
    input.required = isOther;
    if (!isOther) input.value = "";
  });

  group.append(select, input);
  return group;
}

function collectResponse(form) {
  const answers = {};

  survey.questions.forEach((question) => {
    if (question.type === "multiple") {
      answers[question.id] = [...form.querySelectorAll(`[name="${question.id}"]:checked`)].map((input) => input.value);
      return;
    }

    if (question.type === "select-other") {
      const selected = form.querySelector(`[name="${question.id}"]`)?.value || "";
      const other = form.querySelector(`[name="${question.id}-other"]`)?.value.trim() || "";
      answers[question.id] = selected === "Other" ? resolveWriteIn(question, other) : selected;
      return;
    }

    const field =
      question.type === "text"
        ? form.querySelector(`[name="${question.id}"]`)
        : form.querySelector(`[name="${question.id}"]:checked`);
    answers[question.id] = field ? field.value.trim() : "";
  });

  return {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    surveySlug: survey.slug,
    answers
  };
}

function resolveWriteIn(question, rawValue) {
  const cleaned = formatWriteIn(rawValue);
  if (!cleaned) return "";

  const candidates = getChoiceCandidates(question);
  const exact = candidates.find((candidate) => normalizeChoice(candidate) === normalizeChoice(cleaned));
  if (exact) return exact;

  const similar = findSimilarChoice(cleaned, candidates);
  if (similar.score >= 0.94) return similar.label;

  if (similar.label) {
    const useExisting = confirm(`Did you mean "${similar.label}"?\n\nChoose OK to count your vote for "${similar.label}", or Cancel to keep "${cleaned}".`);
    if (useExisting) return similar.label;
  }

  addOptionToQuestion(question.id, cleaned);
  return cleaned;
}

function getChoiceCandidates(question) {
  const optionCandidates = question.options.filter((option) => option && option !== "Other");
  const responseCandidates = responses
    .map((response) => response.answers[question.id])
    .filter((answer) => typeof answer === "string" && answer.trim());

  return [...new Set([...optionCandidates, ...responseCandidates])];
}

function addOptionToQuestion(questionId, option) {
  survey.questions = survey.questions.map((question) => {
    if (question.id !== questionId || question.options.includes(option)) return question;
    const baseOptions = question.options.filter((item) => item !== "Other");
    return { ...question, options: [...baseOptions, option, "Other"] };
  });
  saveSurvey();
}

function formatWriteIn(value) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  return trimmed
    .split(" ")
    .map((word, index) => {
      if (/^[A-Z0-9&]+$/.test(word)) return word;
      if (index > 0 && word.length <= 3 && ["and", "the", "for", "of", "at", "in", "to"].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word
        .split(/([-'/])/)
        .map((part) => (/[-'/]/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
        .join("");
    })
    .join(" ");
}

function normalizeChoice(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(the|and|restaurant|cafe|coffee|shop|school|center|centre|company|co|inc|llc)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function findSimilarChoice(value, candidates) {
  const normalized = normalizeChoice(value);
  if (normalized.length < 4) return { label: "", score: 0 };

  let best = { label: "", score: 0 };

  candidates.forEach((candidate) => {
    const candidateNormalized = normalizeChoice(candidate);
    if (!candidateNormalized) return;

    const containsScore =
      normalized.length >= 5 &&
      candidateNormalized.length >= 5 &&
      (normalized.includes(candidateNormalized) || candidateNormalized.includes(normalized))
        ? 0.9
        : 0;
    const distanceScore = similarityScore(normalized, candidateNormalized);
    const score = Math.max(containsScore, distanceScore);

    if (score > best.score) best = { label: candidate, score };
  });

  return best.score >= 0.82 ? best : { label: "", score: 0 };
}

function similarityScore(a, b) {
  const maxLength = Math.max(a.length, b.length);
  if (!maxLength) return 1;
  return 1 - levenshteinDistance(a, b) / maxLength;
}

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function renderDashboard() {
  document.querySelector("#responseCount").textContent = responses.length;
  document.querySelector("#questionCount").textContent = survey.questions.length;
  document.querySelector("#surveyStatus").textContent = survey.open ? "Open" : "Closed";
  renderWinnerSummary();
  charts.innerHTML = "";

  if (!responses.length) {
    charts.innerHTML = '<p class="empty">No responses yet. Use the public survey link or add demo responses to preview charts.</p>';
    return;
  }

  survey.questions.forEach((question) => {
    if (question.type === "text") {
      charts.appendChild(renderTextCard(question));
      return;
    }

    charts.appendChild(renderChartCard(question));
  });
}

function renderWinnerSummary() {
  const categoryQuestions = survey.questions.filter((question) => question.type === "select-other");

  if (!responses.length) {
    winnerSummary.innerHTML = '<p class="empty">No winners yet. Results will appear after ballots are submitted.</p>';
    return;
  }

  const rows = categoryQuestions
    .map((question) => {
      const top = rankAnswers(question).slice(0, 3);
      return `
        <tr>
          <td>${escapeHtml(question.label.replace("Best ", ""))}</td>
          <td>${renderRank(top[0])}</td>
          <td>${renderRank(top[1])}</td>
          <td>${renderRank(top[2])}</td>
        </tr>
      `;
    })
    .join("");

  winnerSummary.innerHTML = `
    <table class="winner-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Winner</th>
          <th>First runner-up</th>
          <th>Second runner-up</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderRank(rank) {
  if (!rank) return '<span class="winner-votes">No votes yet</span>';
  return `<span class="winner-rank">${escapeHtml(rank.label)}</span><span class="winner-votes">${rank.count} vote${rank.count === 1 ? "" : "s"}</span>`;
}

function renderChartCard(question) {
  const counts = countAnswers(question);
  const max = Math.max(1, ...Object.values(counts));
  const card = document.createElement("article");
  card.className = "chart-card";
  card.innerHTML = `<h3>${escapeHtml(question.label)}</h3><p>${escapeHtml(question.category)} - ${question.type === "rating" ? "Average " + averageRating(question).toFixed(1) : "Vote count"}</p>`;

  Object.entries(counts).forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${escapeHtml(label)}</span>
      <span class="bar-track"><span class="bar" style="width:${(count / max) * 100}%"></span></span>
      <strong>${count}</strong>
    `;
    card.appendChild(row);
  });

  return card;
}

function renderTextCard(question) {
  const card = document.createElement("article");
  card.className = "chart-card";
  card.innerHTML = `<h3>${escapeHtml(question.label)}</h3><p>${escapeHtml(question.category)} - latest short answers</p>`;
  const answers = responses
    .map((response) => response.answers[question.id])
    .filter(Boolean)
    .slice(-6)
    .reverse();

  if (!answers.length) {
    card.insertAdjacentHTML("beforeend", '<p class="empty">No written answers yet.</p>');
    return card;
  }

  answers.forEach((answer) => {
    const item = document.createElement("div");
    item.className = "text-response";
    item.textContent = answer;
    card.appendChild(item);
  });
  return card;
}

function countAnswers(question) {
  const labels = question.type === "rating" ? ["1", "2", "3", "4", "5"] : question.options.filter((option) => option !== "Other");
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));

  responses.forEach((response) => {
    const answer = response.answers[question.id];
    if (Array.isArray(answer)) {
      answer.forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
      });
      return;
    }

    if (answer) counts[answer] = (counts[answer] || 0) + 1;
  });

  return counts;
}

function rankAnswers(question) {
  const counts = countAnswers(question);
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function averageRating(question) {
  const values = responses
    .map((response) => Number(response.answers[question.id]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function exportCsv() {
  const headers = ["response_id", "submitted_at", ...survey.questions.map((q) => q.label)];
  const rows = responses.map((response) => [
    response.id,
    response.submittedAt,
    ...survey.questions.map((question) => {
      const value = response.answers[question.id] ?? "";
      return Array.isArray(value) ? value.join("; ") : value;
    })
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${survey.slug}-responses.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function validateRequiredGroups() {
  const missing = survey.questions.find((question) => {
    if (!question.required || question.type !== "multiple") return false;
    return !publicSurvey.querySelector(`[name="${question.id}"]:checked`);
  });

  if (!missing) return true;
  alert(`Please answer: ${missing.label}`);
  return false;
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function seedDemoResponses() {
  const choices = {
    "reader-area": ["Santa Cruz", "Capitola", "Aptos", "Scotts Valley", "Watsonville", "San Lorenzo Valley"],
    "reader-sections": ["Camps", "Food", "Activities", "Services", "Health", "Outdoors", "Shopping", "Schools", "Celebrations"]
  };

  for (let index = 0; index < 18; index += 1) {
    const answers = {};
  survey.questions.forEach((question) => {
      if (question.type === "single" || question.type === "select-other") answers[question.id] = pick(choices[question.id] || question.options.filter((option) => option !== "Other"));
      if (question.type === "multiple") answers[question.id] = shuffle(choices[question.id] || question.options).slice(0, 2);
      if (question.type === "rating") answers[question.id] = String(3 + Math.floor(Math.random() * 3));
      if (question.type === "text") {
        if (question.id === "reader-name") answers[question.id] = `Demo Reader ${index + 1}`;
        else if (question.id === "reader-email") answers[question.id] = `reader${index + 1}@example.com`;
        else if (question.id.startsWith("best-")) answers[question.id] = index % 3 === 0 ? `${question.label.replace("Best ", "")} nominee ${index + 1}` : "";
        else answers[question.id] = index % 4 === 0 ? "A reader note for the editorial team to review." : "";
      }
    });
    responses.push({
      id: crypto.randomUUID(),
      submittedAt: new Date(Date.now() - index * 86400000).toISOString(),
      surveySlug: survey.slug,
      answers
    });
  }

  saveResponses();
  renderDashboard();
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)] || "";
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  survey.title = settingsForm.elements.title.value.trim();
  survey.description = settingsForm.elements.description.value.trim();
  survey.thankYou = settingsForm.elements.thankYou.value.trim();
  survey.slug = settingsForm.elements.slug.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  survey.open = settingsForm.elements.open.checked;
  saveSurvey();
  await saveRemoteSurvey();
  renderAll();
});

questionList.addEventListener("input", (event) => {
  const editor = event.target.closest(".question-editor");
  if (!editor) return;
  const id = editor.dataset.id;

  if (event.target.classList.contains("q-label")) updateQuestion(id, { label: event.target.value });
  if (event.target.classList.contains("q-type")) {
    const type = event.target.value;
    updateQuestion(id, { type, options: type === "single" || type === "multiple" || type === "select-other" ? ["Option 1", "Option 2", "Other"] : [] });
    renderAll();
  }
  if (event.target.classList.contains("q-required")) updateQuestion(id, { required: event.target.checked });
  if (event.target.classList.contains("q-category")) updateQuestion(id, { category: event.target.value });
  if (event.target.classList.contains("q-options")) {
    updateQuestion(id, { options: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) });
  }
});

questionList.addEventListener("click", (event) => {
  const editor = event.target.closest(".question-editor");
  if (!editor) return;
  const index = survey.questions.findIndex((question) => question.id === editor.dataset.id);

  if (event.target.classList.contains("delete-question")) {
    survey.questions.splice(index, 1);
    saveSurvey();
    saveRemoteSurvey();
    renderAll();
  }

  if (event.target.classList.contains("move-up")) swapQuestions(index, -1);
  if (event.target.classList.contains("move-down")) swapQuestions(index, 1);
});

document.querySelector("#addQuestion").addEventListener("click", () => {
  survey.questions.push({
    id: crypto.randomUUID(),
    label: "New question",
    type: "single",
    required: false,
    category: "New category",
    options: ["Option 1", "Option 2"]
  });
  saveSurvey();
  saveRemoteSurvey();
  renderAll();
});

document.querySelector("#resetSample").addEventListener("click", () => {
  survey = structuredClone(sampleSurvey);
  responses = [];
  saveSurvey();
  saveResponses();
  saveRemoteSurvey();
  localStorage.removeItem(COMPLETED_KEY);
  renderAll();
});

document.querySelector("#copyLink").addEventListener("click", async () => {
  await navigator.clipboard.writeText(getPublicUrl());
  document.querySelector("#copyLink").textContent = "Copied";
  setTimeout(() => (document.querySelector("#copyLink").textContent = "Copy"), 1200);
});

publicSurvey.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateRequiredGroups()) return;
  const response = collectResponse(publicSurvey);

  if (BACKEND_ENABLED) {
    try {
      const result = await apiRequest("submit", {
        method: "POST",
        body: { response, survey }
      });

      if (result?.status === 409) {
        alert("A ballot has already been submitted from this IP address.");
        return;
      }

      if (!result?.ok) {
        alert("The ballot could not be saved. Please try again.");
        return;
      }

      mergeRemoteOptions(result.data.options || {});
    } catch (error) {
      alert("The ballot could not reach the survey server. Please try again.");
      return;
    }
  } else {
    responses.push(response);
  }

  saveSurvey();
  saveResponses();
  localStorage.setItem(COMPLETED_KEY, survey.slug);
  publicSurvey.reset();
  alert(survey.thankYou || thankYouText);
  setView("dashboard");
});

document.querySelector("#exportCsv").addEventListener("click", exportCsv);
document.querySelector("#seedResponses").addEventListener("click", seedDemoResponses);

const initial = location.hash.replace("#", "");
loadRemoteConfig().finally(() => {
  renderAll();
  setView(initial.startsWith("survey/") ? "survey" : initial || "survey");
});
