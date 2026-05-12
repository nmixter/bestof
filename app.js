const STORAGE_KEY = "guscm-best-of-2026-survey";
const RESPONSE_KEY = "guscm-best-of-2026-responses";
const COMPLETED_KEY = "guscm-best-of-2026-completed";
const ADMIN_PASSWORD_KEY = "guscm-best-of-2026-admin-password";
const API_ENDPOINT = "/.netlify/functions/survey";
const BACKEND_ENABLED = location.protocol !== "file:";
const params = new URLSearchParams(location.search);
const ADMIN_MODE = params.get("admin") === "1";
const PREVIEW_MODE = ADMIN_MODE && params.get("preview") === "1";

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
  "Place to celebrate an adult Birthday or milestone",
  "Dog Friendly Restaurants",
  "Dog Friendly Hikes",
  "Dog Friendly Beaches"
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sortChoiceOptions(options) {
  const seen = new Set();
  const cleaned = [];

  options
    .filter((option) => option && option !== "Other")
    .forEach((option) => {
      const key = normalizeChoice(option);
      if (seen.has(key)) return;
      seen.add(key);
      cleaned.push(option);
    });

  return cleaned.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

const retiredOptions = {
  "best-day-camp": ["Seymour Marine Discovery Center Ocean Explorers", "Redwood Music Teen Camp"],
  "best-residential-camp": ["Camp Hammer"],
  "best-radio-station": ["KDON 102.5"]
};

function cleanQuestionOptions(questionId, options) {
  const retired = retiredOptions[questionId] || [];
  return options.filter(
    (option) => !retired.some((retiredOption) => normalizeChoice(retiredOption) === normalizeChoice(option))
  );
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
  if (category.startsWith("Dog Friendly")) return "Dog Friendly";
  if (category.includes("Birthday")) return "Celebrations";
  if (["Bakery", "Coffee Shop", "Breakfast", "Deli", "Dinner", "Fine Dining", "Grocery Store", "Ice Cream", "Pizza", "Sushi", "Taqueria", "To Go", "Family Friendly Restaurant"].includes(category)) return "Food";
  return "Shopping";
}

const categoryOptions = {
  "Day Camp": ["All About Theatre", "Art Factory", "Be Natural Music", "Camp Gateway", "City of Santa Cruz Parks & Recreation", "Drawn2Art", "International Academy of Dance Santa Cruz", "Kennolyn Camps", "Mount Hermon Adventures", "Mount Madonna School", "Redwood Music Kid Camp", "Santa Cruz County Parks Summer Camps", "Santa Cruz Museum of Natural History Camps", "Santa Cruz SPCA Kids Camp", "Santa Cruz Waldorf School", "Scotts Valley Recreation", "Tannery World Dance & Cultural Center Camp", "Tara Redwood School", "WEST Performing Arts"],
  "Residential Camp": ["Camp Krem", "Kennolyn Camps", "Monte Toyon Camp and Conference Center", "Mount Hermon Redwood Camp", "Redwood Music Teen Camp", "YMCA Camp Campbell"],
  "Bakery": ["Gayle's Bakery & Rosticceria", "The Buttery", "Companion Bakeshop", "Kelly's French Bakery", "The Grove Cafe & Bakery", "Manresa Bread", "Emily's Bakery", "Pacific Cookie Company", "Beckmann's Old World Bakery", "Aldo's Bakery"],
  "Coffee Shop": ["Verve Coffee Roasters", "Cat & Cloud Coffee", "11th Hour Coffee", "Santa Cruz Coffee Roasting Co.", "Lulu Carpenter's", "Firefly Coffee House", "People's Coffee", "Java Junction", "Mariposa Coffee Bar", "Coffeeville"],
  "Breakfast": ["Zachary's Restaurant", "Linda's Seabreeze Cafe", "Harbor Cafe", "Cafe Brasil", "Walnut Avenue Cafe", "The Picnic Basket", "Silver Spur", "Red Apple Cafe", "The Grove Cafe & Bakery", "Avenue Cafe"],
  "Deli": ["Zoccoli's Delicatessen", "Seabright Deli", "Erik's DeliCafe", "Garden Deli", "Ben Lomond Market", "Staff of Life Natural Foods Deli", "New Leaf Community Markets Deli", "Shopper's Corner Deli", "Aptos Street BBQ", "The Picnic Basket"],
  "Dinner": ["Bantam", "Crow's Nest Restaurant", "Hindquarter Bar & Grille", "Hula's Island Grill", "Ideal Bar & Grill", "Laili Restaurant", "Oswald Restaurant", "Sanderlings Restaurant", "Shadowbrook Restaurant", "The Point Chophouse", "Venus Spirits Cocktails & Kitchen"],
  "Fine Dining": ["Gabriella Cafe", "Home Restaurant", "Laili Restaurant", "La Posta", "Oswald Restaurant", "Sanderlings Restaurant", "Shadowbrook Restaurant", "The Point Chophouse", "Venus Spirits Cocktails & Kitchen"],
  "Grocery Store": ["New Leaf Community Markets", "Staff of Life Natural Foods", "Shopper's Corner", "Deluxe Foods of Aptos", "Ben Lomond Market", "Grocery Outlet Santa Cruz", "Safeway Capitola", "Nob Hill Foods Scotts Valley", "Whole Foods Market Santa Cruz", "Wild Roots Market"],
  "Ice Cream": ["The Penny Ice Creamery", "Marianne's Ice Cream", "Mission Hill Creamery", "Polar Bear Ice Cream", "Marini's Candies", "Pacific Cookie Company", "Boardwalk Dipper", "Sno-White Drive-In", "Fosters Freeze Watsonville", "Cold Stone Creamery Capitola"],
  "Pizza": ["Woodstock's Pizza", "Pizza My Heart", "Pizzeria Avanti", "Engfer Pizza Works", "Pleasure Pizza", "Bantam", "La Bufala", "Tony & Alba's Pizza", "Upper Crust Pizza & Pasta", "Bookie's Pizza", "Kianti's Pizza & Pasta Bar"],
  "Sushi": ["Mobo Sushi", "Akira Sushi", "Sushi Garden", "Geisha Japanese Restaurant & Tea House", "Sushi Totoro", "Otoro Sushi", "Sushi Mori", "Naka Sushi", "Kaito Japanese Restaurant", "Shogun Japanese Restaurant"],
  "Taqueria": ["Taqueria Vallarta", "Los Pericos Taqueria", "Taqueria Santa Cruz", "Taqueria Los Gallos", "Taqueria Agave", "Taqueria La Cabana", "Taqueria Los Pericos", "Taqueria Mi Tierra", "Taqueria Jalapenos", "Taqueria El Dandy"],
  "To Go": ["Aptos Street BBQ", "Boardwalk Grille", "Charlie Hong Kong", "New Leaf Community Markets Deli", "Pizza My Heart", "Pretty Good Advice", "Samba Rock Acai Cafe", "Seabright Deli", "Staff of Life Natural Foods Deli", "Taqueria Vallarta", "The Picnic Basket", "Zoccoli's Delicatessen"],
  "Family Friendly Restaurant": ["Aptos Street BBQ", "Betty Burgers", "Cafe Brasil", "Carpo's Restaurant", "Harbor Cafe", "Ideal Bar & Grill", "Kianti's Pizza & Pasta Bar", "Pizza My Heart", "Red Apple Cafe", "Santa Cruz Beach Boardwalk Restaurants", "Sno-White Drive-In", "The Hideout", "Woodstock's Pizza"],
  "After School Care": ["Baymonte Christian School Extended Care", "Be Natural Music", "Boys & Girls Clubs of Santa Cruz County", "Campus Kids Connection", "City of Watsonville Parks and Community Services", "Gateway School Extended Care", "Mount Madonna School Extended Care", "Orchard School Extended Care", "Santa Cruz City Schools After School Programs", "Scotts Valley Recreation", "YMCA of San Benito County Child Care"],
  "Art": ["Art Factory", "Arts Council Santa Cruz County", "Cabrillo Gallery", "Drawn2Art", "Felix Kulpa Gallery", "Lenz Arts", "Palace Art & Office Supply", "Radius Gallery", "Santa Cruz Art Center", "Santa Cruz Mountains Art Center", "Santa Cruz Museum of Art & History", "Studio Sprout", "Tannery Arts Center"],
  "Dance": ["Tannery World Dance & Cultural Center", "Motion Pacific", "International Academy of Dance Santa Cruz", "Dancenter", "No Limits Dance & Performing Arts", "Santa Cruz Ballet Theatre", "Agape Dance Academy", "Pacific Arts Complex", "Watsonville Taiko", "Santa Cruz Dance Company"],
  "Music": ["Be Natural Music", "Cabrillo Festival of Contemporary Music", "Community Music School of Santa Cruz", "Everyone's Music School", "Kuumbwa Jazz", "More Music Santa Cruz", "MusicalMe", "Pacific Voices", "Santa Cruz Music School", "Santa Cruz Symphony", "Sylvan Music"],
  "Sport": ["Aptos Soccer Club", "International Academy of Dance Santa Cruz", "Parks & Recreation Santa Cruz Sports", "Santa Cruz County Cycling Club", "Santa Cruz County Youth Soccer Club", "Santa Cruz Little League", "Santa Cruz Rugby", "Santa Cruz Track Club", "Santa Cruz Warriors Basketball Academy", "Scotts Valley Sportsmen's Club", "Watsonville Youth Soccer League"],
  "Swimming": ["Jim Booth Swim School", "Adventure Sports Unlimited", "Santa Cruz Swim School", "Simpkins Family Swim Center", "Seahorse Swim School", "Watsonville YMCA", "Santa Cruz Masters Aquatics", "Cabrillo College Pool", "Scotts Valley Recreation Swim", "Aptos Cabrillo Swim Club"],
  "Theater": ["Actors' Theatre", "All About Theatre", "Cabrillo Stage", "Colligan Theater", "Henry J. Mello Center", "Jewel Theatre Company", "Mountain Community Theater", "Rio Theatre", "Santa Cruz Shakespeare", "The 418 Project", "WEST Performing Arts"],
  "Gymnastics": ["Community Mountain Gym", "JuneBug's Gym", "Santa Cruz Gymnastics Center", "Scotts Valley Recreation Gymnastics"],
  "Bank": ["Bank of America", "Bay Federal Credit Union", "Chase Bank", "Comerica Bank", "Comerica Bank Aptos", "Lighthouse Bank", "Santa Cruz Community Credit Union", "Santa Cruz County Bank", "U.S. Bank", "Wells Fargo", "West Coast Community Bank"],
  "Place/House of Worship": ["Twin Lakes Church", "Holy Cross Catholic Church", "Temple Beth El", "St. Joseph's Catholic Church", "Calvary Episcopal Church", "Peace United Church of Christ", "Vintage Faith Church", "Santa Cruz Bible Church", "Resurrection Catholic Community", "Watsonville Buddhist Temple"],
  "Insurance": ["State Farm - Larry Pearson", "State Farm - Stacey Ziegler", "Farmers Insurance - Santa Cruz", "Allstate Insurance Santa Cruz", "Goosehead Insurance Santa Cruz", "Coastal Insurance Services", "HUB International Santa Cruz", "Bargetto Insurance", "Acrisure Santa Cruz", "Santa Cruz Insurance Services"],
  "Photographer": ["Alicia Telfer Photography", "Crystal Birns Photography", "De Joy Photography", "Kelley Williams Photography", "Kimberly Sandoval Photography", "Michele Duffy Photography", "Rebecca Stark Photography", "Renae Zipfel Photography", "Santa Cruz Photo Booth", "Shmuel Thaler Photography", "Viera Photographics"],
  "Realtor": ["Anderson Christie Real Estate", "Bailey Properties", "Coldwell Banker Realty Santa Cruz", "David Lyng Real Estate", "Eli Karon, Karon Properties", "eXp Realty Santa Cruz", "Justin McNabb", "Keller Williams Realty Santa Cruz", "Montalvo Homes & Estates", "Monterey Bay Properties", "Room Real Estate", "Sotheby's International Realty Santa Cruz"],
  "Dentist/Orthodontist": ["Alison K. Jackson, D.D.S. Children's Dentistry", "Aptos Dental Care", "Benedict Orthodontics", "Capitola Kids Dentistry", "Dientes Community Dental Care", "Kids Dental Specialists", "Lighthouse Dental", "Santa Cruz Dental Group", "Santa Cruz Orthodontics", "Scotts Valley Dental Care", "Watsonville Family Dental", "Western Dental Watsonville"],
  "Fitness": ["CrossFit Santa Cruz", "Enterprise Fitness Center", "In-Shape Capitola", "Minorsan Self-Defense & Fitness", "Pacific Edge Climbing Gym", "Santa Cruz CORE Fitness + Rehab", "Santa Cruz Power Fitness", "Santa Cruz Yoga", "Watsonville Family YMCA", "Westside Barbell Club"],
  "Hospital": ["Dominican Hospital", "Watsonville Community Hospital", "Sutter Maternity & Surgery Center of Santa Cruz", "Santa Cruz County Health Services Agency", "Palo Alto Medical Foundation Santa Cruz", "Salud Para La Gente"],
  "Pediatrician": ["Bruce Block, M.D. - Palo Alto Medical Foundation", "Dignity Health Medical Group Dominican", "Nicole Marsico, M.D.", "Palo Alto Medical Foundation Pediatrics Santa Cruz", "Pediatric Medical Group of Santa Cruz", "Salud Para La Gente Pediatrics", "Santa Cruz Community Health", "Sutter Health Pediatrics Capitola", "Sutter Pediatrics Aptos", "Watsonville Health Center"],
  "Reproductive": ["Dignity Health Dominican Women's Health", "Dr. Gail Oderman", "Palo Alto Medical Foundation Obstetrics and Gynecology", "Planned Parenthood Mar Monte Santa Cruz", "Salud Para La Gente Women's Health", "Santa Cruz Community Health Women's Health", "Sutter Maternity & Surgery Center of Santa Cruz"],
  "Midwife/Doula": ["Birth Center of Santa Cruz", "Birth Network of Santa Cruz County", "Britta Paterson", "Luma Birth", "Nora Yerena", "Pacific Maternity", "Santa Cruz Doula Collective", "Santa Cruz Midwives"],
  "Therapist": ["Balance4Kids", "Center for Child and Adolescent Mental Health", "Encompass Community Services", "Family Service Agency of the Central Coast", "Janus of Santa Cruz", "Monarch Services", "NAMI Santa Cruz County", "New Life Community Services", "Pajaro Valley Prevention and Student Assistance", "Santa Cruz Community Counseling Center", "The Camp Recovery Center"],
  "Specialist": ["Santa Cruz Medical Clinic", "Palo Alto Medical Foundation Santa Cruz", "Dignity Health Medical Group Dominican", "Santa Cruz Orthopaedic Institute", "Santa Cruz Ear Nose and Throat", "Santa Cruz Dermatology", "Santa Cruz Eye Medical Group", "Central Coast Allergy and Asthma", "Sutter Health Santa Cruz", "Salud Para La Gente"],
  "Beach": ["Capitola Beach", "Main Beach", "Manresa State Beach", "Natural Bridges State Beach", "New Brighton State Beach", "Rio Del Mar State Beach", "Seabright State Beach", "Seacliff State Beach", "Sunset State Beach", "Twin Lakes State Beach"],
  "Park": ["Anna Jean Cummings Park", "Aptos Village Park", "DeLaveaga Park", "Harvey West Park", "Leo's Haven", "Ocean View Park", "Pinto Lake County Park", "Quail Hollow Ranch County Park", "Skypark", "Wilder Ranch State Park"],
  "Hiking": ["Wilder Ranch State Park", "Henry Cowell Redwoods State Park", "The Forest of Nisene Marks State Park", "Pogonip Open Space", "Quail Hollow Ranch County Park", "Fall Creek Unit", "Moore Creek Preserve", "Arana Gulch", "DeLaveaga Park", "Byrne-Milliron Forest"],
  "Amusement Park": ["Boardwalk Bowl", "Mount Hermon Adventures", "Neptune's Kingdom", "Roaring Camp Railroads", "Santa Cruz Beach Boardwalk", "Santa Cruz Roller Palladium", "Santa Cruz Wharf", "Seymour Marine Discovery Center", "Skypark"],
  "Hair Salon": ["Arrow Beauty Bar", "Faust Salon Downtown", "Lavish Salon", "Nirvana Salon", "Opal Spa & Boutique", "Parlour at the Point", "Pleasure Point Hair Design", "Salon on the Square", "Seaweed Hair Design", "Watsonville Hair Company", "Yoso Wellness Spa"],
  "Spa": ["Chaminade Resort & Spa", "Coco Spa", "Opal Spa & Boutique", "Sage Float Spa", "Santa Cruz Ayurveda", "SkinSpirit Santa Cruz", "Tea House Spa", "The Santa Cruz Spa", "Vital Body Therapy", "Well Within Spa", "Yoso Wellness Spa"],
  "Massage Therapist": ["Aptos Massage Therapy", "Chaminade Resort & Spa", "Opal Spa & Boutique", "Positive Pressure Physical Therapy", "Sage Float Spa", "Santa Cruz CORE Fitness + Rehab", "Santa Cruz Massage Therapy", "Tea House Spa", "Vital Body Therapy", "Well Within Spa", "Yoso Wellness Spa"],
  "Nail Salon": ["Aptos Nails", "Capitola Nails", "Diva Nails", "Nail Club Santa Cruz", "Nail Spa Santa Cruz", "Ocean Nails", "Opal Spa & Boutique", "Perfect Nails Santa Cruz", "Scotts Valley Nails", "Tracy's Nails", "Watsonville Nails"],
  "Kennel": ["Animal Hospital of Soquel Boarding", "Aptos-Creekside Pet Hospital Boarding", "Bed & Biscuits Groomingdales", "Boulder Creek Veterinary Clinic Boarding", "Canine Corral", "Doggie Dude Ranch", "Kennel Club Loma Prieta", "Pawsitive Styles", "Santa Cruz Pet Resort", "The Velvet Coat", "Woofpack"],
  "Pet supplies": ["Aptos Feed & Pet Supply", "Ben Lomond Feed", "Boulder Creek Feed & Pet Supply", "Capitola Feed & Pet", "General Feed & Seed", "Pet Pals Discount Pet Food & Supplies", "Petco Santa Cruz", "PetSmart Capitola", "The Whole Pet Vet Shop", "Westside Farm and Feed"],
  "Veterinarian": ["Adobe Animal Hospital of Soquel", "Animal Hospital of Soquel", "Aptos-Creekside Pet Hospital", "Boulder Creek Veterinary Clinic", "Capitola Veterinary Hospital", "Companion Animal Hospital", "Gustin - Van Every Mobile Veterinary Medicine", "Pacific & Santa Cruz Veterinary Specialists", "Scotts Valley Veterinary Clinic", "The Whole Pet Vet Hospital and Wellness Center", "Ty McConnell DVM", "Westside Animal Hospital"],
  "Radio Station": ["KSQD Community Radio", "KZSC Santa Cruz", "KPIG Radio", "KAZU", "KION 1460", "KMBY 1240", "KBOQ 103.9", "KOCN 105.1", "KUSP Archives"],
  "Art Supplies": ["Palace Art & Office Supply", "Lenz Arts", "Beverly's Fabrics", "Santa Cruz Art Center", "Bookshop Santa Cruz Art Supplies", "Michaels Capitola", "Wild Roots Market Floral and Craft", "Felton Mercantile", "Mountain Feed and Farm Supply", "Artisans & Agency"],
  "Baby": ["Baby Bloomers", "Bookshop Santa Cruz", "Bunny's Shoes", "Children's Discovery Museum Store", "Jelli Beanz Kids Resale", "Little Trends", "Mini Mint", "New Leaf Community Markets Baby", "Stripe Design Group", "Target Capitola", "Toys N Tech"],
  "Bike Shop": ["Another Bike Shop", "Bicycle Trip", "Cycle Works", "Epicenter Cycling", "Family Cycling Center", "Santa Cruz Bicycles", "Scotts Valley Cycle Sport", "Shuttle Smith Adventures", "Spokesman Bicycles", "Watsonville Cyclery"],
  "Children's Clothing": ["Baby Bloomers", "Bunny's Shoes", "Gap Capitola Mall", "Jelli Beanz Kids Resale", "Lively Kids", "O'Neill Surf Shop", "Patagonia Outlet Santa Cruz", "Rip Curl Capitola", "Shop Lively", "Stripe Design Group", "Target Capitola", "Toys N Tech"],
  "Gift Shop": ["Annieglass", "Artisans & Agency", "Bookshop Santa Cruz", "Botanic and Luxe", "Capitola Mercantile", "Dig Gardens", "Home/Work", "Santa Cruz Beach Boardwalk Gift Shops", "Santa Cruz Museum of Art & History Store", "Seymour Marine Discovery Center Store", "Stripe Design Group", "Zinnia's"],
  "Home Decor": ["Annieglass", "Berdels", "Botanic and Luxe", "Dig Gardens", "Home/Work", "Lenz Arts", "Santa Cruz Reclaimed", "Stripe Design Group", "Wisteria Antiques", "World Market Santa Cruz"],
  "Nursery/Garden": ["Alladin Nursery", "Boulder Creek Nursery", "Central Home Supply", "Dig Gardens", "Far West Nursery", "Mountain Feed and Farm Supply", "ProBuild Garden Center", "San Lorenzo Garden Center", "Scarborough Gardens", "The Garden Company"],
  "Skate/ Surf": ["Arrow Surf & Sport", "Bill's Wheels Skateshop", "Billabong Santa Cruz", "Freeline Surf Shop", "Midtown Surf Shop", "NHS Fun Factory", "O'Neill Surf Shop", "Pacific Wave", "Rip Curl Santa Cruz", "Santa Cruz Skateboards", "Santa Cruz Surf Shop"],
  "Teen Clothing": ["Pacific Wave", "Berdels", "O'Neill Surf Shop", "Rip Curl Capitola", "Patagonia Outlet Santa Cruz", "Stripe Design Group", "Billabong Santa Cruz", "Gap Capitola Mall", "Target Capitola", "Urban Outfitters Santa Cruz"],
  "Toys": ["Atlantis Fantasyworld", "Bookshop Santa Cruz", "Bunny's Shoes", "Childish", "Children's Discovery Museum Store", "Comicopolis", "Marini's Candies", "Santa Cruz Beach Boardwalk Gift Shops", "Seymour Marine Discovery Center Store", "Target Capitola", "Toys N Tech", "Wonderland Toys"],
  "Women's Clothing": ["Berdels", "Botanic and Luxe", "Cameron Marks", "Closet Shopper", "Gap Capitola Mall", "O'Neill Surf Shop", "Pacific Trading Company", "Pacific Wave", "Patagonia Outlet Santa Cruz", "Rip Curl Capitola", "Stripe Design Group", "Wallflower Boutique"],
  "Charter": ["Alternative Family Education", "Ceiba College Preparatory Academy", "Cypress Charter High School", "Delta Charter High School", "Linscott Charter School", "Nature Academy", "Ocean Grove Charter School", "Ocean Alternative Education Center", "Pacific Collegiate School", "Santa Cruz Montessori Charter School", "Watsonville Charter School of the Arts"],
  "Elementary": ["Amesti Elementary School", "Bay View Elementary School", "DeLaveaga Elementary School", "Gateway School", "Gault Elementary School", "Main Street Elementary School", "Mar Vista Elementary School", "Mount Madonna School", "Orchard School", "Rio del Mar Elementary School", "Valencia Elementary School", "Vine Hill Elementary School", "Westlake Elementary School"],
  "Middle School": ["Aptos Junior High School", "Branciforte Middle School", "E. A. Hall Middle School", "Gateway School", "Kirby School", "Mission Hill Middle School", "Mount Madonna School", "New Brighton Middle School", "Pacific Collegiate School", "Pajaro Middle School", "Rolling Hills Middle School", "San Lorenzo Valley Middle School", "Scotts Valley Middle School", "Shoreline Middle School"],
  "High School": ["Aptos High School", "Cypress Charter High School", "Harbor High School", "Kirby School", "Mount Madonna School", "Pacific Collegiate School", "Pajaro Valley High School", "San Lorenzo Valley High School", "Santa Cruz High School", "Scotts Valley High School", "Soquel High School", "Watsonville High School"],
  "Preschool": ["Baymonte Christian Preschool", "Bridges to Kinder", "Campus Kids Connection Preschool", "Discovery Preschool and Family Center", "Holy Cross Preschool", "Mount Madonna School Preschool", "Rocking Horse Ranch Preschool", "Santa Cruz Montessori", "St. Lawrence Academy Preschool", "Tara Redwood School"],
  "Private School": ["Baymonte Christian School", "Chrysostom Classical Academy", "Gateway School", "Holy Cross School", "Kirby School", "Mount Madonna School", "Orchard School", "Salesian Elementary and Junior High", "Santa Cruz Montessori", "St. Francis High School"],
  "Place to celebrate kid's Birthday": ["Boardwalk Bowl", "JuneBug's Gym", "Mount Hermon Adventures", "Petroglyph Ceramic Lounge", "Roaring Camp Railroads", "Santa Cruz Beach Boardwalk", "Santa Cruz Children's Museum of Discovery", "Santa Cruz Gymnastics Center", "Santa Cruz Roller Palladium", "Seymour Marine Discovery Center", "Skypark"],
  "Place to celebrate an adult Birthday or milestone": ["Bargetto Winery", "Chaminade Resort & Spa", "Kuumbwa Jazz", "Laili Restaurant", "Oswald Restaurant", "Sanderlings Restaurant", "Santa Cruz Mountain Brewing", "Shadowbrook Restaurant", "The Dream Inn", "Venus Spirits Cocktails & Kitchen"],
  "Dog Friendly Restaurants": ["Aldo's Harbor Restaurant", "Aptos Street BBQ", "Betty Burgers", "Cafe Cruz", "Carpo's Restaurant", "Hula's Island Grill", "Laili Restaurant", "Parish Publick House Aptos", "Seabright Social", "The Hideout"],
  "Dog Friendly Hikes": ["Arana Gulch", "DeLaveaga Park", "Henry Cowell Redwoods State Park", "Moore Creek Preserve", "Pogonip Open Space", "Quail Hollow Ranch County Park", "The Forest of Nisene Marks State Park", "Wilder Ranch State Park"],
  "Dog Friendly Beaches": ["Its Beach", "Mitchell's Cove Beach", "New Brighton State Beach", "Rio Del Mar State Beach", "Seabright State Beach", "Twin Lakes State Beach"]
};

function createBallotQuestion(category) {
  const id = `best-${slugify(category)}`;

  return {
    id,
    label: `Best ${category}`,
    type: "select-other",
    required: false,
    category: categoryGroup(category),
    options: [...sortChoiceOptions(cleanQuestionOptions(id, categoryOptions[category] || [])), "Other"]
  };
}

const sampleSurvey = {
  version: 8,
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
    ...ballotCategories.map(createBallotQuestion)
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
  if (!ADMIN_MODE && name !== "survey") {
    name = "survey";
  }

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
  return `${location.origin}${location.pathname.replace(/admin\.html$/, "index.html")}#survey/${survey.slug}`;
}

function renderAll() {
  document.body.classList.toggle("admin-mode", ADMIN_MODE);
  document.body.classList.toggle("public-mode", !ADMIN_MODE);
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

    if (isCurrentSurveyConfig(result.data.survey)) {
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

    if (isCurrentSurveyConfig(result.data.survey)) {
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

function isCurrentSurveyConfig(remoteSurvey) {
  return Boolean(remoteSurvey && Number(remoteSurvey.version || 0) >= sampleSurvey.version);
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

    const merged = [...cleanQuestionOptions(question.id, question.options.filter((option) => option !== "Other"))];
    remoteOptions.forEach((option) => {
      if (
        option &&
        option !== "Other" &&
        cleanQuestionOptions(question.id, [option]).length &&
        !merged.some((existing) => normalizeChoice(existing) === normalizeChoice(option))
      ) {
        merged.push(option);
        changed = true;
      }
    });

    return { ...question, options: [...sortChoiceOptions(merged), "Other"] };
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

  if (!ADMIN_MODE && localStorage.getItem(COMPLETED_KEY) === survey.slug) {
    surveyQuestions.innerHTML = '<p class="empty">This browser has already submitted a ballot for this survey.</p>';
    publicSurvey.querySelector(".submit").disabled = true;
    return;
  }

  publicSurvey.querySelector(".submit").disabled = false;
  publicSurvey.querySelector(".submit").textContent = PREVIEW_MODE ? "Preview Only" : "Done";

  if (PREVIEW_MODE) {
    const notice = document.createElement("p");
    notice.className = "preview-notice";
    notice.textContent = "Admin preview mode. This ballot will not be submitted or counted.";
    surveyQuestions.appendChild(notice);
  }

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
  const options = [...sortChoiceOptions(cleanQuestionOptions(question.id, question.options)), "Other"];

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
  if (!cleanQuestionOptions(questionId, [option]).length) return;

  survey.questions = survey.questions.map((question) => {
    if (question.id !== questionId || question.options.includes(option)) return question;
    return { ...question, options: [...sortChoiceOptions(cleanQuestionOptions(question.id, [...question.options, option])), "Other"] };
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
  for (let index = 0; index < 18; index += 1) {
    const answers = {};
    survey.questions.forEach((question) => {
      if (question.type === "single" || question.type === "select-other") answers[question.id] = pick(question.options.filter((option) => option !== "Other"));
      if (question.type === "multiple") answers[question.id] = shuffle(question.options).slice(0, 2);
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

  if (PREVIEW_MODE) {
    alert("Preview mode only. No ballot was submitted or counted.");
    return;
  }

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
  const fallbackView = ADMIN_MODE ? "dashboard" : "survey";
  setView(initial.startsWith("survey/") ? "survey" : initial || fallbackView);
});
