import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sources = [
  ['data/source/clerk-2025-q4-agreements.json', 'Agreement/Contract'],
  ['data/source/clerk-2026-agreements.json', 'Agreement/Contract'],
  ['data/source/clerk-2025-q4-amendments.json', 'Renewals/Extensions/Amendments'],
  ['data/source/clerk-2026-amendments.json', 'Renewals/Extensions/Amendments'],
];

const rows = sources.flatMap(([file]) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')));
const clean = (value) => value.replace(/\s+/g, ' ').trim();
const documentId = (onclick) => onclick?.match(/Download\/(\d+)/)?.[1] ?? null;
const baseNumber = (number) => number.replace(/\s+(?:AM|RN|EXT|MOD)\d.*$/i, '').trim();
const dateIso = (value) => {
  const [month, day, year] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const overrides = [
  [/CARL PUGH PARK DRAINAGE/i, { vendor: 'Kirby Development, Inc.', bid: '25/26-041', approved: 250559.42, ceiling: 250559.42, substantive: 'https://claycounty.novusagenda.com/agendapublic/CoverSheet.aspx?ItemID=16674&MeetingID=2143' }],
  [/JAIL FIRE ALARM UPGRADE/i, { vendor: 'Firetrol Protection Systems, Inc.', bid: '25/26-017', approved: 265476, substantive: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2143&MinutesMeetingID=-1&doctype=Agenda' }],
  [/MOSQUITO CONTROL PROGRAM SERVICES/i, { vendor: 'Vector Disease Control International', bid: '25/26-084', substantive: 'https://claycounty.novusagenda.com/agendapublic/CoverSheet.aspx?ItemID=16851&MeetingID=2160', note: 'Routine service price verified at $25,571 monthly less a $1,800 monthly county-facility credit; as-needed work and actual payments remain unverified.' }],
  [/OAKLEAF COMMUNITY PARK DRAINAGE/i, { vendor: 'H&H Land and Marine, LLC', bid: '25/26-074', approved: 156770.2, substantive: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2143&MinutesMeetingID=-1&doctype=Agenda' }],
  [/MOBILE TRAILERS FOR FIREFIGHTER/i, { vendor: "Fly'n Bryan Trailer Sales dba FB Trailers", bid: '25/26-073', approved: 75196, ceiling: 75196, substantive: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2164&doctype=Agenda' }],
  [/CONSTRUCTION ENGINEERING AND INSPECTION SERVICES FOR SUN TRAIL/i, { vendor: 'Eisman & Russo, Inc.', bid: '25/26-016', substantive: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2160&MinutesMeetingID=-1&doctype=Agenda', note: 'Top-ranked firm and executed agreement matched; agreement amount and actual payments remain unverified.' }],
];

const nonSpend = /ADOPT.A.MILE|MEMORANDUM|\bMOU\b|INTERLOCAL|GRANT AGREEMENT|GRANT AWARD|FUNDING AGREEMENT|CREDIT AGREEMENT|DONATION|LEASE AGREEMENT - (?:SUPERVISOR|CARL PUGH|LITTLE RAIN|NEPTUNE|OAKLEAF|OMEGA|PAUL C|TWIN LAKES)|LIEN REDUCTION|LETTER OF INTENT|AFFILIATION AGREEMENT|STATE HOUSING INITIATIVES|EQUITABLE SHARING|SPONSORSHIP AGREEMENT|SOVEREIGNTY SUBMERGED/i;
const software = /SOFTWARE|SAAS|SUBSCRIPTION|CLOUD|GOVACCESS|GWORKS|LINKEDIN|OVERDRIVE|PERRY WEATHER|FUELMASTER|XONAR|TRUEPORT|TRUESCAN|APCO INTELLICOM|AVAAP|WORKDAY|TYLER TECHNOLOGIES|GRANICUS|CARASHOFT|ESRI|ENVIRONMENTAL SYSTEMS RESEARCH|MOTOROLA|MOTIROLA|T-MOBILE|LOBBY TOOLS|BUTTERFLY NETWORK|SWIFTGOV|CIVITEK|KESTREL|CIS - CENTER FOR INTERNET SECURITY|IMPACT WORKS|MONDAY\.COM|MICROSOFT|HOOPLA|IT SUPPORT SERVICES|PLACER\.AI|EPROVAL WEB-BASED|DOW JONES|OPERATIVE IQ LICENSING/i;
const softwareVendors = [
  [/GENERAL DEVICES/i, 'General Devices, LLC'], [/LOBBY TOOLS/i, 'LobbyTools'], [/MOTOROLA|MOTIROLA/i, 'Motorola Solutions'],
  [/T-MOBILE/i, 'T-Mobile'], [/TYLER TECHNOLOGIES/i, 'Tyler Technologies'], [/WORKDAY/i, 'Workday'], [/AVAAP/i, 'Avaap'],
  [/APCO INTELLICOM/i, 'APCO International'], [/CIVITEK|KESTREL/i, 'CiviTek / Kestrel Government Solutions'], [/OVERDRIVE/i, 'OverDrive'],
  [/AK ASSOCIATES/i, 'AK Associates'], [/SYNTECH|FUELMASTER/i, 'Syn-Tech Systems'], [/CENTER FOR INTERNET SECURITY|MS-ISAC/i, 'Center for Internet Security'],
  [/GWORKS/i, 'gWorks'], [/ENVIRONMENTAL SYSTEMS RESEARCH|\bESRI\b/i, 'Esri'], [/GRANICUS|CARASHOFT/i, 'Granicus / Carahsoft'],
  [/LINKEDIN/i, 'LinkedIn Corporation'], [/PERRY WEATHER/i, 'Perry Weather'], [/UKG|KRONOS/i, 'UKG'], [/XONAR|TRUEPORT|TRUESCAN/i, 'Xonar'],
  [/BUTTERFLY NETWORK/i, 'Butterfly Network'], [/IMPACT WORKS/i, 'Impact Works'], [/SWIFTGOV/i, 'SwiftGov'], [/CUBIC TRANSPORTATION/i, 'Cubic Transportation Systems'],
];

function category(title) {
  if (software.test(title)) return 'Software/SaaS/Subscriptions/IT';
  if (/JAIL|SHERIFF|CCSO/i.test(title)) return 'Sheriff/Jail';
  if (/FIRE|EMS|HAZMAT|PARAMEDIC|\bCCFR\b/i.test(title)) return 'Fire/EMS';
  if (/PUBLIC SAFETY|EOC|EMERGENCY|GUN RANGE|RADIO SYSTEM|\bFDLE\b|COURTHOUSE ACCESS SECURITY/i.test(title)) return 'Public Safety';
  if (/STORMWATER|DRAINAGE|POND/i.test(title)) return 'Stormwater/Drainage';
  if (/MOSQUITO|DEBRIS|ENVIRONMENT|CONSERVATION|LAKE GENEVA|WASTE TIRE|HAZARDOUS WASTE|TREE REMOVAL|MITIGATION BANK/i.test(title)) return 'Environmental/Mosquito';
  if (/BLUEMEDICARE|FIDELITY WORKPLACE|STOP LOSS|STORM WIND|HEALTHCARE.*(?:GROUP|PLAN|BENEFIT)|EXPRESS SCRIPTS|\bPBM\b/i.test(title)) return 'Insurance/Benefits';
  if (/HEALTH DEPARTMENT|HUMAN SERVICES|BEHAVIOR|SUBSTANCE USE|MEDICAL DIRECTOR|BLOOD (?:STORAGE|SERVICES|PRODUCTS)|UNITED HEALTHCARE|YOUTH CRISIS|ELDER AFFAIRS|DECEASED PERSONS|SIGN LANGUAGE INTERPRET|LUTHERAN SERVICES|\bLSF\b/i.test(title)) return 'Health/Human Services';
  if (/LEGAL AID|MAGISTRATE|MEDIATION|ATTORNEY|LAW FIRM|ALLEN NORTON|ENGAGEMENT LETTER|PROBLEM.SOLVING COURTS? CASE MANAGER/i.test(title)) return 'Legal';
  if (/ENGINEER|ARCHITECT|GEOTECH|PLANNING|STUDY|INSPECTION SERVICES/i.test(title)) return 'Engineering & Professional Services';
  if (/ROAD|SIDEWALK|TRAFFIC|TRANSPORTATION|BRIDGE|TRAIL|PAVING|RESURFACING|GUARDRAIL|\bCR ?\d|\bFDOT\b|HIGHWAY|RIGHT.OF.WAY|BUS BENCH|ASPHALT MILLING/i.test(title)) return 'Roads/Transportation';
  if (/CCUA|WATER TREATMENT|WATER SERVICE|WASTEWATER|WWTP|UTILITY SERVICE|UTILITIES AGREEMENT|HIGHWAY LIGHTING/i.test(title)) return 'Utilities';
  if (/CONSTRUCTION|REPAIR|REPLACEMENT|RENOVATION|HVAC|ROOF|FENCING|FACILIT|BUILDING|MARINA|BOARDWALK|GAS WATER HEATER|ASBESTOS SURVEY|SERVPRO|AIR HANDLING|DUCT CLEANING/i.test(title)) return 'Construction/Repairs/Facilities';
  if (/\bGRANT\b|INTERLOCAL|SUBAWARD|REGRANT|CDBG|SHIP PROGRAM|AWARD CONFIRMATION|FUNDING AGREEMENT/i.test(title)) return 'Grants/Interlocal Agreements';
  if (/PARK|RECREATION|SPORTS COMPLEX|FITNESS|FAIRGROUNDS|MARINA|PADDLEBOARD|KAYAK|SWIMMING POOL|MOVIE LICENSE|EVENT AGREEMENT|RESERVATION AGREEMENT/i.test(title)) return 'Parks/Recreation';
  if (/COPIER|PRINTER|\bEQUIPMENT\b|APPARATUS|FURNITURE|\bMACHINE\b|FLEET|WORK BOOTS|UNIFORM RENTAL|CYLINDER PRODUCT|VETERINARY SUPPLY|UNINTERRUPTIBLE POWER SUPPLY|FUEL AGREEMENT|CUSTOM SIGNS|STRYKER PREVENTATIVE/i.test(title)) return 'Equipment/Fleet';
  if (/FRANCHISE AGREEMENT FOR CONTAINER|LANDFILL MAINTENANCE|PORTABLE TOILETS|FRONTLOAD CONTAINER/i.test(title)) return 'Solid Waste/Franchises';
  if (/REAL PROPERTY|PROPERTY PURCHASE|CONVEYANCE|\bLIEN REDUCTION|\bLEASE\b|SUBLEASE|TEMPORARY LICENSE|FEE (?:AND .* )?CREDIT AGREEMENT|MOBILITY FEE|LETTER OF INTENT TO ACQUIRE|SUBMERGED LANDS|FORECLOSURE PROPERTY REGISTRY|COUNTY OWNED LEASED PROPERTY|LAND TRUST/i.test(title)) return 'Land/Leases/Real Estate';
  if (/ADOPT.A.MILE|NONPROFIT|COMMUNITY BAND|HISTORICAL SOCIETY|RED CROSS|ASPCA|ANIMAL FRIEND|ANIMAL SERVICES|K9S FOR WARRIORS|DOGS PLAYING|ASSOCIATION|IN-KIND DONATION|HISTORICAL RESOURCES.*ARTIFACTS/i.test(title)) return 'Community/Nonprofit Agreements';
  if (/INSTRUCTOR SERVICES|\bTRAINING\b|SEMINAR AGREEMENT|SCHOOL OF EMS|FLORIDA GATEWAY COLLEGE/i.test(title)) return 'Training/Education';
  if (/PUBLIC LIBRAR|DIVISION OF LIBRARY|LIBRARIES AMENITY|KULTURE CITY - LIBRARIES|CLAY TODAY|OSTEEN MEDIA/i.test(title)) return 'Libraries/Media';
  if (/TOURISM ADVERTISING|FIRST COAST OF GOLF|MILITARY CAMPAIGN|INVESTMENT REQUEST/i.test(title)) return 'Tourism/Marketing';
  if (/CONSULT|LOBBY|FINANCIAL ADVIS|ALLOCATION PLAN|TRIM PROCESSING|EXEMPTION RENEWALS/i.test(title)) return 'Administrative/Consulting';
  return 'Other';
}

function subcategory(title, group) {
  if (group !== 'Engineering & Professional Services') return null;
  if (/GEOTECH/i.test(title)) return 'Geotechnical';
  if (/ARCHITECT|DESIGN/i.test(title)) return 'Architecture & Design';
  if (/CONSTRUCTION ENGINEERING|\bCEI\b/i.test(title)) return 'Construction Engineering & Inspection';
  if (/PLANNING|STUDY/i.test(title)) return 'Planning & Study';
  if (/TRANSPORTATION|TRAFFIC|CIVIL ENGINEER/i.test(title)) return 'Civil / Transportation';
  return 'Other Professional Services';
}

function inferredVendor(title) {
  const override = overrides.find(([pattern]) => pattern.test(title))?.[1];
  if (override?.vendor) return override.vendor;
  if (nonSpend.test(title)) return null;
  const softwareVendor = softwareVendors.find(([pattern]) => pattern.test(title))?.[1];
  if (softwareVendor) return softwareVendor;
  const pieces = title.split(/\s+-\s+/).map(clean).filter(Boolean);
  if (pieces.length > 1) {
    const candidate = pieces.at(-1);
    if (!/^(AGREEMENT|LEASE|GRANT|FY\d|[A-Z ]*SERVICES?)$/i.test(candidate)) return candidate;
  }
  const known = title.match(/^(GRANICUS AT CARAHSOFT|GWORKS|LINKEDIN CORPORATION|OVERDRIVE|PERRY WEATHER|SYNTECH|CIVITEK|XONAR|AVAAP|APCO INTELLICOM|WORKDAY|TYLER TECHNOLOGIES)/i)?.[1];
  return known ? clean(known) : null;
}

const preliminary = rows.map((row) => {
  const [documentType, rawTitle, rawDate, recordNumber] = row.cells;
  const title = clean(rawTitle);
  const override = overrides.find(([pattern]) => pattern.test(title))?.[1] ?? {};
  const isAmendment = documentType === 'Renewals/Extensions/Amendments';
  const vendor = inferredVendor(title);
  const spendingCandidate = Boolean(vendor) && !nonSpend.test(title);
  const id = documentId(row.onclick);
  const recordCategory = category(title);
  return {
    fiscal_year: 'FY2025-26',
    bid_number: override.bid ?? null,
    document_type: documentType,
    record_date: dateIso(rawDate),
    record_number: clean(recordNumber),
    title,
    normalized_vendor: vendor,
    category: recordCategory,
    subcategory: subcategory(title, recordCategory),
    evidence_basis: override.substantive ? 'SUBSTANTIVE OFFICIAL DOCUMENT REVIEWED' : 'CLERK INDEX METADATA ONLY',
    substantive_source_url: override.substantive ?? null,
    procurement_status: override.bid ? 'FOUND' : spendingCandidate ? 'NEEDS VERIFICATION' : 'N/A',
    award_status: override.approved != null || override.bid === '25/26-084' ? 'FOUND' : spendingCandidate ? 'NEEDS VERIFICATION' : 'N/A',
    contract_status: isAmendment ? 'NEEDS VERIFICATION' : 'FOUND',
    amendment_status: isAmendment ? 'FOUND' : 'N/A',
    po_status: spendingCandidate ? 'MISSING' : 'N/A',
    invoice_status: spendingCandidate ? 'MISSING' : 'N/A',
    payment_status: spendingCandidate ? 'MISSING' : 'N/A',
    approved_amount: override.approved ?? null,
    contract_ceiling: override.ceiling ?? null,
    verified_actual_payments: null,
    parent_contract_number: isAmendment ? baseNumber(recordNumber) : null,
    source_url: id ? `https://dmcc.clayclerk.com/Documents/Download/${id}` : 'https://dmcc.clayclerk.com/Documents/Search',
    notes: override.note ?? 'Clerk index metadata verified; document terms and payment chain require document-level review.',
  };
});

const baseNumbers = new Set(preliminary.filter((r) => r.document_type === 'Agreement/Contract').map((r) => baseNumber(r.record_number)));
for (const record of preliminary) {
  if (record.amendment_status === 'FOUND' && baseNumbers.has(record.parent_contract_number)) record.contract_status = 'FOUND';
}

preliminary.push({
  fiscal_year: 'FY2025-26', bid_number: '25/26-087', document_type: 'Procurement award', record_date: '2026-06-24', record_number: null,
  title: 'EMS Medical Supplies — multiple award', normalized_vendor: '10-vendor multiple award', category: 'Fire/EMS', subcategory: null, evidence_basis: 'SUBSTANTIVE OFFICIAL DOCUMENT REVIEWED', substantive_source_url: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2164&doctype=Agenda', procurement_status: 'FOUND', award_status: 'FOUND', contract_status: 'MISSING', amendment_status: 'N/A', po_status: 'MISSING', invoice_status: 'MISSING', payment_status: 'MISSING', approved_amount: null, contract_ceiling: null, verified_actual_payments: null, parent_contract_number: null,
  source_url: 'https://claycounty.novusagenda.com/agendapublic/MeetingView.aspx?MeetingID=2164&doctype=Agenda', notes: 'Unit-price, as-needed award to ten vendors; no single ceiling stated. No executed agreement was matched in the Clerk sweep.'
});

const deduped = [...new Map(preliminary.map((record) => [`${record.document_type}|${record.record_number}|${record.title}`, record])).values()]
  .sort((a, b) => a.record_date.localeCompare(b.record_date) || (a.record_number ?? '').localeCompare(b.record_number ?? ''));

const softwareRecords = deduped.filter((record) => record.category === 'Software/SaaS/Subscriptions/IT');
const categories = Object.fromEntries([...new Set(deduped.map((record) => record.category))].sort().map((name) => [name, deduped.filter((record) => record.category === name).length]));
const summary = {
  as_of: '2026-09-20',
  methodology: 'Evolving research inventory built from 427 official Clerk County Records index rows filed during FY2025-26, plus targeted procurement and BCC agenda cross-references. It is not a claim that every FY2025-26 county agreement or expenditure is represented. An index row proves indexing, not contract terms or payment.',
  documents_examined: rows.length,
  inventory_records: deduped.length,
  distinct_vendors_identified: new Set(deduped.map((record) => record.normalized_vendor).filter(Boolean)).size,
  agreement_rows: deduped.filter((record) => record.document_type === 'Agreement/Contract').length,
  amendment_renewal_rows: deduped.filter((record) => record.document_type === 'Renewals/Extensions/Amendments').length,
  software_records: softwareRecords.length,
  clerk_index_metadata_only: deduped.filter((record) => record.evidence_basis === 'CLERK INDEX METADATA ONLY').length,
  substantive_official_document_reviewed: deduped.filter((record) => record.evidence_basis === 'SUBSTANTIVE OFFICIAL DOCUMENT REVIEWED').length,
  approved_amount_total: deduped.reduce((sum, record) => sum + (record.approved_amount ?? 0), 0),
  verified_actual_payments_identified: 0,
  categories,
};

const output = { meta: summary, records: deduped, softwareRecords };
fs.writeFileSync(path.join(root, 'data/contracts-fy25-26.json'), `${JSON.stringify(output, null, 2)}\n`);

const columns = ['fiscal_year','bid_number','document_type','record_date','record_number','title','normalized_vendor','category','subcategory','evidence_basis','substantive_source_url','procurement_status','award_status','contract_status','amendment_status','po_status','invoice_status','payment_status','approved_amount','contract_ceiling','verified_actual_payments','parent_contract_number','source_url','notes'];
const quote = (value) => value == null ? '' : `"${String(value).replaceAll('"', '""')}"`;
const csv = [columns.join(','), ...deduped.map((record) => columns.map((column) => quote(record[column])).join(','))].join('\n');
fs.mkdirSync(path.join(root, 'public/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/data/fy25-26-contract-inventory.csv'), `${csv}\n`);

console.log(JSON.stringify(summary, null, 2));
